import { Link } from 'react-router-dom'
import { GUIDES } from '@/content/guides'
import { generatorRegistry } from '@/engine/registry'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { GeneratorThumbnail } from '@/components/generator/GeneratorThumbnail'
import { AdSlot } from '@/components/ads/AdSlot'

export function Guides() {
  useDocumentMeta(
    'Guides — Unruly',
    'Guides and how-tos for parametric design, SVG, generative art, and getting vector designs into Figma.',
  )

  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-5 py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-text md:text-4xl">Guides</h1>
        <p className="mt-3 max-w-xl text-text-muted">
          What parametric design is, how SVG works, and how to get the most out of Unruly — from your first generated design to a
          finished Figma file.
        </p>
      </div>

      <div className="mx-auto w-full max-w-6xl px-5">
        <AdSlot variant="leaderboard" placement="guides-index-top" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((guide) => {
          const generator = generatorRegistry.get(guide.heroGeneratorId)
          return (
            <Link
              key={guide.slug}
              to={`/guides/${guide.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-colors hover:border-text-muted/50"
            >
              {generator && (
                <GeneratorThumbnail
                  generator={generator}
                  seed={guide.heroSeed}
                  colors={guide.heroPalette}
                  background={guide.heroBackground}
                  className="aspect-[16/10] w-full"
                />
              )}
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-medium text-text group-hover:text-accent-text">{guide.title}</h2>
                <p className="mt-1.5 flex-1 text-sm text-text-muted">{guide.description}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 pb-16">
        <AdSlot variant="inline" placement="guides-index-bottom" />
      </div>
    </div>
  )
}
