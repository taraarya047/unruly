// Framework-independent keyframe/easing math for the animation timeline. No React imports — see
// ARCHITECTURE.md's "engine never imports React" rule. state/useAnimationStore.ts is the consumer.

export interface BezierPoints {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface Keyframe {
  id: string
  /** Seconds, 0..track duration. */
  time: number
  value: number
  /** Easing of the segment leading INTO this keyframe from the previous one (ignored on the first keyframe). */
  easing: BezierPoints
}

export type EasingPresetName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

// Same control points as the CSS keyword equivalents, so the feel matches what designers already expect.
export const EASING_PRESETS: Record<EasingPresetName, BezierPoints> = {
  linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
  'ease-in': { x1: 0.42, y1: 0, x2: 1, y2: 1 },
  'ease-out': { x1: 0, y1: 0, x2: 0.58, y2: 1 },
  'ease-in-out': { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
}

/** One-dimensional cubic bezier point: p0=0, p3=1 fixed (standard timing-function convention). */
export function cubicBezierComponent(t: number, p1: number, p2: number): number {
  const mt = 1 - t
  return 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t
}

/**
 * Returns a function mapping normalized time x -> eased progress y, matching CSS cubic-bezier()
 * semantics. Solves for t at a given x via Newton-Raphson (falls back to bisection) since a bezier
 * timing function is defined parametrically, not as a direct y-of-x formula.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const sampleDerivX = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  function solveT(x: number): number {
    let t = x
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x
      if (Math.abs(dx) < 1e-6) return t
      const d = sampleDerivX(t)
      if (Math.abs(d) < 1e-6) break
      t -= dx / d
    }
    let lo = 0
    let hi = 1
    t = x
    while (hi - lo > 1e-6) {
      const xEst = sampleX(t)
      if (xEst < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return t
  }

  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    return sampleY(solveT(x))
  }
}

/** Interpolated value of a (time-sorted) keyframe track at `time`. NaN for an empty track. */
export function evaluateTrack(keyframes: Keyframe[], time: number): number {
  if (keyframes.length === 0) return NaN
  if (keyframes.length === 1) return keyframes[0].value
  const first = keyframes[0]
  const last = keyframes[keyframes.length - 1]
  if (time <= first.time) return first.value
  if (time >= last.time) return last.value
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]
    const b = keyframes[i + 1]
    if (time >= a.time && time <= b.time) {
      const span = b.time - a.time
      const localT = span === 0 ? 1 : (time - a.time) / span
      const eased = cubicBezier(b.easing.x1, b.easing.y1, b.easing.x2, b.easing.y2)(localT)
      return a.value + (b.value - a.value) * eased
    }
  }
  return last.value
}
