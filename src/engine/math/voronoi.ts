import type { Point } from './points'

export interface VoronoiCell {
  site: Point
  polygon: Point[]
}

/** Clips a convex polygon to the half-plane closer to `site` than `other` (Sutherland-Hodgman). */
function clipToHalfPlane(polygon: Point[], site: Point, other: Point): Point[] {
  // Perpendicular bisector: point p is kept if dot(p - mid, dir) <= 0, dir = other - site.
  const mid = { x: (site.x + other.x) / 2, y: (site.y + other.y) / 2 }
  const dir = { x: other.x - site.x, y: other.y - site.y }
  const inside = (p: Point) => (p.x - mid.x) * dir.x + (p.y - mid.y) * dir.y <= 0

  const output: Point[] = []
  for (let i = 0; i < polygon.length; i++) {
    const curr = polygon[i]
    const prev = polygon[(i - 1 + polygon.length) % polygon.length]
    const currIn = inside(curr)
    const prevIn = inside(prev)
    if (currIn) {
      if (!prevIn) output.push(intersect(prev, curr, mid, dir))
      output.push(curr)
    } else if (prevIn) {
      output.push(intersect(prev, curr, mid, dir))
    }
  }
  return output
}

function intersect(p1: Point, p2: Point, mid: Point, dir: { x: number; y: number }): Point {
  const d1 = (p1.x - mid.x) * dir.x + (p1.y - mid.y) * dir.y
  const d2 = (p2.x - mid.x) * dir.x + (p2.y - mid.y) * dir.y
  const t = d1 / (d1 - d2 || 1e-10)
  return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) }
}

/**
 * Voronoi cells via half-plane intersection — for each site, clip the bounding rect against the
 * perpendicular bisector of every other (nearby) site. O(n^2) but n stays small (≤150) in these generators.
 */
export function voronoiCells(sites: Point[], width: number, height: number): VoronoiCell[] {
  const pad = Math.max(width, height)
  const cells: VoronoiCell[] = []
  for (const site of sites) {
    let polygon: Point[] = [
      { x: -pad, y: -pad },
      { x: width + pad, y: -pad },
      { x: width + pad, y: height + pad },
      { x: -pad, y: height + pad },
    ]
    // Only clip against reasonably nearby sites for performance/robustness.
    const others = sites
      .filter((o) => o !== site)
      .map((o) => ({ o, d: (o.x - site.x) ** 2 + (o.y - site.y) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 24)
      .map((e) => e.o)
    for (const other of others) {
      polygon = clipToHalfPlane(polygon, site, other)
      if (polygon.length === 0) break
    }
    if (polygon.length >= 3) cells.push({ site, polygon })
  }
  return cells
}
