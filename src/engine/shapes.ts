import type { ShapePrimitive } from './types'
import { createRng } from './prng'

function polygonPoints(cx: number, cy: number, r: number, sides: number, rotation = 0): string {
  const pts: string[] = []
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * Math.PI * 2 - Math.PI / 2
    pts.push(`${round(cx + Math.cos(a) * r)},${round(cy + Math.sin(a) * r)}`)
  }
  return pts.join(' ')
}

function starPoints(cx: number, cy: number, rOuter: number, rInner: number, points: number, rotation = 0): string {
  const pts: string[] = []
  const step = Math.PI / points
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const a = rotation + i * step - Math.PI / 2
    pts.push(`${round(cx + Math.cos(a) * r)},${round(cy + Math.sin(a) * r)}`)
  }
  return pts.join(' ')
}

/** Smooth closed blob path through jittered points around a circle, via cubic bezier. */
export function blobPath(cx: number, cy: number, r: number, points: number, irregularity: number, seed: number): string {
  const rng = createRng(seed)
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2
    const rr = r * (1 + rng.range(-irregularity, irregularity))
    pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr })
  }
  const n = pts.length
  const smoothing = 0.2
  let d = `M ${round(pts[0].x)} ${round(pts[0].y)} `
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1x = p1.x + (p2.x - p0.x) * smoothing
    const c1y = p1.y + (p2.y - p0.y) * smoothing
    const c2x = p2.x - (p3.x - p1.x) * smoothing
    const c2y = p2.y - (p3.y - p1.y) * smoothing
    d += `C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)} `
  }
  return d + 'Z'
}

export function round(n: number): number {
  return Math.round(n * 100) / 100
}

/** Renders a single shape primitive to an SVG element markup fragment, with optional style attrs injected. */
export function primitiveMarkup(shape: ShapePrimitive, attrs = ''): string {
  const markup = renderPrimitive(shape)
  return attrs ? markup.replace(/ \/>$/, ` ${attrs} />`) : markup
}

function renderPrimitive(shape: ShapePrimitive): string {
  switch (shape.kind) {
    case 'circle':
      return `<circle cx="${round(shape.cx)}" cy="${round(shape.cy)}" r="${round(shape.r)}" />`
    case 'ring':
      return `<circle cx="${round(shape.cx)}" cy="${round(shape.cy)}" r="${round(shape.r)}" fill="none" stroke-width="${round(shape.strokeWidth)}" />`
    case 'rect': {
      const rot = shape.rotation
        ? ` transform="rotate(${round(shape.rotation)} ${round(shape.x + shape.w / 2)} ${round(shape.y + shape.h / 2)})"`
        : ''
      return `<rect x="${round(shape.x)}" y="${round(shape.y)}" width="${round(shape.w)}" height="${round(shape.h)}" rx="${round(shape.rx ?? 0)}"${rot} />`
    }
    case 'polygon':
      return `<polygon points="${polygonPoints(shape.cx, shape.cy, shape.r, shape.sides, shape.rotation)}" />`
    case 'star':
      return `<polygon points="${starPoints(shape.cx, shape.cy, shape.rOuter, shape.rInner, shape.points, shape.rotation)}" />`
    case 'line':
      return `<line x1="${round(shape.x1)}" y1="${round(shape.y1)}" x2="${round(shape.x2)}" y2="${round(shape.y2)}" />`
    case 'path':
      return `<path d="${shape.d}" />`
    case 'blob':
      return `<path d="${blobPath(shape.cx, shape.cy, shape.r, shape.points, shape.irregularity, shape.seed)}" />`
    case 'arc': {
      const x1 = shape.cx + Math.cos(shape.startAngle) * shape.r
      const y1 = shape.cy + Math.sin(shape.startAngle) * shape.r
      const x2 = shape.cx + Math.cos(shape.endAngle) * shape.r
      const y2 = shape.cy + Math.sin(shape.endAngle) * shape.r
      const large = shape.endAngle - shape.startAngle > Math.PI ? 1 : 0
      return `<path d="M ${round(x1)} ${round(y1)} A ${round(shape.r)} ${round(shape.r)} 0 ${large} 1 ${round(x2)} ${round(y2)}" />`
    }
  }
}
