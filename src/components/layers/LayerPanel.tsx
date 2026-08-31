import type { SVGLayer } from '@/engine/types'
import { useCurrentDesign } from '@/hooks/useCurrentDesign'
import { useDesignStore } from '@/state/useDesignStore'
import { IconButton } from '@/components/ui/IconButton'
import { EyeIcon, EyeOffIcon, LockIcon, UnlockIcon, CopyIcon, TrashIcon, ChevronDownIcon } from '@/components/ui/icons'

export function LayerPanel() {
  const design = useCurrentDesign()
  // Select the stable array reference (not a derived Set) so this selector doesn't return a
  // new object identity on every call — that would make zustand think the store changed on
  // every render and loop forever (React's "Maximum update depth exceeded").
  const extraLayers = useDesignStore((s) => s.layers.extraLayers)
  const toggleLayerVisible = useDesignStore((s) => s.toggleLayerVisible)
  const toggleLayerLocked = useDesignStore((s) => s.toggleLayerLocked)
  const setLayerOpacity = useDesignStore((s) => s.setLayerOpacity)
  const duplicateLayer = useDesignStore((s) => s.duplicateLayer)
  const deleteExtraLayer = useDesignStore((s) => s.deleteExtraLayer)
  const setLayerOrder = useDesignStore((s) => s.setLayerOrder)

  const ids = design.layers.map((l) => l.id)
  const frontToBack = [...design.layers].reverse()

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
          onOpacityChange={(v) => setLayerOpacity(layer.id, v)}
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
  onDuplicate: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function LayerRow({ layer, isTop, isBottom, deletable, onToggleVisible, onToggleLocked, onOpacityChange, onDuplicate, onDelete, onMoveUp, onMoveDown }: LayerRowProps) {
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
          value={layer.opacity}
          disabled={layer.locked}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="slider-range h-1 flex-1 cursor-pointer appearance-none rounded-full bg-control-bg disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundImage: `linear-gradient(to right, var(--accent) ${layer.opacity * 100}%, transparent ${layer.opacity * 100}%)` }}
        />
        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-text-muted">{Math.round(layer.opacity * 100)}%</span>
      </div>
    </div>
  )
}
