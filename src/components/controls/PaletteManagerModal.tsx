import { useState } from 'react'
import type { Palette } from '@/palette/types'
import { PALETTE_PRESETS, PINNED_PALETTE_IDS } from '@/palette/presets'
import { useCustomPaletteStore } from '@/state/useCustomPaletteStore'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PlusIcon, TrashIcon, ChevronDownIcon } from '@/components/ui/icons'

interface PaletteManagerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (palette: Palette) => void
  /** Pre-fills the editor with these colors when opened via "Save current as new palette". */
  seedForNew?: Palette | null
}

function emptyDraft(): Palette {
  return { id: '', name: '', colors: ['#ff5a36', '#171512'], background: '#ffffff' }
}

export function PaletteManagerModal({ open, onClose, onSelect, seedForNew }: PaletteManagerModalProps) {
  const custom = useCustomPaletteStore((s) => s.palettes)
  const add = useCustomPaletteStore((s) => s.add)
  const update = useCustomPaletteStore((s) => s.update)
  const remove = useCustomPaletteStore((s) => s.remove)
  const reorder = useCustomPaletteStore((s) => s.reorder)
  const [editing, setEditing] = useState<Palette | 'new' | null>(null)

  const handleClose = () => {
    setEditing(null)
    onClose()
  }

  const startNew = () => setEditing('new')

  const openNewFromSeed = () => {
    if (seedForNew) setEditing({ ...seedForNew, id: '', name: seedForNew.name === 'Custom' ? '' : `${seedForNew.name} copy` })
  }

  const saveDraft = (draft: Palette) => {
    if (editing === 'new' || (editing && !editing.id)) {
      add({ name: draft.name || 'Untitled palette', colors: draft.colors, background: draft.background })
    } else if (editing) {
      update(editing.id, { name: draft.name, colors: draft.colors, background: draft.background })
    }
    setEditing(null)
  }

  const move = (id: string, direction: 'up' | 'down') => {
    const ids = custom.map((p) => p.id)
    const idx = ids.indexOf(id)
    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= ids.length) return
    const next = [...ids]
    ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
    reorder(next)
  }

  if (editing) {
    return (
      <Modal open={open} onClose={handleClose} title={editing === 'new' || !editing.id ? 'New palette' : 'Edit palette'}>
        <PaletteEditor initial={editing === 'new' ? emptyDraft() : editing} onCancel={() => setEditing(null)} onSave={saveDraft} />
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Manage palettes">
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 text-xs font-medium text-text-muted">Built-in</div>
          <div className="space-y-1">
            {PALETTE_PRESETS.map((p) => (
              <PaletteRow key={p.id} palette={p} pinned={PINNED_PALETTE_IDS.includes(p.id)} onClick={() => onSelect(p)} />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Your palettes</span>
            {seedForNew && (
              <button onClick={openNewFromSeed} className="text-xs font-medium text-accent-text hover:underline">
                Save current colors as new
              </button>
            )}
          </div>
          {custom.length === 0 ? (
            <p className="py-2 text-xs text-text-muted">No custom palettes yet.</p>
          ) : (
            <div className="space-y-1">
              {custom.map((p, i) => (
                <PaletteRow
                  key={p.id}
                  palette={p}
                  onClick={() => onSelect(p)}
                  onEdit={() => setEditing(p)}
                  onDelete={() => remove(p.id)}
                  onMoveUp={i > 0 ? () => move(p.id, 'up') : undefined}
                  onMoveDown={i < custom.length - 1 ? () => move(p.id, 'down') : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <Button className="w-full" icon={<PlusIcon width={14} height={14} />} onClick={startNew}>
          New palette
        </Button>
      </div>
    </Modal>
  )
}

function PaletteRow({
  palette,
  pinned,
  onClick,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  palette: Palette
  pinned?: boolean
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-control-bg">
      <button onClick={onClick} className="flex flex-1 items-center gap-2 overflow-hidden text-left">
        <span className="flex h-6 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
          {palette.colors.slice(0, 5).map((c, i) => (
            <span key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </span>
        <span className="truncate text-sm text-text">{palette.name}</span>
        {pinned && <span className="shrink-0 rounded-full bg-control-bg px-1.5 py-0.5 text-[10px] font-medium text-text-muted">Pinned</span>}
      </button>
      {onMoveUp !== undefined && (
        <button aria-label="Move up" onClick={onMoveUp} disabled={!onMoveUp} className="rotate-180 text-text-muted hover:text-text disabled:opacity-20">
          <ChevronDownIcon width={13} height={13} />
        </button>
      )}
      {onMoveDown !== undefined && (
        <button aria-label="Move down" onClick={onMoveDown} disabled={!onMoveDown} className="text-text-muted hover:text-text disabled:opacity-20">
          <ChevronDownIcon width={13} height={13} />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className="rounded-md px-1.5 py-0.5 text-xs font-medium text-text-muted hover:bg-control-hover hover:text-text">
          Edit
        </button>
      )}
      {onDelete && (
        <button aria-label="Delete palette" onClick={onDelete} className="rounded-md p-1 text-text-muted hover:bg-control-hover hover:text-text">
          <TrashIcon width={13} height={13} />
        </button>
      )}
    </div>
  )
}

function PaletteEditor({ initial, onSave, onCancel }: { initial: Palette; onSave: (p: Palette) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial.name)
  const [background, setBackground] = useState(initial.background)
  const [colors, setColors] = useState(initial.colors)

  const setColor = (i: number, hex: string) => setColors((c) => c.map((x, idx) => (idx === i ? hex : x)))
  const addColor = () => colors.length < 8 && setColors((c) => [...c, c[c.length - 1] ?? '#888888'])
  const removeColor = (i: number) => colors.length > 2 && setColors((c) => c.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs text-text-muted">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My palette"
          className="w-full rounded-lg border border-border bg-control-bg px-2.5 py-1.5 text-sm text-text"
        />
      </label>

      <div>
        <span className="mb-1.5 block text-xs text-text-muted">Colors</span>
        <div className="flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <div key={i} className="relative">
              <span className="relative block h-9 w-9 overflow-hidden rounded-full ring-1 ring-black/10" style={{ backgroundColor: c }}>
                <input
                  type="color"
                  value={c}
                  onChange={(e) => setColor(i, e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label={`Color ${i + 1}`}
                />
              </span>
              {colors.length > 2 && (
                <button
                  aria-label={`Remove color ${i + 1}`}
                  onClick={() => removeColor(i)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-text text-[10px] text-bg"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {colors.length < 8 && (
            <button
              aria-label="Add color"
              onClick={addColor}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border text-text-muted hover:text-text"
            >
              <PlusIcon width={14} height={14} />
            </button>
          )}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs text-text-muted">Background</span>
        <span className="relative inline-block h-9 w-9 overflow-hidden rounded-full ring-1 ring-border">
          <input
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span className="pointer-events-none absolute inset-0" style={{ backgroundColor: background }} />
        </span>
      </label>

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => onSave({ ...initial, name, background, colors })}
        >
          Save palette
        </Button>
      </div>
    </div>
  )
}
