import { useEffect, useMemo, useRef, useState } from 'react'
import { generatorRegistry } from '@/engine/registry'
import { renderDesignToSvgString } from '@/engine/render'
import { generateVariations, type Variation } from '@/engine/evolve'
import { useDesignStore } from '@/state/useDesignStore'
import { ChevronDownIcon, ShuffleIcon } from '@/components/ui/icons'

/** Design-evolution tree interaction (spec §18): shows a handful of nearby variations to branch from. */
export function EvolutionPicker() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const generatorId = useDesignStore((s) => s.generatorId)
  const parameters = useDesignStore((s) => s.parameters)
  const palette = useDesignStore((s) => s.palette)
  const locks = useDesignStore((s) => s.locks)
  const randomizeEvolve = useDesignStore((s) => s.randomizeEvolve)
  const layers = useDesignStore((s) => s.layers)
  const loadSnapshot = useDesignStore((s) => s.loadSnapshot)

  const generator = generatorRegistry.get(generatorId)!

  const variations = useMemo(() => {
    if (!open) return []
    return generateVariations(generator, parameters, 6, 0.16)
  }, [open, generator, parameters])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const pick = (variation: Variation) => {
    loadSnapshot({ generatorId, parameters: variation.parameters, seed: variation.seed, palette, layers })
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center">
        <button
          onClick={randomizeEvolve}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-l-full bg-control-bg px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-control-hover"
        >
          <ShuffleIcon width={14} height={14} />
          Evolve
        </button>
        <button
          aria-label="Show variations"
          onClick={() => setOpen((v) => !v)}
          className="rounded-r-full bg-control-bg px-2 py-1.5 text-text transition-colors hover:bg-control-hover"
        >
          <ChevronDownIcon width={14} height={14} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-[280px] rounded-xl border border-border bg-surface-elevated p-2.5 shadow-lg">
          <div className="mb-2 text-xs font-medium text-text-muted">
            Pick a variation{locks.geometry || locks.composition || locks.texture ? ' (respecting locks)' : ''}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {variations.map((v, i) => (
              <VariationThumb key={i} generatorId={generatorId} variation={v} palette={palette} onClick={() => pick(v)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function VariationThumb({
  generatorId,
  variation,
  palette,
  onClick,
}: {
  generatorId: string
  variation: Variation
  palette: { colors: string[]; background: string }
  onClick: () => void
}) {
  const generator = generatorRegistry.get(generatorId)!
  const markup = useMemo(() => {
    const design = generator.generate(variation.parameters, variation.seed, palette.colors)
    return renderDesignToSvgString(design, { includeMetadata: false, sizeMode: 'fill' })
  }, [generator, variation, palette])

  return (
    <button
      onClick={onClick}
      className="aspect-square overflow-hidden rounded-lg border border-border transition-transform hover:scale-105"
      style={{ background: palette.background }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
