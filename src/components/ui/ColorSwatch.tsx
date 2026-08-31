import clsx from 'clsx'

interface ColorSwatchProps {
  color: string
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
  onClick?: () => void
  title?: string
}

export function ColorSwatch({ color, size = 'md', selected, onClick, title }: ColorSwatchProps) {
  const Comp = onClick ? 'button' : 'span'
  return (
    <Comp
      onClick={onClick}
      title={title ?? color}
      className={clsx(
        'inline-block shrink-0 rounded-full ring-1 ring-black/10 transition-transform duration-150',
        { 'h-4 w-4': size === 'sm', 'h-6 w-6': size === 'md', 'h-9 w-9': size === 'lg' },
        onClick && 'cursor-pointer hover:scale-110',
        selected && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
      )}
      style={{ backgroundColor: color }}
    />
  )
}
