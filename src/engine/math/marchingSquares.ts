export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface SampledGrid {
  values: number[][]
  cols: number
  rows: number
  cellW: number
  cellH: number
}

/**
 * Samples `field` once on a resolution x resolution grid. Reuse the result across multiple contour
 * thresholds (e.g. a topographic map's many contour lines) instead of resampling an expensive noise
 * field once per threshold — see marchingSquaresFromGrid.
 */
export function sampleGrid(field: (x: number, y: number) => number, width: number, height: number, resolution: number): SampledGrid {
  const cols = resolution
  const rows = Math.round((resolution * height) / width)
  const cellW = width / cols
  const cellH = height / rows
  const values: number[][] = []
  for (let r = 0; r <= rows; r++) {
    const row: number[] = []
    for (let c = 0; c <= cols; c++) row.push(field(c * cellW, r * cellH))
    values.push(row)
  }
  return { values, cols, rows, cellW, cellH }
}

/** Marching squares contour extraction against an already-sampled grid (see sampleGrid). */
export function marchingSquaresFromGrid(grid: SampledGrid, threshold: number): Segment[] {
  const { values, cols, rows, cellW, cellH } = grid
  const lerp = (a: number, b: number, va: number, vb: number) => a + ((threshold - va) / (vb - va || 1e-6)) * (b - a)

  const segments: Segment[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = values[r][c]
      const tr = values[r][c + 1]
      const br = values[r + 1][c + 1]
      const bl = values[r + 1][c]
      const x0 = c * cellW
      const x1 = x0 + cellW
      const y0 = r * cellH
      const y1 = y0 + cellH

      let idx = 0
      if (tl > threshold) idx |= 8
      if (tr > threshold) idx |= 4
      if (br > threshold) idx |= 2
      if (bl > threshold) idx |= 1
      if (idx === 0 || idx === 15) continue

      const top = { x: lerp(x0, x1, tl, tr), y: y0 }
      const right = { x: x1, y: lerp(y0, y1, tr, br) }
      const bottom = { x: lerp(x0, x1, bl, br), y: y1 }
      const left = { x: x0, y: lerp(y0, y1, tl, bl) }

      const add = (p1: { x: number; y: number }, p2: { x: number; y: number }) => segments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })

      switch (idx) {
        case 1: add(left, bottom); break
        case 2: add(bottom, right); break
        case 3: add(left, right); break
        case 4: add(top, right); break
        case 5: add(top, left); add(bottom, right); break
        case 6: add(top, bottom); break
        case 7: add(top, left); break
        case 8: add(left, top); break
        case 9: add(bottom, top); break
        case 10: add(left, bottom); add(top, right); break
        case 11: add(right, top); break
        case 12: add(left, right); break
        case 13: add(bottom, right); break
        case 14: add(left, bottom); break
      }
    }
  }
  return segments
}

/** Convenience one-shot version for callers that only need a single threshold. */
export function marchingSquares(field: (x: number, y: number) => number, width: number, height: number, resolution: number, threshold: number): Segment[] {
  return marchingSquaresFromGrid(sampleGrid(field, width, height, resolution), threshold)
}

export function segmentsToPathD(segments: Segment[]): string {
  return segments.map((s) => `M ${round(s.x1)} ${round(s.y1)} L ${round(s.x2)} ${round(s.y2)} `).join('')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
