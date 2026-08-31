import type { GeneratedDesign } from '@/engine/types'
import { renderDesignInner } from '@/engine/render'
import type { Palette } from '@/palette/types'
import type { CompositionState, SafeZoneSide } from './types'
import { LAYOUT_PRESETS } from './types'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function safeZoneRect(side: SafeZoneSide, w: number, h: number): Rect | null {
  switch (side) {
    case 'left':
      return { x: 0, y: 0, w: w * 0.42, h }
    case 'right':
      return { x: w * 0.58, y: 0, w: w * 0.42, h }
    case 'center':
      return { x: w * 0.2, y: 0, w: w * 0.6, h }
    case 'top':
      return { x: 0, y: 0, w, h: h * 0.34 }
    case 'bottom':
      return { x: 0, y: h * 0.66, w, h: h * 0.34 }
    case 'none':
      return null
  }
}

function artworkTransform(design: GeneratedDesign, comp: CompositionState) {
  const layout = LAYOUT_PRESETS.find((l) => l.id === comp.layoutId) ?? LAYOUT_PRESETS[0]
  const margin = layout.margin ?? 0
  const effW = comp.canvasWidth * (1 - margin * 2)
  const effH = comp.canvasHeight * (1 - margin * 2)
  const fit = layout.fitMode === 'cover' ? Math.max(effW / design.width, effH / design.height) : Math.min(effW / design.width, effH / design.height)
  const scale = fit * comp.scale
  const scaledW = design.width * scale
  const scaledH = design.height * scale
  const tx = (comp.canvasWidth - scaledW) * comp.focalX
  const ty = (comp.canvasHeight - scaledH) * comp.focalY
  return { scale, tx, ty, layout }
}

function clipPathMarkup(id: string, clipShape: string, w: number, h: number): string {
  switch (clipShape) {
    case 'circle': {
      const r = Math.min(w, h) * 0.46
      return `<clipPath id="${id}"><circle cx="${w / 2}" cy="${h / 2}" r="${r}" /></clipPath>`
    }
    case 'half-left':
      return `<clipPath id="${id}"><rect x="0" y="0" width="${w / 2}" height="${h}" /></clipPath>`
    case 'half-right':
      return `<clipPath id="${id}"><rect x="${w / 2}" y="0" width="${w / 2}" height="${h}" /></clipPath>`
    default:
      return `<clipPath id="${id}"><rect x="0" y="0" width="${w}" height="${h}" /></clipPath>`
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Picks black or white text for readable contrast against a given hex background. */
function readableTextColor(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex)
  if (!m) return '#171512'
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.55 ? '#171512' : '#f7f5f0'
}

function textMarkup(comp: CompositionState, background: string): string {
  const rect = safeZoneRect(comp.safeZone, comp.canvasWidth, comp.canvasHeight)
  if (!comp.text.enabled || !rect) return ''
  const pad = Math.min(rect.w, rect.h) * 0.1
  const anchor = comp.text.align === 'left' ? 'start' : comp.text.align === 'right' ? 'end' : 'middle'
  const textX = comp.text.align === 'left' ? rect.x + pad : comp.text.align === 'right' ? rect.x + rect.w - pad : rect.x + rect.w / 2
  const headingSize = Math.max(18, rect.w * 0.09)
  const bodySize = headingSize * 0.42
  const centerY = rect.y + rect.h / 2
  const scrim = `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${background}" opacity="0.78" />`
  const heading = comp.text.heading
    ? `<text x="${textX}" y="${centerY - bodySize}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-weight="700" font-size="${headingSize}" text-anchor="${anchor}" fill="currentColor">${escapeXml(comp.text.heading)}</text>`
    : ''
  const body = comp.text.body
    ? `<text x="${textX}" y="${centerY + bodySize * 1.6}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-weight="400" font-size="${bodySize}" text-anchor="${anchor}" fill="currentColor" opacity="0.72">${escapeXml(comp.text.body)}</text>`
    : ''
  return `<g id="text" color="${readableTextColor(background)}">${scrim}${heading}${body}</g>`
}

/** Renders the full composed poster/hero/social SVG — background, clipped+transformed artwork, optional text layer. */
export function renderCompositionToSvgString(design: GeneratedDesign, palette: Palette, comp: CompositionState): string {
  const { scale, tx, ty, layout } = artworkTransform(design, comp)
  const clipId = 'compose-clip'
  const cx = comp.canvasWidth / 2
  const cy = comp.canvasHeight / 2
  const rotation = comp.rotation !== 0 ? comp.rotation : layout.rotation

  const artwork = `<g clip-path="url(#${clipId})"><g transform="rotate(${rotation} ${cx} ${cy})"><g transform="translate(${tx} ${ty}) scale(${scale})">${renderDesignInner(design)}</g></g></g>`

  const defs = `<defs>${clipPathMarkup(clipId, layout.clipShape, comp.canvasWidth, comp.canvasHeight)}</defs>`
  const background = `<rect width="${comp.canvasWidth}" height="${comp.canvasHeight}" fill="${palette.background}" />`
  const text = textMarkup(comp, palette.background)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${comp.canvasWidth} ${comp.canvasHeight}" width="${comp.canvasWidth}" height="${comp.canvasHeight}">${defs}${background}${artwork}${text}</svg>`
}
