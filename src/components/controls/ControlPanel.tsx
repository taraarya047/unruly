import { generatorRegistry } from '@/engine/registry'
import type { ParamGroup } from '@/engine/types'
import { useDesignStore } from '@/state/useDesignStore'
import { MagicBar } from './MagicBar'
import { ParamControl } from './ParamControl'
import { PaletteControls } from './PaletteControls'
import { SEMANTIC_ACTIONS } from '@/engine/mutate'
import { Toggle } from '@/components/ui/Toggle'

const GROUP_LABELS: Record<ParamGroup, string> = {
  shape: 'Shape',
  pattern: 'Pattern',
  variation: 'Variation',
  composition: 'Composition',
  color: 'Color',
}

const GROUP_ORDER: ParamGroup[] = ['shape', 'pattern', 'variation', 'composition', 'color']

export function ControlPanel() {
  const generatorId = useDesignStore((s) => s.generatorId)
  const parameters = useDesignStore((s) => s.parameters)
  const setParameter = useDesignStore((s) => s.setParameter)
  const advancedMode = useDesignStore((s) => s.advancedMode)
  const toggleAdvancedMode = useDesignStore((s) => s.toggleAdvancedMode)
  const applyAction = useDesignStore((s) => s.applyAction)

  const generator = generatorRegistry.get(generatorId)!
  const visibleSchema = generator.parameterSchema.filter((p) => advancedMode || !p.advanced)

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <MagicBar />

      <div>
        <div className="mb-2 text-xs font-medium text-text-muted">Make it&hellip;</div>
        <div className="flex flex-wrap gap-1.5">
          {SEMANTIC_ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => applyAction(a.id)}
              className="rounded-full bg-control-bg px-3 py-1 text-xs font-medium text-text transition-colors hover:bg-control-hover"
            >
              {a.label.replace('Make it ', '')}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {GROUP_ORDER.map((group) => {
        const schemas = visibleSchema.filter((s) => s.group === group)
        if (!schemas.length) return null
        return (
          <div key={group}>
            <div className="mb-3 text-xs font-medium text-text-muted">{GROUP_LABELS[group]}</div>
            <div className="space-y-4">
              {schemas.map((schema) => (
                <ParamControl key={schema.key} schema={schema} value={parameters[schema.key]} onChange={(v) => setParameter(schema.key, v)} />
              ))}
            </div>
          </div>
        )
      })}

      <label className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">Advanced controls</span>
        <Toggle checked={advancedMode} onChange={toggleAdvancedMode} />
      </label>

      <div className="h-px bg-border" />

      <div>
        <div className="mb-2 text-xs font-medium text-text-muted">Palette</div>
        <PaletteControls />
      </div>
    </div>
  )
}
