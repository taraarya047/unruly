import { useDesignStore, type Locks } from '@/state/useDesignStore'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { SparkleIcon, LockIcon, UnlockIcon, UndoIcon, RedoIcon } from '@/components/ui/icons'
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
  const undo = useDesignStore((s) => s.undo)
  const redo = useDesignStore((s) => s.redo)
  const canUndo = useDesignStore((s) => s.canUndo())
  const canRedo = useDesignStore((s) => s.canRedo())

  return (
    <div className="space-y-2.5">
      <Button variant="primary" size="lg" className="w-full" icon={<SparkleIcon width={18} height={18} />} onClick={randomizeNew}>
        Surprise me
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
      <div className="flex items-center justify-center gap-1.5">
        <IconButton label="Previous design (⌘Z)" onClick={undo} disabled={!canUndo}>
          <UndoIcon width={16} height={16} />
        </IconButton>
        <span className="text-xs text-text-muted">Design history</span>
        <IconButton label="Next design (⌘⇧Z)" onClick={redo} disabled={!canRedo}>
          <RedoIcon width={16} height={16} />
        </IconButton>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-1 text-xs text-text-muted">
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
