import clsx from 'clsx'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  className?: string
}

export function Slider({ label, value, min, max, step, onChange, formatValue, className }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className={clsx('block', className)}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-text">{label}</span>
        <span className="text-xs tabular-nums text-text-muted">{formatValue ? formatValue(value) : Math.round(value * 100) / 100}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-control-bg"
        style={{ backgroundImage: `linear-gradient(to right, var(--accent) ${pct}%, transparent ${pct}%)` }}
      />
    </label>
  )
}
