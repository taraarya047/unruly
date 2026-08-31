export interface AttractorPoint {
  x: number
  y: number
}

/** Lorenz system, projected to the x/z plane. Classic butterfly shape. */
export function lorenzPoints(iterations: number, sigma: number, rho: number, beta: number, dt = 0.008): AttractorPoint[] {
  let x = 0.1,
    y = 0,
    z = 0
  const points: AttractorPoint[] = []
  const n = Math.min(iterations, 20000)
  for (let i = 0; i < n; i++) {
    const dx = sigma * (y - x)
    const dy = x * (rho - z) - y
    const dz = x * y - beta * z
    x += dx * dt
    y += dy * dt
    z += dz * dt
    points.push({ x, y: z })
  }
  return points
}

/** Clifford attractor: x' = sin(a y) + c cos(a x), y' = sin(b x) + d cos(b y). */
export function cliffordPoints(iterations: number, a: number, b: number, c: number, d: number): AttractorPoint[] {
  let x = 0.1,
    y = 0.1
  const points: AttractorPoint[] = []
  const n = Math.min(iterations, 30000)
  for (let i = 0; i < n; i++) {
    const nx = Math.sin(a * y) + c * Math.cos(a * x)
    const ny = Math.sin(b * x) + d * Math.cos(b * y)
    x = nx
    y = ny
    points.push({ x, y })
  }
  return points
}

/** De Jong attractor: x' = sin(a y) - cos(b x), y' = sin(c x) - cos(d y). */
export function deJongPoints(iterations: number, a: number, b: number, c: number, d: number): AttractorPoint[] {
  let x = 0.1,
    y = 0.1
  const points: AttractorPoint[] = []
  const n = Math.min(iterations, 30000)
  for (let i = 0; i < n; i++) {
    const nx = Math.sin(a * y) - Math.cos(b * x)
    const ny = Math.sin(c * x) - Math.cos(d * y)
    x = nx
    y = ny
    points.push({ x, y })
  }
  return points
}

export function boundsOf(points: AttractorPoint[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  if (!Number.isFinite(minX)) return { minX: -1, maxX: 1, minY: -1, maxY: 1 }
  return { minX, maxX, minY, maxY }
}
