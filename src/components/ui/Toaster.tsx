import { useToastStore } from '@/state/useToastStore'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-full bg-text px-4 py-2 text-sm font-medium text-bg shadow-lg animate-[toast-in_180ms_ease-out]"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
