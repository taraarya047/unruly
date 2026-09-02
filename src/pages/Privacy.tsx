import type { ReactNode } from 'react'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export function Privacy() {
  useDocumentMeta('Privacy Policy — Unruly', 'How Unruly handles data: no accounts, no server-side storage, local-only saves, and ad-supported measurement.')

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-text">Privacy Policy</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated 2026.</p>

      <div className="mt-8 space-y-6 text-text-muted">
        <Section title="No accounts, no server">
          <p>
            Unruly runs entirely in your browser. There is no login, no user database, and no backend server that your designs pass
            through — every design is generated, edited, and rendered locally on your device.
          </p>
        </Section>
        <Section title="What's stored, and where">
          <p>
            Saved designs, custom palettes, and preferences (like theme) are stored in your browser's local storage — never sent
            anywhere. Clearing your browser's site data for this domain removes them permanently; we have no copy to restore from.
          </p>
        </Section>
        <Section title="Shareable links">
          <p>
            "Copy shareable link" encodes the design itself (generator, parameters, seed, palette) into the URL. Anyone with that link
            can reopen the exact design — treat it like you would any link containing content you made.
          </p>
        </Section>
        <Section title="Advertising">
          <p>
            Unruly is free and ad-supported. Ad slots are reserved, fixed-size placements (see our ad system) that may load
            third-party ad content; a future ad network integration may use standard, industry-typical measurement (viewability,
            impressions) to serve and report on ads. Unruly's own local analytics (session length, feature usage) never leaves your
            browser today — there is no backend to send it to.
          </p>
        </Section>
        <Section title="Changes">
          <p>This policy may be updated as the product changes. Material changes will be reflected on this page.</p>
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
