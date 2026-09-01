import { generatorRegistry } from '@/engine/registry'
import type { ParamGroup } from '@/engine/types'
import { useDesignStore } from '@/state/useDesignStore'
import { useAnimationStore } from '@/state/useAnimationStore'
import { MagicBar } from './MagicBar'
import { ParamControl } from './ParamControl'
import { PaletteControls } from './PaletteControls'
import { LayerPanel } from '@/components/layers/LayerPanel'
import { GeneratorLayersPanel } from '@/components/layers/GeneratorLayersPanel'
import { SEMANTIC_ACTIONS } from '@/engine/mutate'
import { Toggle } from '@/components/ui/Toggle'
import { randomSeed } from '@/engine/prng'
import { ShuffleIcon } from '@/components/ui/icons'

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
  const setParameterLive = useDesignStore((s) => s.setParameterLive)
  const seed = useDesignStore((s) => s.seed)
  const setSeed = useDesignStore((s) => s.setSeed)
  const advancedMode = useDesignStore((s) => s.advancedMode)
  const toggleAdvancedMode = useDesignStore((s) => s.toggleAdvancedMode)
  const applyAction = useDesignStore((s) => s.applyAction)

  const generatorLayers = useDesignStore((s) => s.generatorLayers)
  const activeLayerId = useDesignStore((s) => s.activeLayerId)
  const setGeneratorLayerParameter = useDesignStore((s) => s.setGeneratorLayerParameter)
  const setGeneratorLayerParameterLive = useDesignStore((s) => s.setGeneratorLayerParameterLive)
  const setGeneratorLayerSeed = useDesignStore((s) => s.setGeneratorLayerSeed)

  const keyframeSelection = useAnimationStore((s) => s.selectedKeyframe)
  const animationTracks = useAnimationStore((s) => s.tracks[generatorId])
  const updateKeyframe = useAnimationStore((s) => s.updateKeyframe)

  // Whichever layer is selected in GeneratorLayersPanel is what every control below edits — the base
  // design by default, or a specific stacked layer once one is picked. Animation keyframes stay
  // scoped to the base only (stacked layers aren't animatable), so that override is gated on `!activeLayer`.
  const activeLayer = activeLayerId ? (generatorLayers.find((l) => l.id === activeLayerId) ?? null) : null
  const editingGeneratorId = activeLayer ? activeLayer.generatorId : generatorId
  const editingParameters = activeLayer ? activeLayer.parameters : parameters
  const editingSeed = activeLayer ? activeLayer.seed : seed
  const editingSetParameter = activeLayer
    ? (key: string, v: number | string | boolean) => setGeneratorLayerParameter(activeLayer.id, key, v)
    : setParameter
  const editingSetParameterLive = activeLayer
    ? (key: string, v: number | string | boolean) => setGeneratorLayerParameterLive(activeLayer.id, key, v)
    : setParameterLive
  const editingSetSeed = activeLayer ? (v: number) => setGeneratorLayerSeed(activeLayer.id, v) : setSeed

  const generator = generatorRegistry.get(editingGeneratorId)!
  const visibleSchema = generator.parameterSchema.filter((p) => advancedMode || !p.advanced)

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <MagicBar />

      <div className="h-px bg-border" />

      <div>
        <div className="mb-2 text-xs font-medium text-text-muted">Generator layers</div>
        <GeneratorLayersPanel />
      </div>

      <div className="h-px bg-border" />

      <div className="-mb-1 text-xs text-text-muted">
        Editing <span className="font-medium text-text">{generator.name}</span>
        {!activeLayer && ' (base)'}
      </div>

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
            <div className="mb-2 text-xs font-medium text-text-muted">{GROUP_LABELS[group]}</div>
            <div className="space-y-3">
              {schemas.map((schema) => {
                // When a keyframe is selected for this exact parameter, its animation track
                // permanently overrides the stored parameter at render time (see
                // hooks/useAnimatedParameters.ts) — so without this, dragging the slider would
                // update a value the canvas never looks at, and nothing would visibly happen.
                // Route the slider at the selected keyframe instead: show its value, edit it in place.
                const activeKeyframe =
                  !activeLayer && keyframeSelection && keyframeSelection.generatorId === generatorId && keyframeSelection.paramKey === schema.key
                    ? animationTracks?.[schema.key]?.find((k) => k.id === keyframeSelection.keyframeId)
                    : undefined
                return (
                  <ParamControl
                    key={schema.key}
                    schema={activeKeyframe ? { ...schema, label: `${schema.label} ◆` } : schema}
                    value={activeKeyframe ? activeKeyframe.value : editingParameters[schema.key]}
                    onChange={(v) =>
                      activeKeyframe
                        ? updateKeyframe(generatorId, schema.key, activeKeyframe.id, { value: Number(v) })
                        : editingSetParameterLive(schema.key, v)
                    }
                    onCommit={(v) =>
                      activeKeyframe
                        ? updateKeyframe(generatorId, schema.key, activeKeyframe.id, { value: Number(v) })
                        : editingSetParameter(schema.key, v)
                    }
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      <label className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">Advanced controls</span>
        <Toggle checked={advancedMode} onChange={toggleAdvancedMode} />
      </label>

      {advancedMode && (
        <label className="-mt-2 block">
          <span className="mb-1.5 block text-xs text-text-muted">Seed</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={editingSeed}
              onChange={(e) => editingSetSeed(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-control-bg px-2.5 py-1.5 text-sm tabular-nums text-text"
            />
            <button
              aria-label="Randomize seed"
              onClick={() => editingSetSeed(randomSeed())}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-control-bg text-text hover:bg-control-hover"
            >
              <ShuffleIcon width={14} height={14} />
            </button>
          </div>
        </label>
      )}

      <div className="h-px bg-border" />

      <div>
        <div className="mb-2 text-xs font-medium text-text-muted">Palette</div>
        <PaletteControls />
      </div>

      <div className="h-px bg-border" />

      <div>
        <div className="mb-2 text-xs font-medium text-text-muted">Shape layers</div>
        <LayerPanel />
      </div>
    </div>
  )
}
