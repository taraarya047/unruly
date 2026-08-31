import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const SunIcon = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" /></svg>
)
export const MoonIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" /></svg>
)
export const UndoIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M8 7 4 11l4 4" /><path d="M4 11h10a6 6 0 0 1 0 12h-2" /></svg>
)
export const RedoIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M16 7l4 4-4 4" /><path d="M20 11H10a6 6 0 0 0 0 12h2" /></svg>
)
export const SaveIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></svg>
)
export const ShuffleIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M3 6h3.5c2 0 3 1 4 2.5L15 18h4M3 18h3.5c2 0 3-1 4-2.5" /><path d="M16 4l3 2-3 2M16 20l3-2-3-2" /></svg>
)
export const SparkleIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M19 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" /></svg>
)
export const LockIcon = (p: IconProps) => (
  <svg {...base} {...p}><rect x="5.5" y="10.5" width="13" height="9" rx="1.5" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></svg>
)
export const UnlockIcon = (p: IconProps) => (
  <svg {...base} {...p}><rect x="5.5" y="10.5" width="13" height="9" rx="1.5" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 6.5-1.8" /></svg>
)
export const CopyIcon = (p: IconProps) => (
  <svg {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="1.5" /><path d="M5.5 15H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h8.5A1.5 1.5 0 0 1 15 5v.5" /></svg>
)
export const DownloadIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M12 4v11" /><path d="M7.5 11.5 12 16l4.5-4.5" /><path d="M4.5 19h15" /></svg>
)
export const CheckIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M4.5 12.5 9.5 17.5 19.5 6.5" /></svg>
)
export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M6 9l6 6 6-6" /></svg>
)
export const CloseIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const PlusIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
)
export const TrashIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M5 7h14M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M7 7l1 13h8l1-13" /></svg>
)
export const LayersIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z" /><path d="M3.5 12l8.5 4.5L20.5 12" /><path d="M3.5 16l8.5 4.5L20.5 16" /></svg>
)
export const PaletteIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 2-2 0-.7-.4-1.1-.4-1.8 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4c0-4.4-4-7.5-9-7.5Z" /><circle cx="8" cy="12" r="1" fill="currentColor" /><circle cx="9.5" cy="8.5" r="1" fill="currentColor" /><circle cx="14" cy="8" r="1" fill="currentColor" /></svg>
)
export const HelpIcon = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M9.8 9.5a2.2 2.2 0 1 1 3.2 2c-.9.6-1.4 1-1.4 2" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" /></svg>
)
export const ZoomInIcon = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.3 15.3 20 20M10.5 8v5M8 10.5h5" /></svg>
)
export const ZoomOutIcon = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.3 15.3 20 20M8 10.5h5" /></svg>
)
export const FitIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
)
export const GridIcon = (p: IconProps) => (
  <svg {...base} {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><rect x="13.5" y="13.5" width="7" height="7" rx="1" /></svg>
)
export const EyeIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>
)
export const LinkIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M9.5 14.5 14.5 9.5" /><path d="M11 7.5l1.4-1.4a3.5 3.5 0 0 1 5 5L16 12.5M13 16.5l-1.4 1.4a3.5 3.5 0 0 1-5-5L8 11.5" /></svg>
)
export const EyeOffIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M3.5 3.5l17 17" /><path d="M10.6 5.7c.45-.1.9-.15 1.4-.15 6 0 9.5 6.5 9.5 6.5a15 15 0 0 1-3.3 3.9M6.7 6.7A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.25 3.3-.65" /><path d="M9.5 12a2.5 2.5 0 0 0 3.6 2.24" /></svg>
)
