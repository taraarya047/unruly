import { useUIStore } from '@/state/useUIStore'
import { Modal } from '@/components/ui/Modal'

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl'

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'Space', label: 'Evolve' },
  { keys: 'R', label: 'Randomize (Surprise me)' },
  { keys: 'C', label: 'New palette (Recolor)' },
  { keys: `${mod}+Z`, label: 'Undo' },
  { keys: `${mod}+⇧+Z`, label: 'Redo' },
  { keys: `${mod}+S`, label: 'Save' },
  { keys: 'F', label: 'Fit canvas' },
  { keys: '0', label: 'Reset zoom' },
  { keys: '?', label: 'Show this panel' },
]

export function ShortcutsModal() {
  const open = useUIStore((s) => s.shortcutsOpen)
  const setOpen = useUIStore((s) => s.setShortcutsOpen)

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard shortcuts">
      <div className="space-y-2.5">
        {SHORTCUTS.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-sm text-text">{s.label}</span>
            <kbd className="rounded-md border border-border bg-control-bg px-2 py-0.5 font-mono text-xs text-text-muted">{s.keys}</kbd>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-text-muted">Shortcuts are active on the Playground page and skipped while typing in a field.</p>
    </Modal>
  )
}
