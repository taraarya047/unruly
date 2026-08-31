import type { Rng } from '@/engine/prng'

export interface Point {
  x: number
  y: number
}

/** Uniformly scattered random points. */
export function randomPoints(rng: Rng, count: number, width: number, height: number): Point[] {
  return Array.from({ length: count }, () => ({ x: rng.range(0, width), y: rng.range(0, height) }))
}

/** Jittered grid points — more even coverage than pure random, still organic. */
export function jitteredGridPoints(rng: Rng, count: number, width: number, height: number, jitter: number): Point[] {
  const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)))
  const rows = Math.max(1, Math.ceil(count / cols))
  const cellW = width / cols
  const cellH = height / rows
  const points: Point[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (points.length >= count) break
      const jx = rng.range(-jitter, jitter) * cellW * 0.5
      const jy = rng.range(-jitter, jitter) * cellH * 0.5
      points.push({ x: c * cellW + cellW / 2 + jx, y: r * cellH + cellH / 2 + jy })
    }
  }
  return points
}
