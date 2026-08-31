import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { generatorRegistry } from '@/engine/registry'
import { renderDesignToSvgString } from '@/engine/render'
import { composeLayers, defaultLayerState } from '@/engine/composeLayers'
import { useSavedStore, type SavedDesign } from '@/state/useSavedStore'
import { useDesignStore } from '@/state/useDesignStore'
import { Button } from '@/components/ui/Button'
import { TrashIcon, SparkleIcon } from '@/components/ui/icons'

export function Saved() {
  const designs = useSavedStore((s) => s.designs)

  if (!designs.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Nothing here yet.</h1>
        <p className="mt-2 max-w-sm text-text-muted">Make something weird and save it.</p>
        <StartButton />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Saved designs</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {designs.map((d) => (
          <SavedCard key={d.id} design={d} />
        ))}
      </div>
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
  const loadSnapshot = useDesignStore((s) => s.loadSnapshot)

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

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-surface-elevated">
      <button onClick={open} className="block w-full" style={{ background: design.palette.background }}>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: markup }} />
      </button>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="truncate text-sm font-medium text-text">{design.name}</span>
        <button
          aria-label="Delete"
          onClick={() => remove(design.id)}
          className="rounded-full p-1 text-text-muted opacity-0 transition-opacity hover:bg-control-bg hover:text-text group-hover:opacity-100"
        >
          <TrashIcon width={15} height={15} />
        </button>
      </div>
    </div>
  )
}
