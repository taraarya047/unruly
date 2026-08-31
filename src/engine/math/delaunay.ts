import type { Point } from './points'

export interface Triangle {
  a: Point
  b: Point
  c: Point
}

interface Edge {
  p1: Point
  p2: Point
}

function circumcircle(t: Triangle) {
  const { a, b, c } = t
  const ax2 = a.x * a.x + a.y * a.y
  const bx2 = b.x * b.x + b.y * b.y
  const cx2 = c.x * c.x + c.y * c.y
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
  if (Math.abs(d) < 1e-10) return null
  const ux = (ax2 * (b.y - c.y) + bx2 * (c.y - a.y) + cx2 * (a.y - b.y)) / d
  const uy = (ax2 * (c.x - b.x) + bx2 * (a.x - c.x) + cx2 * (b.x - a.x)) / d
  const r = Math.hypot(a.x - ux, a.y - uy)
  return { x: ux, y: uy, r }
}

function edgesEqual(e1: Edge, e2: Edge): boolean {
  return (e1.p1 === e2.p1 && e1.p2 === e2.p2) || (e1.p1 === e2.p2 && e1.p2 === e2.p1)
}

/** Bowyer-Watson incremental Delaunay triangulation. O(n^2) worst case — fine for the point counts these generators use (≤150). */
export function delaunayTriangulate(points: Point[], width: number, height: number): Triangle[] {
  if (points.length < 3) return []

  const margin = Math.max(width, height) * 10
  const superA: Point = { x: -margin, y: -margin }
  const superB: Point = { x: width + margin, y: -margin }
  const superC: Point = { x: width / 2, y: height + margin }

  let triangles: Triangle[] = [{ a: superA, b: superB, c: superC }]

  for (const p of points) {
    const bad: Triangle[] = []
    for (const t of triangles) {
      const cc = circumcircle(t)
      if (cc && Math.hypot(p.x - cc.x, p.y - cc.y) < cc.r) bad.push(t)
    }

    const polygon: Edge[] = []
    for (const t of bad) {
      const edges: Edge[] = [
        { p1: t.a, p2: t.b },
        { p1: t.b, p2: t.c },
        { p1: t.c, p2: t.a },
      ]
      for (const e of edges) {
        const sharedByOther = bad.some((other) => other !== t && [{ p1: other.a, p2: other.b }, { p1: other.b, p2: other.c }, { p1: other.c, p2: other.a }].some((oe) => edgesEqual(oe, e)))
        if (!sharedByOther) polygon.push(e)
      }
    }

    triangles = triangles.filter((t) => !bad.includes(t))
    for (const e of polygon) triangles.push({ a: e.p1, b: e.p2, c: p })
  }

  return triangles.filter((t) => t.a !== superA && t.a !== superB && t.a !== superC && t.b !== superA && t.b !== superB && t.b !== superC && t.c !== superA && t.c !== superB && t.c !== superC)
}
