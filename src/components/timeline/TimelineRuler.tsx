import { useRef, useState } from 'react'

interface TimelineRulerProps {
  duration: number
  currentTime: number
  pixelsPerSecond: number
  onScrub: (time: number) => void
}

export function TimelineRuler({ duration, currentTime, pixelsPerSecond, onScrub }: TimelineRulerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const width = duration * pixelsPerSecond

  const timeFromClientX = (clientX: number) => {
    const rect = ref.current!.getBoundingClientRect()
    return Math.min(duration, Math.max(0, (clientX - rect.left) / pixelsPerSecond))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true)
    onScrub(timeFromClientX(e.clientX))
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // No-op: pointer capture is best-effort (e.g. no active pointer session for this id).
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    onScrub(timeFromClientX(e.clientX))
  }

  const tickStep = duration > 8 ? 1 : 0.5
  const ticks: number[] = []
  for (let t = 0; t <= duration + 1e-6; t += tickStep) ticks.push(t)

  return (
    <div className="flex">
      <div className="w-24 shrink-0 border-r border-border/60 bg-surface md:w-32" />
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => dragging && setDragging(false)}
        className="relative h-6 flex-1 cursor-pointer touch-none border-b border-border/60 bg-surface"
        style={{ width, minWidth: '100%' }}
      >
        {ticks.map((t) => (
          <div key={t} className="pointer-events-none absolute top-0 flex h-full flex-col items-center" style={{ left: t * pixelsPerSecond }}>
            <div className="h-1.5 w-px bg-border" />
            <span className="mt-0.5 text-[9px] tabular-nums text-text-muted">{t.toFixed(tickStep < 1 ? 1 : 0)}s</span>
          </div>
        ))}
        <div className="pointer-events-none absolute top-0 h-full w-px bg-accent" style={{ left: currentTime * pixelsPerSecond }}>
          <div className="absolute -left-[5px] -top-0.5 h-2.5 w-2.5 rotate-45 bg-accent" />
        </div>
      </div>
    </div>
  )
}
