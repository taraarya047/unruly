import type { Rng } from '@/engine/prng'

/** Cheap seeded 2D value-noise approximation — a sum of phase-shifted sine waves (no external deps). */
export function makeNoiseField(rng: Rng, octaves = 4) {
  const terms = Array.from({ length: octaves }, (_, i) => ({
    fx: rng.range(0.002, 0.01) * (i + 1),
    fy: rng.range(0.002, 0.01) * (i + 1),
    phase: rng.range(0, Math.PI * 2),
    weight: 1 / (i + 1),
  }))
  const totalWeight = terms.reduce((s, t) => s + t.weight, 0)
  return (x: number, y: number): number => {
    let sum = 0
    for (const t of terms) sum += Math.sin(x * t.fx + y * t.fy + t.phase) * t.weight
    return sum / totalWeight // roughly [-1, 1]
  }
}

/** Fractal-summed noise for terrain-like height fields, in [-1, 1]. */
export function makeHeightField(rng: Rng, centers = 3) {
  const wells = Array.from({ length: centers }, () => ({
    x: rng.range(0.15, 0.85),
    y: rng.range(0.15, 0.85),
    r: rng.range(0.2, 0.5),
    sign: rng.bool(0.75) ? 1 : -1,
  }))
  const field = makeNoiseField(rng, 3)
  return (nx: number, ny: number): number => {
    let h = field(nx * 800, ny * 800) * 0.3
    for (const w of wells) {
      const d = Math.hypot(nx - w.x, ny - w.y) / w.r
      h += w.sign * Math.max(0, 1 - d * d)
    }
    return Math.max(-1, Math.min(1, h))
  }
}
