import clsx from 'clsx'

export type AdVariant = 'leaderboard' | 'rectangle' | 'mobile' | 'inline' | 'sidebar'

interface AdSlotProps {
  variant: AdVariant
  placement: string
  className?: string
}

// Reserved dimensions per variant — kept fixed so a loaded ad never shifts layout (no CLS).
const DIMENSIONS: Record<AdVariant, { width: number | string; height: number }> = {
  leaderboard: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  mobile: { width: '100%', height: 100 },
  inline: { width: '100%', height: 120 },
  sidebar: { width: 300, height: 600 },
}

/**
 * Layout-reserving ad placeholder. Phase 7 wires real ad delivery behind this same contract —
 * see AD_SYSTEM.md. Never rendered inside the creative canvas or between a control and its label.
 */
export function AdSlot({ variant, placement, className }: AdSlotProps) {
  const { width, height } = DIMENSIONS[variant]
  return (
    <div
      data-ad-placement={placement}
      className={clsx('mx-auto flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-surface/60', className)}
      style={{ maxWidth: typeof width === 'number' ? width : undefined, height }}
    >
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted/70">Advertisement</span>
    </div>
  )
}
