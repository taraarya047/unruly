import type { GeneratedDesign, SVGLayer } from './types'
import type { Palette } from '@/palette/types'
import { generatorRegistry } from './registry'
import type { GeneratorLayerConfig } from '@/state/useDesignStore'

/**
 * Runs each stacked generator layer's own generator and flattens its output into a single SVGLayer
 * (one <g> per generator layer, so its blend mode/opacity apply once against whatever is beneath it —
 * see the isolation:isolate note in engine/render.ts). Layers with an unknown/removed generatorId are
 * skipped rather than throwing, since generatorLayers can outlive a generator across app versions.
 */
function renderGeneratorLayer(layer: GeneratorLayerConfig, palette: Palette): SVGLayer | null {
  const generator = generatorRegistry.get(layer.generatorId)
  if (!generator) return null
  const raw = generator.generate(layer.parameters, layer.seed, palette.colors)
  const shapes = raw.layers
    .filter((l) => l.visible)
    .flatMap((l) => l.shapes.map((s) => ({ ...s, opacity: (s.opacity ?? 1) * l.opacity })))
  return {
    id: layer.id,
    name: generator.name,
    visible: layer.visible,
    locked: false,
    opacity: layer.opacity,
    blendMode: layer.blendMode,
    shapes,
  }
}

/** Appends the stacked generator layers on top of an already-composed base design. */
export function mergeGeneratorLayers(base: GeneratedDesign, extraLayers: GeneratorLayerConfig[], palette: Palette): GeneratedDesign {
  if (extraLayers.length === 0) return base
  const rendered = extraLayers.map((l) => renderGeneratorLayer(l, palette)).filter((l): l is SVGLayer => l !== null)
  return { ...base, layers: [...base.layers, ...rendered] }
}
