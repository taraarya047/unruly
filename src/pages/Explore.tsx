import { useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { generatorRegistry } from '@/engine/registry'
import type { GeneratorParameters } from '@/engine/types'
import { renderDesignToSvgString } from '@/engine/render'
import { composeLayers, defaultLayerState } from '@/engine/composeLayers'
import { createRng } from '@/engine/prng'
import { generateVariations } from '@/engine/evolve'
import { PALETTE_PRESETS } from '@/palette/presets'
import { DESIGN_PRESETS, type DesignPreset } from '@/presets/designPresets'
import { useDesignStore } from '@/state/useDesignStore'
import { copySvgToClipboard } from '@/export/clipboard'
import { useToastStore } from '@/state/useToastStore'
import { useHistoryState } from '@/hooks/useHistoryState'
import { AdSlot } from '@/components/ads/AdSlot'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ShuffleIcon, PaletteIcon, CopyIcon, UndoIcon, RedoIcon } from '@/components/ui/icons'

interface GalleryItem {
  generatorId: string
  seed: number
  paletteIndex: number
}

const BATCH_SIZE = 24
const MAX_ITEMS = 120

// Deterministic across page loads AND across "Load more" clicks: the same seeded RNG stream is just
// replayed from the start each time and re-sliced to a larger count, so buildGallery(48)'s first 24
// draws are byte-identical to buildGallery(24)'s — no separate per-page seed bookkeeping needed.
function buildGallery(count: number): GalleryItem[] {
  const rng = createRng(42)
  const generators = generatorRegistry.all()
  return Array.from({ length: count }, () => ({
    generatorId: rng.pick(generators).id,
    seed: rng.int(1, 999999),
    paletteIndex: rng.int(0, PALETTE_PRESETS.length - 1),
  }))
}

