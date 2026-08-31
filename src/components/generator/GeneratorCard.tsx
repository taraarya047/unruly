import clsx from 'clsx'
import type { GeneratorDefinition } from '@/engine/types'
import { GeneratorThumbnail } from './GeneratorThumbnail'

interface GeneratorCardProps {
  generator: GeneratorDefinition
  active?: boolean
  onClick: () => void
}

export function GeneratorCard({ generator, active, onClick }: GeneratorCardProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'group flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors duration-150',
        active ? 'border-accent bg-accent/[0.06]' : 'border-transparent hover:border-border hover:bg-control-bg',
      )}
    >
      <GeneratorThumbnail generator={generator} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-text">{generator.name}</span>
        <span className="block truncate text-xs text-text-muted">{generator.description}</span>
      </span>
    </button>
  )
}
