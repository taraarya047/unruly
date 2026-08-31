import { useState } from 'react'
import type { SVGLayer } from '@/engine/types'
import { useCurrentDesign } from '@/hooks/useCurrentDesign'
import { useDesignStore } from '@/state/useDesignStore'
import { useRafThrottle } from '@/hooks/useRafThrottle'
import { IconButton } from '@/components/ui/IconButton'
import { EyeIcon, EyeOffIcon, LockIcon, UnlockIcon, CopyIcon, TrashIcon, ChevronDownIcon } from '@/components/ui/icons'

export function LayerPanel() {
  const design = useCurrentDesign()
  // Select the stable array reference (not a derived Set) so this selector doesn't return a
  // new object identity on every call — that would make zustand think the store changed on
  // every render and loop forever (React's "Maximum update depth exceeded").
  const extraLayers = useDesignStore((s) => s.layers.extraLayers)
  const generatorLayers = useDesignStore((s) => s.generatorLayers)
  const toggleLayerVisible = useDesignStore((s) => s.toggleLayerVisible)
  const toggleLayerLocked = useDesignStore((s) => s.toggleLayerLocked)
  const setLayerOpacity = useDesignStore((s) => s.setLayerOpacity)
  const setLayerOpacityLive = useDesignStore((s) => s.setLayerOpacityLive)
  const duplicateLayer = useDesignStore((s) => s.duplicateLayer)
  const deleteExtraLayer = useDesignStore((s) => s.deleteExtraLayer)
  const setLayerOrder = useDesignStore((s) => s.setLayerOrder)

  // Stacked generator layers (see GeneratorLayersPanel) are appended to design.layers for rendering,
  // but they're composited after composeLayers runs — an opacity/visibility override set here would be
  // silently dropped before it ever reaches them. They have their own dedicated controls, so exclude
  // them from this panel entirely rather than showing a control that looks live but does nothing.
  const generatorLayerIds = new Set(generatorLayers.map((l) => l.id))
  const shapeLayers = design.layers.filter((l) => !generatorLayerIds.has(l.id))

  const ids = shapeLayers.map((l) => l.id)
  const frontToBack = [...shapeLayers].reverse()

  const move = (id: string, direction: 'up' | 'down') => {
    const idx = ids.indexOf(id)
    const swapWith = direction === 'up' ? idx + 1 : idx - 1
    if (swapWith < 0 || swapWith >= ids.length) return
    const next = [...ids]
    ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
    setLayerOrder(next)
  }

  return (
    <div className="space-y-1.5">
      {frontToBack.map((layer, i) => (
        <LayerRow
          key={layer.id}
          layer={layer}
          isTop={i === 0}
          isBottom={i === frontToBack.length - 1}
          deletable={extraLayers.some((l) => l.id === layer.id)}
          onToggleVisible={() => toggleLayerVisible(layer.id)}
          onToggleLocked={() => toggleLayerLocked(layer.id)}
          onOpacityChange={(v) => setLayerOpacityLive(layer.id, v)}
          onOpacityCommit={(v) => setLayerOpacity(layer.id, v)}
          onDuplicate={() => duplicateLayer(layer)}
          onDelete={() => deleteExtraLayer(layer.id)}
          onMoveUp={() => move(layer.id, 'up')}
          onMoveDown={() => move(layer.id, 'down')}
        />
      ))}
    </div>
  )
}

interface LayerRowProps {
  layer: SVGLayer
  isTop: boolean
  isBottom: boolean
  deletable: boolean
  onToggleVisible: () => void
  onToggleLocked: () => void
  onOpacityChange: (v: number) => void
  onOpacityCommit: (v: number) => void
  onDuplicate: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function LayerRow({ layer, isTop, isBottom, deletable, onToggleVisible, onToggleLocked, onOpacityChange, onOpacityCommit, onDuplicate, onDelete, onMoveUp, onMoveDown }: LayerRowProps) {
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
    <div className="rounded-lg border border-border bg-control-bg/50 px-2 py-1.5">
      <div className="flex items-center gap-1">
        <IconButton label={layer.visible ? 'Hide layer' : 'Show layer'} onClick={onToggleVisible}>
          {layer.visible ? <EyeIcon width={15} height={15} /> : <EyeOffIcon width={15} height={15} />}
        </IconButton>
        <IconButton label={layer.locked ? 'Unlock layer' : 'Lock layer'} onClick={onToggleLocked}>
          {layer.locked ? <LockIcon width={13} height={13} /> : <UnlockIcon width={13} height={13} />}
        </IconButton>
        <span className="ml-0.5 min-w-0 flex-1 truncate text-sm text-text">{layer.name}</span>
        <div className="flex flex-col">
          <button
            aria-label="Move layer up"
            disabled={isTop}
            onClick={onMoveUp}
            className="rotate-180 text-text-muted hover:text-text disabled:opacity-20"
          >
            <ChevronDownIcon width={12} height={12} />
          </button>
          <button aria-label="Move layer down" disabled={isBottom} onClick={onMoveDown} className="text-text-muted hover:text-text disabled:opacity-20">
            <ChevronDownIcon width={12} height={12} />
          </button>
        </div>
        <IconButton label="Duplicate layer" onClick={onDuplicate}>
          <CopyIcon width={13} height={13} />
        </IconButton>
        {deletable && (
          <IconButton label="Delete layer" onClick={onDelete}>
            <TrashIcon width={13} height={13} />
          </IconButton>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2 pl-[68px]">
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={display}
          disabled={layer.locked}
          onChange={(e) => handleInput(Number(e.target.value))}
          onMouseUp={commit}
          onTouchEnd={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="slider-range h-1 flex-1 cursor-pointer appearance-none rounded-full bg-control-bg disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundImage: `linear-gradient(to right, var(--accent) ${display * 100}%, transparent ${display * 100}%)` }}
        />
        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-text-muted">{Math.round(display * 100)}%</span>
      </div>
    </div>
  )
}
