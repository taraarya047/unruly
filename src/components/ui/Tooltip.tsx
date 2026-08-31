import { useState, type ReactNode } from 'react'
import clsx from 'clsx'

interface TooltipProps {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom'
}

export function Tooltip({ label, children, side = 'bottom' }: TooltipProps) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span
        role="tooltip"
        className={clsx(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-text px-2 py-1 text-xs font-medium text-bg transition-opacity duration-150',
          side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
          open ? 'opacity-100' : 'opacity-0',
        )}
      >
        {label}
      </span>
    </span>
  )
}
