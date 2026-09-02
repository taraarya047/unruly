import type { ReactNode } from 'react'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export function Terms() {
  useDocumentMeta('Terms of Service — Unruly', 'Terms for using Unruly: a free, ad-supported parametric design playground.')

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Terms of Service</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated 2026.</p>

      <div className="mt-8 space-y-6 text-text-muted">
        <Section title="The service">
          <p>
            Unruly is a free, browser-based tool for generating and exporting vector (SVG) designs. It's provided as-is, with no
            uptime guarantee, and is supported by advertising rather than payment — there are no paid tiers or locked features.
          </p>
        </Section>
        <Section title="What you create">
          <p>
            Designs you generate and export are yours to use. Unruly doesn't claim ownership over anything you make, and doesn't
            store a copy of your designs on any server — only your own browser (and anyone you send a shareable link to) has access
            to them.
          </p>
        </Section>
        <Section title="Acceptable use">
          <p>
            Don't use Unruly to generate content that infringes others' rights, or attempt to disrupt the service (excessive
            automated requests, attempts to bypass ad delivery for others, etc.).
          </p>
        </Section>
        <Section title="No warranty">
          <p>
            The service is provided without warranties of any kind. Generated designs, exports, and Figma handoffs are provided
            as-is; you're responsible for verifying anything you use in production work.
          </p>
        </Section>
        <Section title="Changes">
          <p>These terms may change as the product changes. Continued use after an update means you accept the current terms.</p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-medium text-text">{title}</h2>
      <div className="mt-1.5 space-y-2 text-sm">{children}</div>
    </div>
  )
}
