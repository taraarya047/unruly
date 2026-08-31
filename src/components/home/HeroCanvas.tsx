import { useEffect, useMemo, useState } from 'react'
import { generatorRegistry } from '@/engine/registry'
import { renderDesignToSvgString } from '@/engine/render'
import { generateVariations } from '@/engine/evolve'
import { randomSeed } from '@/engine/prng'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { PALETTE_PRESETS } from '@/palette/presets'

export function HeroCanvas() {
  const reducedMotion = useReducedMotion()
  const generator = generatorRegistry.get('blobs')!
  const [state, setState] = useState(() => ({ parameters: { ...generator.defaultParameters }, seed: randomSeed() }))
  const [palette, setPalette] = useState(PALETTE_PRESETS[4])

  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => {
      const [variation] = generateVariations(generator, state.parameters, 1, 0.12)
      setState(variation)
    }, 5000)
    return () => clearInterval(id)
  }, [generator, state.parameters, reducedMotion])

  const design = useMemo(() => generator.generate(state.parameters, state.seed, palette.colors), [generator, state, palette])
  const markup = useMemo(() => renderDesignToSvgString(design, { includeMetadata: false, sizeMode: 'fill' }), [design])

  const handleClick = () => {
    const [variation] = generateVariations(generator, state.parameters, 1, 0.3)
    setState(variation)
    setPalette((p) => {
      const others = PALETTE_PRESETS.filter((x) => x.id !== p.id)
      return others[Math.floor(Math.random() * others.length)]
    })
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label="Generative artwork preview. Activate to mutate it into a new variation."
      title="Click to mutate"
      className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-3xl border border-border text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_64px_-16px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:scale-[1.01]"
      style={{ background: palette.background }}
    >
      <div
        className="h-full w-full transition-opacity duration-700"
        role="img"
        aria-label="Abstract generative pattern made of soft blob shapes"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        Click to mutate
      </div>
    </button>
  )
}
