export interface StreamPoint {
  x: number
  y: number
}

export interface Velocity {
  vx: number
  vy: number
}

/**
 * Traces one streamline through a velocity field by forward Euler integration, stepping at a fixed
 * length in the field's local direction (not its magnitude) — this is what makes the result read as a
 * flow-line diagram (like iron filings around a magnet) rather than a literal, wildly uneven-speed
 * particle trajectory. Stops early at a field singularity (zero velocity) or the canvas bounds.
 */
export function traceStreamline(
  start: StreamPoint,
  velocity: (x: number, y: number) => Velocity,
  steps: number,
  stepSize: number,
  bounds: { width: number; height: number; margin?: number },
): StreamPoint[] {
  const margin = bounds.margin ?? 40
  const points: StreamPoint[] = [start]
  let { x, y } = start
  for (let i = 0; i < steps; i++) {
    const { vx, vy } = velocity(x, y)
    const speed = Math.hypot(vx, vy)
    if (speed < 1e-6) break
    x += (vx / speed) * stepSize
    y += (vy / speed) * stepSize
    if (x < -margin || x > bounds.width + margin || y < -margin || y > bounds.height + margin) break
    points.push({ x, y })
  }
  return points
}

export function streamlineToPathD(points: StreamPoint[]): string {
  if (points.length < 2) return ''
  return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} ` + points.slice(1).map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `).join('')
}
