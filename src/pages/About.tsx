import { useEffect } from 'react'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

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

/**
 * Injects FAQPage structured data (schema.org) so search engines can surface these Q&As directly in
 * results — Google's indexer executes JS, so a client-injected <script type="application/ld+json">
 * works here even though this is a client-only SPA with no SSR (unlike raw og: tags, which need to be
 * in the initial HTML for link-preview bots that don't run JS — see index.html for those).
 */
function useFaqStructuredData() {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])
}

export function About() {
  useDocumentMeta(
    'About & Guides — Unruly',
    'What is parametric design? What is an SVG, and why use it over PNG? How do design seeds work, and how do you get a generated design into Figma?',
  )
  useFaqStructuredData()

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-text">About &amp; Guides</h1>
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
    </div>
  )
}