export function Explore() {
  const navigate = useNavigate()
  const setGenerator = useDesignStore((s) => s.setGenerator)
  const setSeed = useDesignStore((s) => s.setSeed)
  const setPalette = useDesignStore((s) => s.setPalette)
  const setParameters = useDesignStore((s) => s.setParameters)
  const applyPreset = useDesignStore((s) => s.applyPreset)
  const [category, setCategory] = useState<'all' | string>('all')
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const items = useMemo(() => buildGallery(visibleCount), [visibleCount])

  const categories = ['all', ...Array.from(new Set(generatorRegistry.all().map((g) => g.category)))]
  const filtered = items.filter((item) => category === 'all' || generatorRegistry.get(item.generatorId)!.category === category)
  const firstHalf = Math.ceil(filtered.length / 2)

  const openInPlayground = (item: GalleryItem, seed: number, paletteIndex: number) => {
    const generator = generatorRegistry.get(item.generatorId)!
    setGenerator(generator.id)
    setParameters({ ...generator.defaultParameters })
    setSeed(seed)
    setPalette(PALETTE_PRESETS[paletteIndex])
    navigate('/playground')
  }

  const openPreset = (preset: DesignPreset) => {
    applyPreset(preset)
    navigate('/playground')
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Explore</h1>
        <p className="mt-1 text-sm text-text-muted">Click anything to open it in the playground.</p>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold text-text">Curated presets</h2>
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
          {DESIGN_PRESETS.map((preset) => (
            <PresetTile key={preset.id} preset={preset} onOpen={() => openPreset(preset)} />
          ))}
        </div>
      </section>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-text">Generator gallery</h2>
        <SegmentedControl
          options={categories.map((c) => ({ label: c === 'all' ? 'All' : c[0].toUpperCase() + c.slice(1), value: c }))}
          value={category}
          onChange={setCategory}
        />
      </div>

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {filtered.slice(0, firstHalf).map((item, i) => (
          <GalleryTile key={i} item={item} onOpen={openInPlayground} />
        ))}
      </div>

      <div className="my-8">
        <AdSlot variant="inline" placement="explore-midgallery" />
      </div>

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {filtered.slice(firstHalf).map((item, i) => (
          <GalleryTile key={i} item={item} onOpen={openInPlayground} />
        ))}
      </div>

      {visibleCount < MAX_ITEMS && (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" onClick={() => setVisibleCount((c) => Math.min(MAX_ITEMS, c + BATCH_SIZE))}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}

function PresetTile({ preset, onOpen }: { preset: DesignPreset; onOpen: () => void }) {
  const generator = generatorRegistry.get(preset.generatorId)
  const markup = useMemo(() => {
    if (!generator) return ''
    const parameters = { ...generator.defaultParameters, ...preset.parameters } as GeneratorParameters
    const design = generator.generate(parameters, preset.seed ?? 11, preset.palette.colors)
    return renderDesignToSvgString(design, { includeMetadata: false, sizeMode: 'fill' })
  }, [generator, preset])

  if (!generator) return null

  return (
    <button
      onClick={onOpen}
      title={preset.description}
      className="group block w-full overflow-hidden rounded-xl border border-border text-left transition-transform duration-200 hover:scale-[1.02]"
    >
      <div style={{ background: preset.palette.background }} dangerouslySetInnerHTML={{ __html: markup }} />
      <div className="bg-surface-elevated px-2.5 py-2">
        <div className="truncate text-sm font-medium text-text">{preset.name}</div>
        <div className="truncate text-xs text-text-muted">{preset.description}</div>
      </div>
    </button>
  )
}

interface TileState {
  seed: number
  paletteIndex: number
}

function GalleryTile({ item, onOpen }: { item: GalleryItem; onOpen: (item: GalleryItem, seed: number, paletteIndex: number) => void }) {
  const generator = generatorRegistry.get(item.generatorId)!
  const show = useToastStore((s) => s.show)
  const { value: tile, push, back, forward, canBack, canForward } = useHistoryState<TileState>({
    seed: item.seed,
    paletteIndex: item.paletteIndex,
  })
  const { seed, paletteIndex } = tile
  const palette = PALETTE_PRESETS[paletteIndex]

  const design = useMemo(() => generator.generate(generator.defaultParameters, seed, palette.colors), [generator, seed, palette])
  const markup = useMemo(() => renderDesignToSvgString(design, { includeMetadata: false, sizeMode: 'fill' }), [design])

  const evolve = (e: MouseEvent) => {
    e.stopPropagation()
    const [variation] = generateVariations(generator, generator.defaultParameters, 1, 0.2)
    push({ seed: variation.seed, paletteIndex })
  }

  const recolor = (e: MouseEvent) => {
    e.stopPropagation()
    const nextIndex = (paletteIndex + 1 + Math.floor(Math.random() * (PALETTE_PRESETS.length - 1))) % PALETTE_PRESETS.length
    push({ seed, paletteIndex: nextIndex })
  }

  const goBack = (e: MouseEvent) => {
    e.stopPropagation()
    back()
  }

  const goForward = (e: MouseEvent) => {
    e.stopPropagation()
    forward()
  }

  const copyToFigma = async (e: MouseEvent) => {
    e.stopPropagation()
    const composed = composeLayers(design, palette, defaultLayerState())
    await copySvgToClipboard(renderDesignToSvgString(composed))
    show('Copied! Paste it into Figma.')
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border transition-transform duration-200 hover:scale-[1.02]">
      <button onClick={() => onOpen(item, seed, paletteIndex)} className="block w-full" style={{ background: palette.background }}>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: markup }} />
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="pointer-events-auto flex items-center gap-1">
          {canBack && <TileAction label="Previous" onClick={goBack} icon={<UndoIcon width={14} height={14} />} />}
          {canForward && <TileAction label="Next" onClick={goForward} icon={<RedoIcon width={14} height={14} />} />}
          <TileAction label="Evolve" onClick={evolve} icon={<ShuffleIcon width={14} height={14} />} />
          <TileAction label="Recolor" onClick={recolor} icon={<PaletteIcon width={14} height={14} />} />
          <TileAction label="Copy to Figma" onClick={copyToFigma} icon={<CopyIcon width={14} height={14} />} />
        </div>
      </div>
    </div>
  )
}

function TileAction({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: (e: MouseEvent) => void }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition-transform hover:scale-110"
    >
      {icon}
    </button>
  )
}
