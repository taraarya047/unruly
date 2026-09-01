# Architecture

## Stack
- Vite + React 19 + TypeScript
- Tailwind CSS v4 (design tokens via CSS custom properties, theme-aware)
- react-router-dom (client-side routing, no backend required)
- zustand (state management, small and unopinionated)
- Native SVG rendering — no canvas/WebGL for the generated artwork itself

## Layering

```
engine/        Framework-independent generative core. No React imports.
  prng.ts        Deterministic seeded PRNG (mulberry32) + helpers
  types.ts        GeneratorDefinition, GeneratedDesign, SVGLayer, ShapePrimitive, params
  shapes.ts        Primitive -> SVG element serialization helpers
  registry.ts      Generator registry (id -> GeneratorDefinition)
  mutate.ts        Semantic "make it..." mutation engine
  evolve.ts        Design evolution / variation tree helpers
  composeLayers.ts Merges a generator's raw layers with the synthetic Background layer, user
                   visibility/lock/opacity overrides, custom stacking order, and duplicated layers
  math/          Shared generative-math utilities used across multiple generators (Delaunay/Voronoi,
                 marching squares, L-systems, chaotic attractors, isometric projection, noise) — see
                 GENERATOR_SYSTEM.md for the full list
  easing.ts      Cubic-bezier keyframe/easing math for the animation timeline — no React, pure functions

generators/     52 individual GeneratorDefinition implementations (dotField, grid, voronoiWorlds, ...)

palette/        Palette engine: built-in presets (Pride and Trans Pride always pinned first — see
                PINNED_PALETTE_IDS), harmony generation, palette <-> design binding

composition/    Poster/hero/social composition engine: canvas + layout presets, fit/clip/focal transform math,
                text-safe-zone + text-layer rendering — all pure functions, no React (mirrors engine/)

state/          zustand stores: design (generator+params+seed+palette+history), composition, theme, saved designs

components/     React UI, organized by domain (layout, ui, canvas, generator, controls, compose, ads)

pages/          Route-level screens (Home, Playground, Compose, Explore, Saved, About)
```

The **engine** layer never imports React. `GeneratorDefinition.generate(parameters, seed)` is a pure function
that returns a `GeneratedDesign` (a tree of `SVGLayer`s made of `ShapePrimitive`s). React components only
consume this data to render `<svg>` — they never generate design data with side effects like `Math.random()`.

## Determinism

Every design is fully reproducible from `{ generatorId, parameters, seed, paletteId }`. All randomness inside
a generator must be pulled from the seeded PRNG passed into `generate()`. This is what makes Randomize / Evolve /
Lock subsystems / Undo-Redo / Saved designs / shareable URLs (`state/shareLink.ts` base64url-encodes this
exact tuple into `?d=`) all work without a backend.

## State

`useDesignStore` (zustand) holds the current design state and a bounded history stack for undo/redo. Mutating
actions (`setParameter`, `randomize`, `evolve`, `setPalette`, `setGenerator`) push a history entry. We store
`{ generatorId, parameters, seed, paletteId | palette }` — not the rendered SVG — and derive `GeneratedDesign`
via a memoized selector. This keeps history cheap (Rule 4 in the product spec).

## Rendering

`DesignCanvas` walks `GeneratedDesign.layers` and renders semantic `<g id="...">` groups of primitives to real
SVG elements. This same renderer is reused for: the editor canvas, generator thumbnails, the explore gallery,
and SVG export — one code path, several call sites, so wysiwyg is guaranteed by construction.

## Layers

`useCurrentDesign()` (the hook Playground/Compose/export all consume) runs the generator's raw output through
`composeLayers()` before returning it: a synthetic `background` layer is prepended (so background color is
real, editable, exportable content — not a separate CSS/SVG-option hack), then per-layer overrides
(visible/locked/opacity) from `useDesignStore`, a custom stacking order, and any user-duplicated layers are
applied. The Layer Panel edits `useDesignStore`'s `layers: LayerState`, which is part of `DesignSnapshot` —
layer edits are undoable and saveable exactly like parameter or palette changes.

## Ads

`AdSlot` is a layout-reserving placeholder component (Phase 7 wires real ad delivery). It never mounts inside
the canvas or between a control and its label. See `AD_SYSTEM.md`.

