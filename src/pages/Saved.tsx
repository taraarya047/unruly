import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generatorRegistry } from '@/engine/registry'
import { renderDesignToSvgString } from '@/engine/render'
import { composeLayers, defaultLayerState } from '@/engine/composeLayers'
import { useSavedStore, type SavedDesign } from '@/state/useSavedStore'
import { useDesignStore } from '@/state/useDesignStore'
import { Button } from '@/components/ui/Button'
import { TrashIcon, SparkleIcon, CopyIcon } from '@/components/ui/icons'

export function Saved() {
  const designs = useSavedStore((s) => s.designs)
  const [query, setQuery] = useState('')

  if (!designs.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Nothing here yet.</h1>
        <p className="mt-2 max-w-sm text-text-muted">Make something weird and save it.</p>
        <StartButton />
      </div>
    )
  }

  const filtered = designs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Saved designs</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          className="w-56 rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-sm text-text placeholder:text-text-muted"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">No saved designs match “{query}”.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((d) => (
            <SavedCard key={d.id} design={d} />
          ))}
        </div>
      )}
    </div>
  )
}

function StartButton() {
  const navigate = useNavigate()
  return (
    <Button variant="primary" size="lg" className="mt-6" icon={<SparkleIcon width={18} height={18} />} onClick={() => navigate('/playground')}>
      Start experimenting
    </Button>
  )
}

function SavedCard({ design }: { design: SavedDesign }) {
  const navigate = useNavigate()
  const remove = useSavedStore((s) => s.remove)
  const rename = useSavedStore((s) => s.rename)
  const duplicate = useSavedStore((s) => s.duplicate)
  const loadSnapshot = useDesignStore((s) => s.loadSnapshot)
  const [editingName, setEditingName] = useState<string | null>(null)

  const generator = generatorRegistry.get(design.generatorId)
  const markup = useMemo(() => {
    if (!generator) return ''
    const rendered = generator.generate(design.parameters, design.seed, design.palette.colors)
    const composed = composeLayers(rendered, design.palette, design.layers ?? defaultLayerState())
    return renderDesignToSvgString(composed, { includeMetadata: false, sizeMode: 'fill' })
  }, [generator, design])

  const open = () => {
    loadSnapshot({
      generatorId: design.generatorId,
      parameters: design.parameters,
      seed: design.seed,
      palette: design.palette,
      layers: design.layers ?? defaultLayerState(),
    })
    navigate('/playground')
  }

  const commitRename = () => {
    if (editingName !== null && editingName.trim()) rename(design.id, editingName.trim())
    setEditingName(null)
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-surface-elevated">
      <button onClick={open} className="block w-full" style={{ background: design.palette.background }}>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: markup }} />
      </button>
      <div className="flex items-center justify-between gap-1 px-3 py-2">
        {editingName !== null ? (
          <input
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setEditingName(null)
            }}
            className="min-w-0 flex-1 rounded border border-border bg-control-bg px-1.5 py-0.5 text-sm text-text"
          />
        ) : (
          <button
            onClick={() => setEditingName(design.name)}
            title="Click to rename"
            className="min-w-0 flex-1 truncate text-left text-sm font-medium text-text hover:underline"
          >
            {design.name}
          </button>
        )}
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
          <button
            aria-label="Duplicate"
            onClick={() => duplicate(design.id)}
            className="rounded-full p-1 text-text-muted hover:bg-control-bg hover:text-text"
          >
            <CopyIcon width={14} height={14} />
          </button>
          <button aria-label="Delete" onClick={() => remove(design.id)} className="rounded-full p-1 text-text-muted hover:bg-control-bg hover:text-text">
            <TrashIcon width={14} height={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
