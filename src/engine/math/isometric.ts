import type { StyledShape } from '@/engine/types'
import { round } from '@/engine/shapes'

export interface Vec {
  x: number
  y: number
}

export const ISO_RIGHT: Vec = { x: Math.cos(Math.PI / 6), y: Math.sin(Math.PI / 6) }
export const ISO_LEFT: Vec = { x: -Math.cos(Math.PI / 6), y: Math.sin(Math.PI / 6) }
export const ISO_UP: Vec = { x: 0, y: -1 }

export function isoAdd(a: Vec, b: Vec, s = 1): Vec {
  return { x: a.x + b.x * s, y: a.y + b.y * s }
}

function polyD(points: Vec[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${round(p.x)} ${round(p.y)}`).join(' ') + ' Z'
}

/** One isometric box, drawn as three shaded faces (top/right/left) for a simple 3D look. */
export function isoBlock(origin: Vec, w: number, d: number, h: number, color: string, opacity = 1): StyledShape[] {
  const b00 = origin
  const b10 = isoAdd(origin, ISO_RIGHT, w)
  const b11 = isoAdd(b10, ISO_LEFT, d)
  const b01 = isoAdd(origin, ISO_LEFT, d)
  const t00 = isoAdd(b00, ISO_UP, h)
  const t10 = isoAdd(b10, ISO_UP, h)
  const t11 = isoAdd(b11, ISO_UP, h)
  const t01 = isoAdd(b01, ISO_UP, h)

  return [
    { shape: { kind: 'path', d: polyD([t00, t10, t11, t01]) }, fill: color, opacity },
    { shape: { kind: 'path', d: polyD([t10, b10, b11, t11]) }, fill: color, opacity: opacity * 0.65 },
    { shape: { kind: 'path', d: polyD([t00, t01, b01, b00]) }, fill: color, opacity: opacity * 0.85 },
  ]
}
