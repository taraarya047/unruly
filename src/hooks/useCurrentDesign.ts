import { useMemo } from 'react'
import { generatorRegistry } from '@/engine/registry'
import { useDesignStore } from '@/state/useDesignStore'
import type { GeneratedDesign } from '@/engine/types'

export function useCurrentDesign(): GeneratedDesign {
  const generatorId = useDesignStore((s) => s.generatorId)
  const parameters = useDesignStore((s) => s.parameters)
  const seed = useDesignStore((s) => s.seed)
  const palette = useDesignStore((s) => s.palette)

  return useMemo(() => {
    const generator = generatorRegistry.get(generatorId)!
    const design = generator.generate(parameters, seed, palette.colors)
    design.metadata.paletteId = palette.id
    return design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatorId, JSON.stringify(parameters), seed, palette.id, JSON.stringify(palette.colors)])
}
