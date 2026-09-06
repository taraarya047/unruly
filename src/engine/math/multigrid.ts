export interface Point {
  x: number
  y: number
}

export interface Rhomb {
  /** Always 4 points, in order around the tile. */
  vertices: Point[]
  /** Which two of the N grid line-families produced this tile — its shape is determined entirely by
   *  how far apart these two indices are (e.g. Penrose's "thick"/"thin" rhombi are |i-j| vs the rest). */
  families: [number, number]
}

/**
 * De Bruijn's multigrid method for generating N-fold quasiperiodic rhombus tilings — Penrose (N=5) and
 * Ammann-Beenker (N=4) are the same algorithm with a different N, not different code. N families of
 * parallel lines are laid out at angle k*pi/N; every pair of lines from two different families crosses
 * at a point, and each crossing dualizes into one rhombus tile whose four vertices are found by reading
 * off the integer "grid index" at that point along all N directions. This is purely algebraic (no
 * recursive substitution to get subtly wrong), which is why it's the more robust of the two classic ways
 * to construct these tilings by hand.
 */
export function deBruijnMultigrid(symmetry: number, offsets: number[], range: number): Rhomb[] {
  const dirs = Array.from({ length: symmetry }, (_, k) => {
    const angle = (k * Math.PI) / symmetry
    return { x: Math.cos(angle), y: Math.sin(angle) }
  })

  const rhombs: Rhomb[] = []
  for (let j = 0; j < symmetry; j++) {
    for (let k = j + 1; k < symmetry; k++) {
      const dj = dirs[j]
      const dk = dirs[k]
      const det = dj.x * dk.y - dj.y * dk.x
      if (Math.abs(det) < 1e-9) continue
      for (let nj = -range; nj <= range; nj++) {
        for (let nk = -range; nk <= range; nk++) {
          const cj = nj + offsets[j]
          const ck = nk + offsets[k]
          // Intersection of line_j (dot(p,dj)=cj) and line_k (dot(p,dk)=ck), via Cramer's rule.
          const px = (cj * dk.y - ck * dj.y) / det
          const py = (dj.x * ck - dk.x * cj) / det
          // Every other family's integer index is frozen at this crossing; only j and k vary across
          // the tile's four corners.
          const frozen = dirs.map((d, i) => (i === j || i === k ? 0 : Math.ceil(px * d.x + py * d.y - offsets[i])))
          const vertices: Point[] = ([[0, 0], [1, 0], [1, 1], [0, 1]] as const).map(([dJ, dK]) => {
            let x = 0
            let y = 0
            for (let i = 0; i < symmetry; i++) {
              const K = i === j ? nj + dJ : i === k ? nk + dK : frozen[i]
              x += K * dirs[i].x
              y += K * dirs[i].y
            }
            return { x, y }
          })
          rhombs.push({ vertices, families: [j, k] })
        }
      }
    }
  }
  return rhombs
}
