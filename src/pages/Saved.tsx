import { useMemo, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { generatorRegistry } from '@/engine/registry'
import { renderDesignToSvgString } from '@/engine/render'
import { composeLayers, defaultLayerState } from '@/engine/composeLayers'
import { mergeGeneratorLayers } from '@/engine/composeGeneratorLayers'
import { useSavedStore, type SavedDesign } from '@/state/useSavedStore'
import { useDesignStore } from '@/state/useDesignStore'
import { serializeDesignFile, parseDesignFile } from '@/export/designFile'
import { downloadTextFile } from '@/export/download'
import { useToastStore } from '@/state/useToastStore'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { Button } from '@/components/ui/Button'
import { TrashIcon, SparkleIcon, CopyIcon, DownloadIcon, PlusIcon, CloseIcon } from '@/components/ui/icons'

export function Saved() {
  useDocumentMeta('Saved designs — Unruly', 'Your saved parametric designs — search, tag, duplicate, and reopen anything you’ve made.')
  const designs = useSavedStore((s) => s.designs)
  const importDesign = useSavedStore((s) => s.importDesign)
  const show = useToastStore((s) => s.show)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allTags = useMemo(() => Array.from(new Set(designs.flatMap((d) => d.tags ?? []))).sort(), [designs])

  const handleImportFile = async (file: File) => {
    const text = await file.text()
    const parsed = parseDesignFile(text)
    if (!parsed) {
      show('That file doesn’t look like a valid design export')
      return
    }
    importDesign(parsed)
    show(`Imported "${parsed.name}"`)
  }

  if (!designs.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Nothing here yet.</h1>
        <p className="mt-2 max-w-sm text-text-muted">Make something weird and save it.</p>
        <div className="mt-6 flex items-center gap-2">
          <StartButton />
          <Button icon={<DownloadIcon width={15} height={15} />} onClick={() => fileInputRef.current?.click()}>
            Import a design
          </Button>
        </div>
        <ImportInput inputRef={fileInputRef} onFile={handleImportFile} />
      </div>
    )
  }

  const filtered = designs.filter((d) => {
    const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase())
    const matchesTag = !activeTag || (d.tags ?? []).includes(activeTag)
    return matchesQuery && matchesTag
  })

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Saved designs</h1>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            className="w-56 rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-sm text-text placeholder:text-text-muted"
          />
          <Button size="sm" icon={<DownloadIcon width={14} height={14} />} onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
          <ImportInput inputRef={fileInputRef} onFile={handleImportFile} />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!activeTag ? 'bg-accent text-accent-foreground' : 'bg-control-bg text-text-muted hover:text-text'}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${activeTag === tag ? 'bg-accent text-accent-foreground' : 'bg-control-bg text-text-muted hover:text-text'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">No saved designs match this filter.</p>
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

function ImportInput({ inputRef, onFile }: { inputRef: RefObject<HTMLInputElement | null>; onFile: (file: File) => void }) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="application/json"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) onFile(file)
        e.target.value = ''
      }}
    />
  )
}

function StartButton() {
  const navigate = useNavigate()
  return (
    <Button variant="primary" size="lg" icon={<SparkleIcon width={18} height={18} />} onClick={() => navigate('/playground')}>
      Start experimenting
    </Button>
  )
}

function SavedCard({ design }: { design: SavedDesign }) {
  const navigate = useNavigate()
  const remove = useSavedStore((s) => s.remove)
  const rename = useSavedStore((s) => s.rename)
  const duplicate = useSavedStore((s) => s.duplicate)
  const addTag = useSavedStore((s) => s.addTag)
  const removeTag = useSavedStore((s) => s.removeTag)
  const loadSnapshot = useDesignStore((s) => s.loadSnapshot)
  const show = useToastStore((s) => s.show)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [addingTag, setAddingTag] = useState(false)
  const [tagDraft, setTagDraft] = useState('')

  const generator = generatorRegistry.get(design.generatorId)
  const markup = useMemo(() => {
    if (!generator) return ''
    const rendered = generator.generate(design.parameters, design.seed, design.palette.colors)
    const composed = composeLayers(rendered, design.palette, design.layers ?? defaultLayerState())
    const layered = mergeGeneratorLayers(composed, design.generatorLayers ?? [], design.palette)
    return renderDesignToSvgString(layered, { includeMetadata: false, sizeMode: 'fill' })
  }, [generator, design])

  const open = () => {
    loadSnapshot({
      generatorId: design.generatorId,
      parameters: design.parameters,
      seed: design.seed,
      palette: design.palette,
      layers: design.layers ?? defaultLayerState(),
      generatorLayers: design.generatorLayers ?? [],
    })
    navigate('/playground')
  }

  const commitRename = () => {
    if (editingName !== null && editingName.trim()) rename(design.id, editingName.trim())
    setEditingName(null)
  }

  const commitTag = () => {
    if (tagDraft.trim()) addTag(design.id, tagDraft)
    setTagDraft('')
    setAddingTag(false)
  }

  const exportJson = () => {
    downloadTextFile(`${design.name.replace(/\s+/g, '-').toLowerCase()}.json`, serializeDesignFile(design), 'application/json')
    show('Design exported')
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-surface-elevated">
      <button onClick={open} className="block w-full" style={{ background: design.palette.background }}>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: markup }} />
      </button>
      <div className="flex items-center justify-between gap-1 px-3 pt-2">
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
          <button aria-label="Export as JSON" onClick={exportJson} className="rounded-full p-1 text-text-muted hover:bg-control-bg hover:text-text">
            <DownloadIcon width={14} height={14} />
          </button>
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

      <div className="flex flex-wrap items-center gap-1 px-3 pb-2.5 pt-1.5">
        {(design.tags ?? []).map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-control-bg px-2 py-0.5 text-[11px] text-text-muted">
            {tag}
            <button aria-label={`Remove tag ${tag}`} onClick={() => removeTag(design.id, tag)} className="hover:text-text">
              <CloseIcon width={9} height={9} />
            </button>
          </span>
        ))}
        {addingTag ? (
          <input
            autoFocus
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onBlur={commitTag}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTag()
              if (e.key === 'Escape') {
                setTagDraft('')
                setAddingTag(false)
              }
            }}
            placeholder="tag"
            className="w-16 rounded-full border border-border bg-control-bg px-2 py-0.5 text-[11px] text-text"
          />
        ) : (
          <button
            onClick={() => setAddingTag(true)}
            className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] text-text-muted opacity-0 transition-opacity hover:bg-control-bg hover:text-text group-hover:opacity-100"
          >
            <PlusIcon width={9} height={9} />
            tag
          </button>
        )}
      </div>
    </div>
  )
}
