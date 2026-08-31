import { useId, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import { useEscapeToClose } from '@/hooks/useEscapeToClose'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const titleId = useId()
  useEscapeToClose(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end md:hidden" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[75vh] rounded-t-2xl border-t border-border bg-surface-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span id={titleId} className="text-sm font-semibold text-text">
            {title}
          </span>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-control-bg">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-1" style={{ maxHeight: '65vh' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
