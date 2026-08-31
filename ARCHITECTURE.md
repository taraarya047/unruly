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

generators/     Individual GeneratorDefinition implementations (dotField, grid, circles, waves, blobs, ...)

palette/        Palette engine: presets, harmony generation, palette <-> design binding

state/          zustand stores: design (generator+params+seed+palette+history), theme, saved designs

components/     React UI, organized by domain (layout, ui, canvas, generator, controls, ads, compose)

pages/          Route-level screens (Home, Playground, Explore, Saved, About)
```

The **engine** layer never imports React. `GeneratorDefinition.generate(parameters, seed)` is a pure function
that returns a `GeneratedDesign` (a tree of `SVGLayer`s made of `ShapePrimitive`s). React components only
consume this data to render `<svg>` — they never generate design data with side effects like `Math.random()`.

## Determinism

Every design is fully reproducible from `{ generatorId, parameters, seed, paletteId }`. All randomness inside
a generator must be pulled from the seeded PRNG passed into `generate()`. This is what makes Randomize / Evolve /
Lock subsystems / Undo-Redo / Saved designs / future shareable URLs all work without a backend.

## State

`useDesignStore` (zustand) holds the current design state and a bounded history stack for undo/redo. Mutating
actions (`setParameter`, `randomize`, `evolve`, `setPalette`, `setGenerator`) push a history entry. We store
`{ generatorId, parameters, seed, paletteId | palette }` — not the rendered SVG — and derive `GeneratedDesign`
via a memoized selector. This keeps history cheap (Rule 4 in the product spec).

## Rendering

`DesignCanvas` walks `GeneratedDesign.layers` and renders semantic `<g id="...">` groups of primitives to real
SVG elements. This same renderer is reused for: the editor canvas, generator thumbnails, the explore gallery,
and SVG export — one code path, several call sites, so wysiwyg is guaranteed by construction.

## Ads

`AdSlot` is a layout-reserving placeholder component (Phase 7 wires real ad delivery). It never mounts inside
the canvas or between a control and its label. See `AD_SYSTEM.md`.

## Extensibility

Adding a generator = adding one file that exports a `GeneratorDefinition` and registering it in
`generators/index.ts`. No editor/UI code changes are needed — parameter controls are rendered generically from
`GeneratorDefinition.parameterSchema`.
