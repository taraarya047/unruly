# Ad System

The product is 100% free and ad-supported. No paywalls, credits, or locked functionality — see product spec
§35-41. This document covers the `AdSlot` component contract and the measurement layer around it. Real ad
network integration (an actual SDK, real inventory, real accounts) is the one piece of Phase 7 this
environment can't do — everything else the spec asked for (the slot's loading/failure lifecycle, and
viewability/layout-shift/session/export/generator measurement) is implemented and real.

## Component

```tsx
<AdSlot variant="leaderboard" placement="editor-bottom" />
```

`variant`: `leaderboard | rectangle | mobile | inline | sidebar` — maps to a fixed reserved size so ads never
cause layout shift (CLS), in any state (loading/filled/failed).

`placement`: a semantic id (`home-hero-bottom`, `explore-midgallery`, `editor-bottom`, `compose-bottom`, ...)
used by the measurement layer below, not styling.

## Rules enforced by placement, not convention

- Never rendered inside `DesignCanvas` or the composition canvas.
- Never rendered between a control and its label, or directly beside Randomize/Evolve/Export actions.
- Always visually separated from product content (border/spacing, "Advertisement" label).
- Reserves the same layout space across every state, so integrating a real network later doesn't shift
  anything.
- The app's core creative functionality never checks whether an ad loaded — everything works with ad
  blockers on.

## Loading / filled / failed

`AdSlot` is a real three-state component now, not a static placeholder: it starts `loading` (a pulsing
skeleton), then resolves to `filled` (the "Advertisement" label) or `failed` (the reserved space stays,
intentionally empty — no broken-ad visual, no layout shift). `loadAdStub()` in `components/ads/AdSlot.tsx`
is the one function a real integration replaces — it currently simulates realistic network latency and a
small random fill failure specifically so the failed state is a real, exercised code path today rather than
untested dead code. Swapping in a real ad SDK means replacing `loadAdStub` with that SDK's load call and
keeping the same three-state contract; nothing else in the app needs to change.

## Measurement (`state/useAnalyticsStore.ts`)

No backend exists, so this is a local-only measurement layer — a capped in-memory event log (`track(name,
data)`), inspectable during dev via `window.__analytics()`. Every metric the spec asked for is a real
measurement, not simulated data:

- **Ad viewability** — `hooks/useAdViewability.ts` uses a real `IntersectionObserver` against the IAB
  standard (>=50% of the slot's area visible for >=1 continuous second) and only starts watching once the
  slot has actually resolved to `filled`.
- **Layout shift** — `hooks/useAnalyticsInit.ts` runs a page-wide `PerformanceObserver` for `layout-shift`
  entries (the real Layout Instability API, the same one Lighthouse/CrUX use for CLS) and reports the
  cumulative score on `session_end`.
- **Session duration** — tracked from mount to `beforeunload`/tab-hidden, in `useAnalyticsInit`.
- **Export conversion** — every `ExportMenu` action (Copy to Figma, Copy SVG, Download SVG/PNG/WebP) fires
  an `export` event with its format.
- **Generator usage** — picking a generator from `GeneratorLibrary` fires a `generator_selected` event with
  its id and category.

A real analytics sink (PostHog, GA4, an internal endpoint, ...) subscribes to the same `track()` call later
without touching any of the call sites above.
