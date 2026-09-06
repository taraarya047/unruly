import type { Rng } from '@/engine/prng'

// Structured, not pre-built path strings — a naive text/regex transform of an SVG path is a trap for
// arc commands specifically (radii and flags aren't coordinate pairs and must never be rotated or
// translated the way endpoints are), so strokes stay as typed data until placeGlyph resolves them.
export type GlyphStroke =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'arc'; cx: number; cy: number; r: number; startAngle: number; endAngle: number }

/**
 * Builds one abstract pseudo-letterform from a small fixed vocabulary of stroke primitives (stem, bar,
 * diagonal, bowl, dot) in a normalized -1..1 box — a real grammar reused across generators, not
 * independently-random shapes each time, which is what keeps a field of these reading as one alien
 * alphabet rather than noise.
 */
export function buildGlyph(rng: Rng, complexity: number): GlyphStroke[] {
  const strokeCount = 2 + Math.round(complexity * 4)
  const strokes: GlyphStroke[] = []
  for (let i = 0; i < strokeCount; i++) {
    const kind = rng.pick(['stem', 'bar', 'diagonal', 'bowl', 'dot'] as const)
    switch (kind) {
      case 'stem': {
        const x = rng.range(-0.7, 0.7)
        strokes.push({ kind: 'line', x1: x, y1: -0.9, x2: x, y2: 0.9 })
        break
      }
      case 'bar': {
        const y = rng.range(-0.7, 0.7)
        strokes.push({ kind: 'line', x1: rng.range(-0.9, -0.1), y1: y, x2: rng.range(0.1, 0.9), y2: y })
        break
      }
      case 'diagonal':
        strokes.push({ kind: 'line', x1: rng.range(-0.8, 0), y1: rng.range(-0.8, 0.8), x2: rng.range(0, 0.8), y2: rng.range(-0.8, 0.8) })
        break
      case 'bowl': {
        const startAngle = rng.range(0, Math.PI * 2)
        strokes.push({
          kind: 'arc',
          cx: rng.range(-0.3, 0.3),
          cy: rng.range(-0.3, 0.3),
          r: rng.range(0.25, 0.55),
          startAngle,
          endAngle: startAngle + rng.range(Math.PI * 0.6, Math.PI * 1.6),
        })
        break
      }
      case 'dot': {
        const x = rng.range(-0.6, 0.6)
        const y = rng.range(-0.6, 0.6)
        strokes.push({ kind: 'arc', cx: x, cy: y, r: 0.06, startAngle: 0, endAngle: Math.PI * 1.999 })
        break
      }
    }
  }
  return strokes
}

/**
 * Transforms a glyph's normalized -1..1 strokes into screen-space path `d` strings around (cx, cy).
 * `mirrorX` reflects the glyph about its own local vertical axis *before* rotation/translation — doing
 * the reflection in local space (not by negating `scale`, which would point-reflect through the origin
 * instead of mirroring left-right) is what keeps it composing correctly with rotation.
 */
export function placeGlyph(strokes: GlyphStroke[], cx: number, cy: number, scale: number, rotation: number, mirrorX = false): string[] {
  const flip = mirrorX ? -1 : 1
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const point = (x: number, y: number) => {
    const sx = x * flip * scale
    const sy = y * scale
    return { x: cx + sx * cos - sy * sin, y: cy + sx * sin + sy * cos }
  }
  return strokes.map((s) => {
    if (s.kind === 'line') {
      const p1 = point(s.x1, s.y1)
      const p2 = point(s.x2, s.y2)
      return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    }
    const center = point(s.cx, s.cy)
    const r = s.r * scale
    // Mirroring a point (cos theta, sin theta) about the local x=0 axis is equivalent to replacing
    // theta with (pi - theta) — applying that before adding rotation keeps the swept arc direction
    // (and therefore the fixed sweep-flag below) geometrically consistent.
    const start = mirrorX ? Math.PI - s.startAngle : s.startAngle
    const end = mirrorX ? Math.PI - s.endAngle : s.endAngle
    const a1 = start + rotation
    const a2 = end + rotation
    const p1 = { x: center.x + Math.cos(a1) * r, y: center.y + Math.sin(a1) * r }
    const p2 = { x: center.x + Math.cos(a2) * r, y: center.y + Math.sin(a2) * r }
    const large = Math.abs(end - start) > Math.PI ? 1 : 0
    return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  })
}
