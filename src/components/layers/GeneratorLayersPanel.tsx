import { useState } from 'react'
import { generatorRegistry } from '@/engine/registry'
import { BLEND_MODES, type BlendMode } from '@/engine/types'
import { useDesignStore, type GeneratorLayerConfig } from '@/state/useDesignStore'
import { useRafThrottle } from '@/hooks/useRafThrottle'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import { EyeIcon, EyeOffIcon, TrashIcon, ChevronDownIcon, ShuffleIcon, PlusIcon } from '@/components/ui/icons'

const BLEND_MODE_LABELS: Record<BlendMode, string> = {
  normal: 'Normal',
  multiply: 'Multiply',
  screen: 'Screen',
  overlay: 'Overlay',
  darken: 'Darken',
  lighten: 'Lighten',
  'color-dodge': 'Color dodge',
  'color-burn': 'Color burn',
  'hard-light': 'Hard light',
  'soft-light': 'Soft light',
  difference: 'Difference',
  exclusion: 'Exclusion',
  hue: 'Hue',
  saturation: 'Saturation',
  color: 'Color',
  luminosity: 'Luminosity',
}

const GENERATOR_OPTIONS = generatorRegistry
  .all()
  .map((g) => ({ id: g.id, name: g.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

/**
 * Stacked generator layers composited on top of the base design (see engine/composeGeneratorLayers.ts).
 * The base generator/params/seed are edited via the rest of ControlPanel as always; this panel only
 * manages the additional layers — which generator fills each one, its opacity, and its blend mode.
 */
export function GeneratorLayersPanel() {
  const generatorId = useDesignStore((s) => s.generatorId)
  const generatorLayers = useDesignStore((s) => s.generatorLayers)
  const activeLayerId = useDesignStore((s) => s.activeLayerId)
  const setActiveLayer = useDesignStore((s) => s.setActiveLayer)
  const addGeneratorLayer = useDesignStore((s) => s.addGeneratorLayer)
  const removeGeneratorLayer = useDesignStore((s) => s.removeGeneratorLayer)
  const setGeneratorLayerGenerator = useDesignStore((s) => s.setGeneratorLayerGenerator)
  const randomizeGeneratorLayer = useDesignStore((s) => s.randomizeGeneratorLayer)
  const setGeneratorLayerOpacity = useDesignStore((s) => s.setGeneratorLayerOpacity)
  const setGeneratorLayerOpacityLive = useDesignStore((s) => s.setGeneratorLayerOpacityLive)
  const setGeneratorLayerBlendMode = useDesignStore((s) => s.setGeneratorLayerBlendMode)
  const toggleGeneratorLayerVisible = useDesignStore((s) => s.toggleGeneratorLayerVisible)
  const moveGeneratorLayer = useDesignStore((s) => s.moveGeneratorLayer)

  const baseGenerator = generatorRegistry.get(generatorId)
  // Stored back-to-front (matches LayerPanel's convention); shown top-to-bottom, base always last.
  const topToBottom = [...generatorLayers].reverse()

  return (
    <div className="space-y-1.5">
      {topToBottom.map((layer, i) => (
        <GeneratorLayerRow
          key={layer.id}
          layer={layer}
          isTop={i === 0}
          isBottom={i === topToBottom.length - 1}
          isActive={layer.id === activeLayerId}
          onSelect={() => setActiveLayer(layer.id)}
          onToggleVisible={() => toggleGeneratorLayerVisible(layer.id)}
          onGeneratorChange={(id) => setGeneratorLayerGenerator(layer.id, id)}
          onRandomize={() => randomizeGeneratorLayer(layer.id)}
          onOpacityChange={(v) => setGeneratorLayerOpacityLive(layer.id, v)}
          onOpacityCommit={(v) => setGeneratorLayerOpacity(layer.id, v)}
          onBlendModeChange={(m) => setGeneratorLayerBlendMode(layer.id, m)}
          onDelete={() => removeGeneratorLayer(layer.id)}
          onMoveUp={() => moveGeneratorLayer(layer.id, 'up')}
          onMoveDown={() => moveGeneratorLayer(layer.id, 'down')}
        />
      ))}

      <button
        onClick={() => setActiveLayer(null)}
        className={`w-full rounded-lg border border-dashed px-2.5 py-2 text-left text-xs text-text-muted transition-colors ${
          activeLayerId === null ? 'border-accent bg-accent/[0.06]' : 'border-border hover:border-text-muted'
        }`}
      >
        <span className="font-medium text-text">{baseGenerator?.name ?? 'Base'}</span> — base layer
      </button>

      <Button size="sm" variant="ghost" className="w-full" icon={<PlusIcon width={14} height={14} />} onClick={addGeneratorLayer}>
        Add generator layer
      </Button>
    </div>
  )
}

interface RowProps {
  layer: GeneratorLayerConfig
  isTop: boolean
  isBottom: boolean
  isActive: boolean
  onSelect: () => void
  onToggleVisible: () => void
  onGeneratorChange: (generatorId: string) => void
  onRandomize: () => void
  onOpacityChange: (v: number) => void
  onOpacityCommit: (v: number) => void
  onBlendModeChange: (mode: BlendMode) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function GeneratorLayerRow({
  layer,
  isTop,
  isBottom,
  isActive,
  onSelect,
  onToggleVisible,
  onGeneratorChange,
  onRandomize,
  onOpacityChange,
  onOpacityCommit,
  onBlendModeChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: RowProps) {
  const [display, setDisplay] = useState(layer.opacity)
  const [trackedOpacity, setTrackedOpacity] = useState(layer.opacity)
  if (layer.opacity !== trackedOpacity) {
    setTrackedOpacity(layer.opacity)
    setDisplay(layer.opacity)
  }
  const raf = useRafThrottle()

  const handleInput = (v: number) => {
    setDisplay(v)
    raf.schedule(() => onOpacityChange(v))
  }
  const commit = () => {
    raf.cancel()
    onOpacityCommit(display)
  }

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg border px-2 py-1.5 transition-colors ${
        isActive ? 'border-accent bg-accent/[0.06]' : 'border-border bg-control-bg/50 hover:border-text-muted/50'
      }`}
    >
      <div className="flex items-center gap-1">
        <IconButton label={layer.visible ? 'Hide layer' : 'Show layer'} onClick={onToggleVisible}>
          {layer.visible ? <EyeIcon width={15} height={15} /> : <EyeOffIcon width={15} height={15} />}
        </IconButton>
        <select
          aria-label="Layer generator"
          value={layer.generatorId}
          onChange={(e) => onGeneratorChange(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent py-1 text-sm text-text hover:border-border focus:border-border"
        >
          {GENERATOR_OPTIONS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <IconButton label="Randomize this layer" onClick={onRandomize}>
          <ShuffleIcon width={13} height={13} />
        </IconButton>
        <div className="flex flex-col">
          <button aria-label="Move layer up" disabled={isTop} onClick={onMoveUp} className="rotate-180 text-text-muted hover:text-text disabled:opacity-20">
            <ChevronDownIcon width={12} height={12} />
          </button>
          <button aria-label="Move layer down" disabled={isBottom} onClick={onMoveDown} className="text-text-muted hover:text-text disabled:opacity-20">
            <ChevronDownIcon width={12} height={12} />
          </button>
        </div>
        <IconButton label="Delete layer" onClick={onDelete}>
          <TrashIcon width={13} height={13} />
        </IconButton>
      </div>
      <div className="mt-1.5 flex items-center gap-2 pl-8">
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={display}
          onChange={(e) => handleInput(Number(e.target.value))}
          onMouseUp={commit}
          onTouchEnd={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="slider-range h-1 flex-1 cursor-pointer appearance-none rounded-full bg-control-bg"
          style={{ backgroundImage: `linear-gradient(to right, var(--accent) ${display * 100}%, transparent ${display * 100}%)` }}
        />
        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-text-muted">{Math.round(display * 100)}%</span>
      </div>
      <div className="mt-1.5 pl-8">
        <select
          aria-label="Blend mode"
          value={layer.blendMode}
          onChange={(e) => onBlendModeChange(e.target.value as BlendMode)}
          className="w-full rounded-md border border-border bg-control-bg px-2 py-1 text-xs text-text"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {BLEND_MODE_LABELS[mode]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
