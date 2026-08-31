import type { GeneratedDesign, StyledShape } from './types'
import { primitiveMarkup } from './shapes'

function styleAttrs(shape: StyledShape): string {
  const parts: string[] = []
  if (shape.fill) parts.push(`fill="${shape.fill}"`)
  if (shape.stroke) parts.push(`stroke="${shape.stroke}"`)
  if (shape.strokeWidth !== undefined) parts.push(`stroke-width="${shape.strokeWidth}"`)
  if (shape.opacity !== undefined) parts.push(`opacity="${shape.opacity}"`)
  return parts.join(' ')
}

/**
 * Single source of truth: GeneratedDesign -> inner SVG markup (the <g> layers, no outer <svg> tag).
 * Used identically by the editor canvas, thumbnails, and export — guarantees wysiwyg.
 */
export function renderDesignInner(design: GeneratedDesign): string {
  return design.layers
    .filter((layer) => layer.visible)
    .map((layer) => {
      const shapesMarkup = layer.shapes.map((s) => primitiveMarkup(s.shape, styleAttrs(s))).join('')
      return `<g id="${layer.id}" data-layer-name="${layer.name}" opacity="${layer.opacity}">${shapesMarkup}</g>`
    })
    .join('')
}

export interface RenderOptions {
  includeMetadata?: boolean
  background?: string | null
  /** 'fixed' emits explicit pixel width/height (for export); 'fill' emits 100%/100% to scale to its container (for on-screen canvas use). */
  sizeMode?: 'fixed' | 'fill'
}

/** Full standalone <svg>...</svg> document string, suitable for clipboard/export/thumbnails. */
export function renderDesignToSvgString(design: GeneratedDesign, options: RenderOptions = {}): string {
  const { includeMetadata = true, background = null, sizeMode = 'fixed' } = options
  const meta = includeMetadata
    ? ` data-generator="${design.metadata.generatorId}" data-seed="${design.seed}" data-palette="${design.metadata.paletteId}"`
    : ''
  const bg = background ? `<rect width="${design.width}" height="${design.height}" fill="${background}" />` : ''
  const dims = sizeMode === 'fill' ? `width="100%" height="100%"` : `width="${design.width}" height="${design.height}"`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${design.width} ${design.height}" ${dims}${meta}>${bg}${renderDesignInner(design)}</svg>`
}
