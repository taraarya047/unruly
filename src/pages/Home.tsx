import { useNavigate } from 'react-router-dom'
import { generatorRegistry } from '@/engine/registry'
import { useDesignStore } from '@/state/useDesignStore'
import { Button } from '@/components/ui/Button'
import { HeroCanvas } from '@/components/home/HeroCanvas'
import { GeneratorCard } from '@/components/generator/GeneratorCard'
import { AdSlot } from '@/components/ads/AdSlot'
import { SparkleIcon } from '@/components/ui/icons'

const DISCOVERY_PROMPTS = [
  { label: 'Something geometric', category: 'geometric' as const },
  { label: 'Something organic', category: 'organic' as const },
  { label: 'A website hero', category: 'lines' as const },
  { label: 'Something colorful', category: 'geometric' as const },
]

export function Home() {
  const navigate = useNavigate()
  const setGenerator = useDesignStore((s) => s.setGenerator)
  const generators = generatorRegistry.all()

  const startWith = (category: string) => {
    const match = generatorRegistry.byCategory(category as never)[0] ?? generators[0]
    setGenerator(match.id)
    navigate('/playground')
  }

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 py-14 md:grid-cols-2 md:gap-14 md:py-24">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-text md:text-6xl">
            Make something <span className="text-accent">unexpected.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-text-muted">
            Play with shapes, patterns, color and randomness. Create editable vector designs and take them straight to Figma.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" icon={<SparkleIcon width={18} height={18} />} onClick={() => navigate('/playground')}>
              Start creating
            </Button>
            <Button size="lg" onClick={() => navigate('/explore')}>
              Explore designs
            </Button>
          </div>
          <div className="mt-10">
            <div className="mb-2.5 text-xs font-medium uppercase tracking-wider text-text-muted">What are you making?</div>
            <div className="flex flex-wrap gap-2">
              {DISCOVERY_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => startWith(p.category)}
                  className="rounded-full border border-border bg-surface-elevated px-3.5 py-1.5 text-sm font-medium text-text transition-colors hover:bg-control-bg"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <HeroCanvas />
      </section>

      <div className="mx-auto w-full max-w-6xl px-5">
        <AdSlot variant="leaderboard" placement="home-hero-bottom" />
      </div>

      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-text">Generators</h2>
            <p className="mt-1 text-sm text-text-muted">Small set of rules. Endless variation.</p>
          </div>
          <Button onClick={() => navigate('/playground')}>Open playground</Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {generators.map((g) => (
            <GeneratorCard
              key={g.id}
              generator={g}
              onClick={() => {
                setGenerator(g.id)
                navigate('/playground')
              }}
            />
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5 pb-16">
        <AdSlot variant="inline" placement="home-footer" />
      </div>
    </div>
  )
}
