import { useMemo } from 'react'
import { generatorRegistry } from '@/engine/registry'
import { useDesignStore } from '@/state/useDesignStore'
import { composeLayers } from '@/engine/composeLayers'
import { mergeGeneratorLayers } from '@/engine/composeGeneratorLayers'
import type { GeneratedDesign } from '@/engine/types'

export function useCurrentDesign(): GeneratedDesign {
  const generatorId = useDesignStore((s) => s.generatorId)
  const parameters = useDesignStore((s) => s.parameters)
  const seed = useDesignStore((s) => s.seed)
  const palette = useDesignStore((s) => s.palette)
  const layers = useDesignStore((s) => s.layers)
  const generatorLayers = useDesignStore((s) => s.generatorLayers)

  return useMemo(() => {
    const generator = generatorRegistry.get(generatorId)!
    const rawDesign = generator.generate(parameters, seed, palette.colors)
    rawDesign.metadata.paletteId = palette.id
    const composed = composeLayers(rawDesign, palette, layers)
    return mergeGeneratorLayers(composed, generatorLayers, palette)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatorId, JSON.stringify(parameters), seed, palette.id, JSON.stringify(palette.colors), palette.background, layers, JSON.stringify(generatorLayers)])
}
