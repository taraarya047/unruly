# Ad System

The product is 100% free and ad-supported. No paywalls, credits, or locked functionality — see product spec
§35-41. This document covers the `AdSlot` component contract; real ad network integration is Phase 7.

## Component

```tsx
<AdSlot variant="leaderboard" placement="editor-bottom" />
```

`variant`: `leaderboard | rectangle | mobile | inline | sidebar` — maps to a fixed reserved size so ads never
cause layout shift (CLS) once a real ad fills the slot.

`placement`: a semantic id (`home-hero-bottom`, `explore-midgallery`, `editor-bottom`, `compose-bottom`, ...)
used for future measurement, not styling.

## Rules enforced by placement, not convention

- Never rendered inside `DesignCanvas` or the composition canvas.
- Never rendered between a control and its label, or directly beside Randomize/Evolve/Export actions.
- Always visually separated from product content (border/spacing, "Advertisement" label).
- Reserves layout space even in the placeholder (dev) state, so integrating a real network later doesn't
  shift anything.
- The app's core creative functionality never checks whether an ad loaded — everything works with ad
  blockers on.

## Placeholder state (current phase)

Renders a subtle bordered block with a centered "Advertisement" label sized to the variant's reserved
dimensions. No network calls yet.
