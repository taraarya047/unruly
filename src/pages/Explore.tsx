import { useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { generatorRegistry } from '@/engine/registry'
import { renderDesignToSvgString } from '@/engine/render'
import { composeLayers, defaultLayerState } from '@/engine/composeLayers'
import { createRng } from '@/engine/prng'
import { generateVariations } from '@/engine/evolve'
import { PALETTE_PRESETS } from '@/palette/presets'
import { useDesignStore } from '@/state/useDesignStore'
import { copySvgToClipboard } from '@/export/clipboard'
import { useToastStore } from '@/state/useToastStore'
import { useHistoryState } from '@/hooks/useHistoryState'
import { AdSlot } from '@/components/ads/AdSlot'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ShuffleIcon, PaletteIcon, CopyIcon, UndoIcon, RedoIcon } from '@/components/ui/icons'

interface GalleryItem {
  generatorId: string
  seed: number
  paletteIndex: number
}

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
  const [category, setCategory] = useState<'all' | string>('all')
  const items = useMemo(() => buildGallery(24), [])

  const categories = ['all', ...Array.from(new Set(generatorRegistry.all().map((g) => g.category)))]
  const filtered = items.filter((item) => category === 'all' || generatorRegistry.get(item.generatorId)!.category === category)

  const openInPlayground = (item: GalleryItem, seed: number, paletteIndex: number) => {
    const generator = generatorRegistry.get(item.generatorId)!
    setGenerator(generator.id)
    setParameters({ ...generator.defaultParameters })
    setSeed(seed)
    setPalette(PALETTE_PRESETS[paletteIndex])
    navigate('/playground')
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Explore</h1>
          <p className="mt-1 text-sm text-text-muted">
            Click anything to open it in the playground — or evolve, recolor, and copy it right here.
          </p>
        </div>
        <SegmentedControl
          options={categories.map((c) => ({ label: c === 'all' ? 'All' : c[0].toUpperCase() + c.slice(1), value: c }))}
          value={category}
          onChange={setCategory}
        />
      </div>

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {filtered.slice(0, 12).map((item, i) => (
          <GalleryTile key={i} item={item} onOpen={openInPlayground} />
        ))}
      </div>

      <div className="my-8">
        <AdSlot variant="inline" placement="explore-midgallery" />
      </div>

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {filtered.slice(12).map((item, i) => (
          <GalleryTile key={i} item={item} onOpen={openInPlayground} />
        ))}
      </div>
    </div>
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
