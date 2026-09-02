import { Link } from 'react-router-dom'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useJsonLd } from '@/hooks/useStructuredData'
import { AdSlot } from '@/components/ads/AdSlot'

const FAQS = [
  {
    q: 'What is parametric design?',
    a: 'Instead of drawing a shape directly, you define rules and numbers — a few parameters — and the shape is computed from them. Change a number, get a new design, instantly.',
  },
  {
    q: 'What is an SVG?',
    a: 'Scalable Vector Graphics — an image made of math (points, curves, shapes) instead of pixels. It stays crisp at any size and stays editable.',
  },
  {
    q: 'Why use SVG instead of PNG?',
    a: 'A PNG is a fixed grid of pixels. An SVG is a description you can resize, recolor, and edit — in code, or in a tool like Figma — without any quality loss.',
  },
  {
    q: 'How do I use a generated SVG in Figma?',
    a: 'Click "Copy to Figma" in the playground, then paste (⌘V / Ctrl+V) directly onto a Figma canvas. It arrives as real, editable vector layers.',
  },
  {
    q: 'What is a design seed?',
    a: 'A number that determines every "random" choice a generator makes. The same generator, parameters, and seed always reproduce the exact same design — that\'s what makes designs saveable and shareable.',
  },
]

export function About() {
  useDocumentMeta(
    'About & FAQ — Unruly',
    'What is parametric design? What is an SVG, and why use it over PNG? How do design seeds work, and how do you get a generated design into Figma?',
  )
  // FAQPage structured data (schema.org) so search engines can surface these Q&As directly in results.
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  })

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-text">About &amp; FAQ</h1>
      <p className="mt-3 text-text-muted">
        This is a playground for parametric vector design — generate, explore, evolve, and compose SVG designs, then take them straight
        into your real design workflow. It's completely free, supported by advertising, with no paywalls or locked features.
      </p>
      <div className="mt-10 space-y-6">
        {FAQS.map((f) => (
          <div key={f.q}>
            <h2 className="font-medium text-text">{f.q}</h2>
            <p className="mt-1.5 text-sm text-text-muted">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-surface-elevated p-5">
        <h2 className="font-medium text-text">Want the longer version?</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          The <Link to="/guides" className="text-accent-text hover:underline">Guides</Link> section covers each of these in more depth,
          plus how-tos for specific workflows.
        </p>
      </div>

      <div className="mt-10">
        <AdSlot variant="inline" placement="about-bottom" />
      </div>
    </div>
  )
}
