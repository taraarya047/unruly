import type { GeneratedDesign, SVGLayer } from './types'
import type { Palette } from '@/palette/types'

export interface LayerOverride {
  visible?: boolean
  locked?: boolean
  opacity?: number
}

export interface LayerState {
  /** Per-layer visibility/lock/opacity edits, keyed by layer id (including 'background'). */
  overrides: Record<string, LayerOverride>
  /** Custom stacking order (layer ids, back to front). null = generator's natural order. */
  order: string[] | null
  /** User-duplicated layers — frozen copies, independent of regeneration. */
  extraLayers: SVGLayer[]
}

export function defaultLayerState(): LayerState {
  return { overrides: {}, order: null, extraLayers: [] }
}

export const BACKGROUND_LAYER_ID = 'background'

function backgroundLayer(design: GeneratedDesign, palette: Palette): SVGLayer {
  return {
    id: BACKGROUND_LAYER_ID,
    name: 'Background',
    visible: true,
    locked: false,
    opacity: 1,
    shapes: [{ shape: { kind: 'rect', x: 0, y: 0, w: design.width, h: design.height }, fill: palette.background }],
  }
}

/** Merges the generator's output with the synthetic background layer, user overrides, custom order, and duplicates. */
export function composeLayers(design: GeneratedDesign, palette: Palette, layerState: LayerState): GeneratedDesign {
  let layers: SVGLayer[] = [backgroundLayer(design, palette), ...design.layers, ...layerState.extraLayers]

  layers = layers.map((layer) => {
    const o = layerState.overrides[layer.id]
    if (!o) return layer
    return {
      ...layer,
      visible: o.visible ?? layer.visible,
      locked: o.locked ?? layer.locked,
      opacity: o.opacity ?? layer.opacity,
    }
  })

  if (layerState.order) {
    const order = layerState.order
    const indexOf = new Map(order.map((id, i) => [id, i]))
    layers = [...layers].sort((a, b) => (indexOf.get(a.id) ?? Infinity) - (indexOf.get(b.id) ?? Infinity))
  }

  return { ...design, layers }
}
