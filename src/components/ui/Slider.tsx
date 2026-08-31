import { useState } from 'react'
import clsx from 'clsx'
import { useRafThrottle } from '@/hooks/useRafThrottle'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  /** Fired frequently while dragging (no history entry) — cheap, for live visual feedback. */
  onChange: (value: number) => void
  /** Fired once when the drag/keypress ends — this is what should push undo history. */
  onCommit?: (value: number) => void
  formatValue?: (value: number) => string
  className?: string
}

export function Slider({ label, value, min, max, step, onChange, onCommit, formatValue, className }: SliderProps) {
  const [display, setDisplay] = useState(value)
  // Resync from an external change (undo/redo, randomize, locks) during render, not in an effect —
  // avoids an extra render pass. Our own live edits never touch `value` until the drag commits.
  const [trackedValue, setTrackedValue] = useState(value)
  if (value !== trackedValue) {
    setTrackedValue(value)
    setDisplay(value)
  }

  const raf = useRafThrottle()

  const handleInput = (v: number) => {
    setDisplay(v)
    raf.schedule(() => onChange(v))
  }

  const commit = () => {
    raf.cancel()
    ;(onCommit ?? onChange)(display)
  }

  const pct = ((display - min) / (max - min)) * 100
  return (
    <label className={clsx('block', className)}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-text">{label}</span>
        <span className="text-xs tabular-nums text-text-muted">{formatValue ? formatValue(display) : Math.round(display * 100) / 100}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={display}
        onChange={(e) => handleInput(Number(e.target.value))}
        onMouseUp={commit}
        onTouchEnd={commit}
        onKeyUp={commit}
        onBlur={commit}
        className="slider-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-control-bg"
        style={{ backgroundImage: `linear-gradient(to right, var(--accent) ${pct}%, transparent ${pct}%)` }}
      />
    </label>
  )
}
