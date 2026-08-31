import { useId, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import { useEscapeToClose } from '@/hooks/useEscapeToClose'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId()
  useEscapeToClose(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <span id={titleId} className="text-sm font-semibold text-text">
            {title}
          </span>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-control-bg">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
