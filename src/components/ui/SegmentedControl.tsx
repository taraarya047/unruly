import clsx from 'clsx'

interface Option<T extends string> {
  label: string
  value: T
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div className={clsx('inline-flex items-center gap-0.5 rounded-full bg-control-bg p-1', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150',
            value === opt.value ? 'bg-surface-elevated text-text shadow-sm' : 'text-text-muted hover:text-text',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
