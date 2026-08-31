import { useMemo } from 'react'
import type { GeneratorParameters } from '@/engine/types'
import { generatorRegistry } from '@/engine/registry'
import { renderDesignToSvgString } from '@/engine/render'
import { DESIGN_PRESETS, type DesignPreset } from '@/presets/designPresets'
import { useDesignStore } from '@/state/useDesignStore'

export function PresetStrip() {
  const applyPreset = useDesignStore((s) => s.applyPreset)

  return (
    <div className="max-h-[124px] overflow-y-auto pr-0.5">
      <div className="grid grid-cols-2 gap-2">
        {DESIGN_PRESETS.map((preset) => (
          <PresetTile key={preset.id} preset={preset} onClick={() => applyPreset(preset)} />
        ))}
      </div>
    </div>
  )
}

function PresetTile({ preset, onClick }: { preset: DesignPreset; onClick: () => void }) {
  const generator = generatorRegistry.get(preset.generatorId)
  const markup = useMemo(() => {
    if (!generator) return ''
    const parameters = { ...generator.defaultParameters, ...preset.parameters } as GeneratorParameters
    const design = generator.generate(parameters, preset.seed ?? 11, preset.palette.colors)
    return renderDesignToSvgString(design, { includeMetadata: false, sizeMode: 'fill' })
  }, [generator, preset])

  if (!generator) return null

  return (
    <button
      onClick={onClick}
      title={preset.description}
      className="group overflow-hidden rounded-lg border border-border text-left transition-transform duration-150 hover:scale-[1.02]"
    >
      <div className="aspect-[4/3] w-full" style={{ background: preset.palette.background }} dangerouslySetInnerHTML={{ __html: markup }} />
      <div className="bg-surface-elevated px-2 py-1.5">
        <div className="truncate text-xs font-medium text-text">{preset.name}</div>
      </div>
    </button>
  )
}
