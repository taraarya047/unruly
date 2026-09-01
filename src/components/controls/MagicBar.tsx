import { useDesignStore, type Locks } from '@/state/useDesignStore'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Toggle } from '@/components/ui/Toggle'
import { SparkleIcon, ShuffleIcon, LockIcon, UnlockIcon, UndoIcon, RedoIcon } from '@/components/ui/icons'
import { EvolutionPicker } from './EvolutionPicker'

const LOCK_LABELS: { key: keyof Locks; label: string }[] = [
  { key: 'geometry', label: 'Geometry' },
  { key: 'composition', label: 'Composition' },
  { key: 'texture', label: 'Texture' },
  { key: 'palette', label: 'Palette' },
]

export function MagicBar() {
  const locks = useDesignStore((s) => s.locks)
  const toggleLock = useDesignStore((s) => s.toggleLock)
  const randomizeNew = useDesignStore((s) => s.randomizeNew)
  const randomizeRemix = useDesignStore((s) => s.randomizeRemix)
  const randomizeRecolor = useDesignStore((s) => s.randomizeRecolor)
  const randomizeDistort = useDesignStore((s) => s.randomizeDistort)
  const randomizeComposition = useDesignStore((s) => s.randomizeComposition)
  const chaosBlending = useDesignStore((s) => s.chaosBlending)
  const toggleChaosBlending = useDesignStore((s) => s.toggleChaosBlending)
  const undo = useDesignStore((s) => s.undo)
  const redo = useDesignStore((s) => s.redo)
  const canUndo = useDesignStore((s) => s.canUndo())
  const canRedo = useDesignStore((s) => s.canRedo())

  return (
    <div className="space-y-2">
      <Button variant="primary" size="lg" className="w-full" icon={<ShuffleIcon width={18} height={18} />} onClick={randomizeNew}>
        Shuffle
      </Button>
      <div className="grid grid-cols-2 gap-1.5">
        <EvolutionPicker />
        <Button size="sm" onClick={randomizeRemix}>
          Remix
        </Button>
        <Button size="sm" onClick={randomizeRecolor}>
          Recolor
        </Button>
        <Button size="sm" onClick={randomizeDistort}>
          Distort
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-control-bg/40 p-2">
        <Button variant="secondary" size="sm" className="w-full" icon={<SparkleIcon width={15} height={15} />} onClick={randomizeComposition}>
          Surprise me
        </Button>
        <label className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-text-muted">Chaos blending (random opacity &amp; blend modes)</span>
          <Toggle checked={chaosBlending} onChange={toggleChaosBlending} />
        </label>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        <IconButton label="Previous design (⌘Z)" onClick={undo} disabled={!canUndo}>
          <UndoIcon width={16} height={16} />
        </IconButton>
        <span className="text-xs text-text-muted">Design history</span>
        <IconButton label="Next design (⌘⇧Z)" onClick={redo} disabled={!canRedo}>
          <RedoIcon width={16} height={16} />
        </IconButton>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-text-muted">
        {LOCK_LABELS.map(({ key, label }) => (
          <LockToggle key={key} label={label} active={locks[key]} onClick={() => toggleLock(key)} />
        ))}
      </div>
    </div>
  )
}

function LockToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <IconButton label={`Lock ${label.toLowerCase()}`} active={active} onClick={onClick}>
        {active ? <LockIcon width={14} height={14} /> : <UnlockIcon width={14} height={14} />}
      </IconButton>
      <span>{label}</span>
    </span>
  )
}
