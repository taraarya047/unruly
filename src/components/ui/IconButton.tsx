import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { Tooltip } from './Tooltip'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  children: ReactNode
}

export function IconButton({ label, active, className, children, ...rest }: IconButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        aria-label={label}
        className={clsx(
          'inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 disabled:opacity-30 disabled:pointer-events-none',
          active ? 'bg-accent text-accent-foreground' : 'text-text hover:bg-control-bg',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  )
}
