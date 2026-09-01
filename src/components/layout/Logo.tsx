interface LogoProps {
  className?: string
  iconSize?: number
}

/** The app's star-in-badge mark — also the source shape for public/favicon.svg and public/logo.svg. */
export function Logo({ className, iconSize = 16 }: LogoProps) {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground ${className ?? ''}`}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2.2 6.8H21l-5.6 4.1L17.6 21 12 16.9 6.4 21l2.2-7.1L3 9.8h6.8L12 3Z" fill="currentColor" />
      </svg>
    </span>
  )
}
