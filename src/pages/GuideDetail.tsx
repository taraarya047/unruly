import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getGuide, GUIDES } from '@/content/guides'
import { generatorRegistry } from '@/engine/registry'
import { useDesignStore } from '@/state/useDesignStore'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useJsonLd } from '@/hooks/useStructuredData'
import { GeneratorThumbnail } from '@/components/generator/GeneratorThumbnail'
import { AdSlot } from '@/components/ads/AdSlot'
import { Button } from '@/components/ui/Button'
import { SparkleIcon } from '@/components/ui/icons'

export function GuideDetail() {
  const { slug = '' } = useParams()
  const guide = getGuide(slug)
  const navigate = useNavigate()
  const setGenerator = useDesignStore((s) => s.setGenerator)

  // Hooks must run unconditionally (before the not-found redirect below), so fall back to the index
  // page's own title/description when the slug doesn't match any guide.
  useDocumentMeta(guide?.seoTitle ?? 'Guides — Unruly', guide?.description ?? 'Guides and how-tos for parametric and vector design.')
  useJsonLd(
    guide
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: guide.description,
          author: { '@type': 'Organization', name: 'Unruly' },
        }
      : { '@context': 'https://schema.org', '@type': 'WebPage' },
  )

  if (!guide) return <Navigate to="/guides" replace />

  const generator = generatorRegistry.get(guide.heroGeneratorId)
  const related = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3)

  const openInPlayground = () => {
    setGenerator(guide.heroGeneratorId)
    navigate('/playground')
  }

  return (
    <div className="flex-1">
      <article className="mx-auto w-full max-w-2xl px-5 py-14">
        <Link to="/guides" className="text-sm font-medium text-text-muted hover:text-text">
          &larr; All guides
        </Link>

        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-text md:text-4xl">{guide.title}</h1>
        <p className="mt-2 text-lg text-text-muted">{guide.tagline}</p>

        {generator && (
          <GeneratorThumbnail
            generator={generator}
            seed={guide.heroSeed}
            colors={guide.heroPalette}
            background={guide.heroBackground}
            className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border"
          />
        )}

        <div className="mt-8 space-y-4 text-text-muted">
          {guide.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="my-10">
          <AdSlot variant="inline" placement={`guide-${guide.slug}-mid`} />
        </div>

        <div className="space-y-10">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold tracking-tight text-text">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-text-muted">
                {section.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-surface-elevated p-6 text-center">
          <p className="text-sm text-text-muted">Ready to try it?</p>
          <Button variant="primary" size="lg" className="mt-3" icon={<SparkleIcon width={18} height={18} />} onClick={openInPlayground}>
            {guide.ctaLabel}
          </Button>
        </div>

        <div className="mt-12">
          <AdSlot variant="leaderboard" placement={`guide-${guide.slug}-bottom`} />
        </div>

        {related.length > 0 && (
          <div className="mt-14 border-t border-border pt-8">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">More guides</div>
            <ul className="space-y-2">
              {related.map((g) => (
                <li key={g.slug}>
                  <Link to={`/guides/${g.slug}`} className="text-sm font-medium text-text hover:text-accent-text">
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  )
}