## Composition

`Compose` treats the currently-generated design as a single motif and places it into a target canvas
(poster/web/social/presentation/custom) via one unified transform: `fitMode` (cover/contain) picks a base
scale, an optional `margin` shrinks the fit area (used by Framed), `focalX/focalY` position it like CSS
`object-position`, and a `clipShape` (rect/circle/half) is applied via an SVG `<clipPath>`. All 8 layout
presets (Centered, Full bleed, Corner, Diagonal, Radial, Framed, Split, Asymmetric) are just different values
for this one set of parameters — no per-layout rendering code. See `composition/types.ts` and
`composition/render.ts`.

Text-safe zones reserve a region (left/right/center/top/bottom) of the canvas; when a text layer is enabled,
that region gets a translucent scrim (in the background color, for legibility) plus real `<text>` elements —
this keeps text readable and genuinely editable when pasted into Figma, but it does not yet feed back into the
generator to literally thin out the pattern under the text (that would require generators to accept a density
mask, noted as a future improvement rather than implemented now).

## Palettes

`PALETTE_PRESETS` (`palette/presets.ts`) is the built-in list, read-only in the UI. Pride and Trans Pride are
defined first in that array and are never reordered, edited, or deleted — `PINNED_PALETTE_IDS` marks them so
the Palette Manager can enforce it. User-created palettes live separately in `useCustomPaletteStore`
(localStorage, same shape/pattern as `useSavedStore`). `palette/allPalettes.ts` merges the two
(`useAllPalettes()` for components, `getAllPalettes()` for non-reactive use in store actions like
`randomizeNew`) so custom palettes are just as eligible for randomization as built-ins, while always sorting
after them. The Palette Manager (`components/controls/PaletteManagerModal.tsx`) is the only place that
mutates `useCustomPaletteStore` — create, edit, delete, reorder — built-ins render there too but read-only.

## Keyframe animation timeline

`state/useAnimationStore.ts` holds keyframe tracks scoped per generator (`tracks[generatorId][paramKey]`),
a duration, a playhead (`currentTime`), and play/loop state — entirely separate from `useDesignStore` and
its undo history, since scrubbing/playback is a render-time preview, not an edit. `engine/easing.ts` is the
pure math: cubic-bezier evaluation (matching CSS `cubic-bezier()` semantics, solved via Newton-Raphson) and
`evaluateTrack()`, which interpolates a track's value at a given time using the easing on the *incoming*
segment. `hooks/useAnimatedParameters.ts` overrides the current generator's numeric parameters with their
interpolated values and feeds the result into `useCurrentDesign()` — so playback/scrubbing flows through the
exact same generate → composeLayers → mergeGeneratorLayers pipeline as any other parameter change, just
without ever writing back into `useDesignStore`. `hooks/usePlaybackLoop.ts` is the `requestAnimationFrame`
driver. Only `number`/`angle`-typed parameters are animatable; stacked generator layers (`generatorLayers`)
aren't in this iteration, since their own parameter sets aren't surfaced in the timeline UI.

The Playground's layout has one hazard worth calling out: `pages/Playground.tsx` and `pages/Compose.tsx`'s
outer wrapper sets an explicit `md:h-[calc(100vh-4rem)]` so the whole editor is clamped to the viewport
(everything below scrolls internally instead of pushing the canvas off-screen) — but that wrapper is also
`flex-1`. `flex-1` sets `flex-basis:0%`, and once flex-basis is non-auto the flex algorithm ignores the
`height` property entirely for sizing, so the explicit height silently does nothing and the page grows to
fit its content instead (invisible until something — like the timeline panel — finally pushes total content
past the viewport). The fix is `md:flex-none` alongside the explicit height, so `height` becomes the basis
again. Every fixed-height panel this size (asides, `TimelinePanel`) additionally needs `min-h-0`/`shrink-0`
in the right places for the same underlying reason: flex items default to `min-height: auto`, which fights
a `height`/`overflow` constraint the same way.

## Extensibility

Adding a generator = adding one file that exports a `GeneratorDefinition` and registering it in
`generators/index.ts`. No editor/UI code changes are needed — parameter controls are rendered generically from
`GeneratorDefinition.parameterSchema`.
