import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { trackEvent } from '@/state/useAnalyticsStore'
import { useAdViewability } from '@/hooks/useAdViewability'

export type AdVariant = 'leaderboard' | 'rectangle' | 'mobile' | 'inline' | 'sidebar'

interface AdSlotProps {
  variant: AdVariant
  placement: string
  className?: string
}

// Reserved dimensions per variant — kept fixed across every state (loading/filled/failed) so a real
// ad network never shifts layout (no CLS), per AD_SYSTEM.md.
const DIMENSIONS: Record<AdVariant, { width: number | string; height: number }> = {
  leaderboard: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  mobile: { width: '100%', height: 100 },
  inline: { width: '100%', height: 120 },
  sidebar: { width: 300, height: 600 },
}

type AdState = 'loading' | 'filled' | 'failed'

/**
 * Stands in for the real ad SDK's load call (no ad network is wired up yet — see AD_SYSTEM.md). It
 * simulates real network latency and an occasional fill failure so the loading/filled/failed contract
 * below is genuinely exercised today; a production integration replaces just this function.
 */
function loadAdStub(): Promise<'filled' | 'failed'> {
  return new Promise((resolve) => {
    const latency = 220 + Math.random() * 180
    setTimeout(() => resolve(Math.random() < 0.04 ? 'failed' : 'filled'), latency)
  })
}

/**
 * Layout-reserving ad slot. Phase 7 wires real ad delivery behind this same contract — see
 * AD_SYSTEM.md. Never rendered inside the creative canvas or between a control and its label.
 */
export function AdSlot({ variant, placement, className }: AdSlotProps) {
  const { width, height } = DIMENSIONS[variant]
  const [state, setState] = useState<AdState>('loading')
  const ref = useRef<HTMLDivElement>(null)

  useAdViewability(ref, placement, variant, state === 'filled')

  useEffect(() => {
    let cancelled = false
    loadAdStub().then((result) => {
      if (cancelled) return
      setState(result)
      if (result === 'failed') trackEvent('ad_load_failed', { placement, variant })
    })
    return () => {
      cancelled = true
    }
  }, [placement, variant])

  return (
    <div
      ref={ref}
      data-ad-placement={placement}
      data-ad-state={state}
      className={clsx(
        'mx-auto flex w-full items-center justify-center rounded-xl border border-dashed border-border',
        state === 'filled' ? 'bg-surface/60' : 'bg-transparent',
        className,
      )}
      style={{ maxWidth: typeof width === 'number' ? width : undefined, height }}
    >
      {state === 'loading' && <span className="h-1/3 w-1/3 max-w-[120px] animate-pulse rounded-full bg-control-bg" aria-hidden="true" />}
      {state === 'filled' && <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted/70">Advertisement</span>}
      {/* state === 'failed': reserved space stays exactly as-is, intentionally empty — no CLS, no broken-ad visual */}
    </div>
  )
}
