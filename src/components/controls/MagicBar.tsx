import { useDesignStore } from '@/state/useDesignStore'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { SparkleIcon, ShuffleIcon, LockIcon, UnlockIcon } from '@/components/ui/icons'

export function MagicBar() {
  const locks = useDesignStore((s) => s.locks)
  const toggleLock = useDesignStore((s) => s.toggleLock)
  const randomizeNew = useDesignStore((s) => s.randomizeNew)
  const randomizeEvolve = useDesignStore((s) => s.randomizeEvolve)
  const randomizeRemix = useDesignStore((s) => s.randomizeRemix)
  const randomizeRecolor = useDesignStore((s) => s.randomizeRecolor)

  return (
    <div className="space-y-2.5">
      <Button variant="primary" size="lg" className="w-full" icon={<SparkleIcon width={18} height={18} />} onClick={randomizeNew}>
        Surprise me
      </Button>
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="flex-1" icon={<ShuffleIcon width={14} height={14} />} onClick={randomizeEvolve}>
          Evolve
        </Button>
        <Button size="sm" className="flex-1" onClick={randomizeRemix}>
          Remix
        </Button>
        <Button size="sm" className="flex-1" onClick={randomizeRecolor}>
          Recolor
        </Button>
      </div>
      <div className="flex items-center justify-center gap-4 pt-1 text-xs text-text-muted">
        <LockToggle label="Lock geometry" active={locks.geometry} onClick={() => toggleLock('geometry')} />
        <LockToggle label="Lock palette" active={locks.palette} onClick={() => toggleLock('palette')} />
      </div>
    </div>
  )
}

function LockToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <IconButton label={label} active={active} onClick={onClick}>
        {active ? <LockIcon width={14} height={14} /> : <UnlockIcon width={14} height={14} />}
      </IconButton>
      <span>{label.replace('Lock ', '')}</span>
    </span>
  )
}
