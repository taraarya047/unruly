import { useRef } from 'react'
import clsx from 'clsx'
import type { NumberParamSchema } from '@/engine/types'
import type { Keyframe } from '@/engine/easing'
import { evaluateTrack } from '@/engine/easing'
import { CloseIcon } from '@/components/ui/icons'

interface TrackLaneProps {
  schema: NumberParamSchema
  keyframes: Keyframe[]
  duration: number
  pixelsPerSecond: number
  selectedKeyframeId: string | null
  /** Where the playhead currently is — lets keyboard users drop a keyframe there (Enter on the lane). */
  currentTime: number
  onSelectKeyframe: (keyframeId: string) => void
  onAddKeyframe: (time: number, value: number) => void
  onMoveKeyframe: (keyframeId: string, time: number) => void
  onRemoveTrack: () => void
  /** Moves the playhead — called on selecting a keyframe and while dragging one, so the canvas always
   *  previews the frame at the keyframe currently being worked on. */
  onScrubToTime: (time: number) => void
}

export function TrackLane({
  schema,
  keyframes,
  duration,
  pixelsPerSecond,
  selectedKeyframeId,
  currentTime,
  onSelectKeyframe,
  onAddKeyframe,
  onMoveKeyframe,
  onRemoveTrack,
  onScrubToTime,
}: TrackLaneProps) {
  const laneRef = useRef<HTMLDivElement>(null)
  const width = duration * pixelsPerSecond

  const timeFromClientX = (clientX: number) => {
    const rect = laneRef.current!.getBoundingClientRect()
    return Math.min(duration, Math.max(0, (clientX - rect.left) / pixelsPerSecond))
  }

  const addKeyframeAt = (time: number) => {
    const existing = evaluateTrack(keyframes, time)
    onAddKeyframe(time, Number.isFinite(existing) ? existing : schema.min)
  }

  const handleLaneClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return
    addKeyframeAt(timeFromClientX(e.clientX))
  }

  const handleLaneKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    addKeyframeAt(currentTime)
  }

  const handleKeyframePointerDown = (kf: Keyframe) => (e: React.PointerEvent) => {
    e.stopPropagation()
    onSelectKeyframe(kf.id)
    onScrubToTime(kf.time)
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // No-op: pointer capture is best-effort (e.g. no active pointer session for this id).
    }
  }
  const handleKeyframePointerMove = (kf: Keyframe) => (e: React.PointerEvent) => {
    if (e.buttons !== 1) return
    const time = timeFromClientX(e.clientX)
    onMoveKeyframe(kf.id, time)
    onScrubToTime(time)
  }
  // A pointerdown-driven drag already selects + retimes on mouse/touch; keyboard users get here via
  // Enter/Space (a real click, not just the pointerdown drag-start) and arrow keys to retime in place.
  const handleKeyframeClick = (kf: Keyframe) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectKeyframe(kf.id)
    onScrubToTime(kf.time)
  }
  const handleKeyframeKeyDown = (kf: Keyframe) => (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const step = (e.shiftKey ? 1 : 0.1) * (e.key === 'ArrowLeft' ? -1 : 1)
    const time = Math.min(duration, Math.max(0, kf.time + step))
    onSelectKeyframe(kf.id)
    onMoveKeyframe(kf.id, time)
    onScrubToTime(time)
  }

  return (
    <div className="flex items-stretch border-b border-border/60">
      <div className="flex w-24 shrink-0 items-center justify-between gap-1 border-r border-border/60 bg-surface px-2 py-1.5 md:w-32">
        <span className="truncate text-xs text-text">{schema.label}</span>
        <button aria-label={`Remove ${schema.label} track`} onClick={onRemoveTrack} className="shrink-0 text-text-muted hover:text-text">
          <CloseIcon width={11} height={11} />
        </button>
      </div>
      <div
        ref={laneRef}
        role="button"
        tabIndex={0}
        aria-label={`${schema.label} keyframe track — Enter to add a keyframe at the current time`}
        onClick={handleLaneClick}
        onKeyDown={handleLaneKeyDown}
        className="relative h-9 flex-1 cursor-cell bg-control-bg/20"
        style={{ width, minWidth: '100%' }}
      >
        {keyframes.map((kf) => (
          <button
            key={kf.id}
            type="button"
            aria-label={`Keyframe at ${kf.time.toFixed(2)}s, value ${kf.value.toFixed(2)} — Left/Right arrows to retime`}
            onPointerDown={handleKeyframePointerDown(kf)}
            onPointerMove={handleKeyframePointerMove(kf)}
            onClick={handleKeyframeClick(kf)}
            onKeyDown={handleKeyframeKeyDown(kf)}
            className={clsx(
              'absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] border',
              kf.id === selectedKeyframeId ? 'border-accent bg-accent' : 'border-text-muted bg-surface-elevated hover:border-text',
            )}
            style={{ left: kf.time * pixelsPerSecond }}
          />
        ))}
      </div>
    </div>
  )
}
