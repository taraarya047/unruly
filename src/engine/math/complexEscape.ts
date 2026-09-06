/**
 * Shared escape-time iteration for z_(n+1) = z^2 + c, used by both Mandelbrot Landscape (c varies per
 * pixel, z0 = 0) and Julia Orbits (c fixed, z0 varies per pixel) — the two classic fractals differ only
 * in which value is swept across the plane, so this is the one place the actual math lives.
 */
export function escapeIterations(cx: number, cy: number, zx0: number, zy0: number, maxIter: number, bailout = 4): number {
  let x = zx0
  let y = zy0
  let iter = 0
  while (x * x + y * y <= bailout && iter < maxIter) {
    const xt = x * x - y * y + cx
    y = 2 * x * y + cy
    x = xt
    iter++
  }
  return iter
}
