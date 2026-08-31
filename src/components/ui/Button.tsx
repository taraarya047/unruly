import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', icon, className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none',
        {
          'bg-accent text-accent-foreground hover:brightness-110': variant === 'primary',
          'bg-control-bg text-text hover:bg-control-hover': variant === 'secondary',
          'text-text hover:bg-control-bg': variant === 'ghost',
        },
        {
          'text-sm px-3 py-1.5': size === 'sm',
          'text-sm px-4 py-2': size === 'md',
          'text-base px-5 py-2.5': size === 'lg',
        },
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
