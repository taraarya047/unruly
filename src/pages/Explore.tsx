import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generatorRegistry } from '@/engine/registry'
import { renderDesignToSvgString } from '@/engine/render'
import { createRng } from '@/engine/prng'
import { PALETTE_PRESETS } from '@/palette/presets'
import { useDesignStore } from '@/state/useDesignStore'
import { AdSlot } from '@/components/ads/AdSlot'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

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

  const openInPlayground = (item: GalleryItem) => {
    const generator = generatorRegistry.get(item.generatorId)!
    setGenerator(generator.id)
    setParameters({ ...generator.defaultParameters })
    setSeed(item.seed)
    setPalette(PALETTE_PRESETS[item.paletteIndex])
    navigate('/playground')
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Explore</h1>
          <p className="mt-1 text-sm text-text-muted">Click anything to open it in the playground and remix it.</p>
        </div>
        <SegmentedControl
          options={categories.map((c) => ({ label: c === 'all' ? 'All' : c[0].toUpperCase() + c.slice(1), value: c }))}
          value={category}
          onChange={setCategory}
        />
      </div>

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {filtered.slice(0, 12).map((item, i) => (
          <GalleryTile key={i} item={item} onClick={() => openInPlayground(item)} />
        ))}
      </div>

      <div className="my-8">
        <AdSlot variant="inline" placement="explore-midgallery" />
      </div>

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {filtered.slice(12).map((item, i) => (
          <GalleryTile key={i} item={item} onClick={() => openInPlayground(item)} />
        ))}
      </div>
    </div>
  )
}

function GalleryTile({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const generator = generatorRegistry.get(item.generatorId)!
  const palette = PALETTE_PRESETS[item.paletteIndex]
  const markup = useMemo(() => {
    const design = generator.generate(generator.defaultParameters, item.seed, palette.colors)
    return renderDesignToSvgString(design, { includeMetadata: false, sizeMode: 'fill' })
  }, [generator, item.seed, palette])

  return (
    <button
      onClick={onClick}
      className="block w-full overflow-hidden rounded-xl border border-border transition-transform duration-200 hover:scale-[1.02]"
      style={{ background: palette.background }}
    >
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: markup }} />
    </button>
  )
}
