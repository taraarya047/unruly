# Generator System

## Contract

```ts
interface GeneratorDefinition {
  id: string
  name: string
  category: GeneratorCategory
  description: string
  defaultParameters: GeneratorParameters
  parameterSchema: ParameterSchema[]     // drives generic control rendering
  generate(parameters: GeneratorParameters, seed: number): GeneratedDesign
  capabilities: {
    supportsColor: boolean
    supportsRotation: boolean
    supportsDensity: boolean
    supportsLayers: boolean
  }
}
```

`ParameterSchema` entries declare `{ key, label, group ('shape'|'pattern'|'variation'|'composition'|'color'), type
('number'|'angle'|'select'|'boolean'), min, max, step, advanced, semantic }`. The control panel renders these
generically — no per-generator editor code. `advanced: true` params only show in Advanced Mode (§16 of the
spec). `tags?: string[]` is optional free-form metadata for the generator-library search box.

This is also why locks, Evolve, "Make it..." mutation, and undo/redo all worked immediately for all 38
generators added in the 40-generator expansion with zero per-generator code: those systems only ever read
`parameterSchema`, never a generator's `id`.

## Determinism

`generate()` is pure. All randomness comes from the `createRng(seed)` PRNG passed by the caller — generators
never call `Math.random()` directly. This guarantees `{generatorId, parameters, seed}` always reproduces the
same `GeneratedDesign`.

## Shape primitives

Generators compose from a small primitive set (`engine/shapes.ts`): `circle, rect, polygon, star, line, path,
blob, arc, ring`. Each primitive serializes to real SVG so output stays editable vector, never rasterized.

## Shared math (`engine/math/`)

Extracted once several generators needed the same non-trivial algorithm, rather than reimplemented per file:

- `points.ts` — seeded random/jittered-grid point distributions
- `noise.ts` — cheap seeded value-noise field + a multi-well height field for terrain-like generators
- `delaunay.ts` — Bowyer-Watson Delaunay triangulation
- `voronoi.ts` — Voronoi cells via half-plane intersection (independent of the Delaunay dual, for robustness)
- `marchingSquares.ts` — scalar-field contour extraction; `sampleGrid`/`marchingSquaresFromGrid` split the
  (expensive) field sampling from the (cheap) per-threshold contour pass so a many-contour generator samples
  the field once, not once per contour — see Topographic Map. `gridValueRange` returns the sampled field's
  actual min/max, which Mandelbrot Landscape and Julia Orbits use to place contour thresholds strictly
  within the field's observed range — a fixed guess can miss escape-time fields entirely at extreme
  zoom/iteration combinations, rendering nothing.
- `lsystem.ts` — L-system string rewriting + turtle-graphics interpreter, with presets (tree/fern/coral/...)
- `attractors.ts` — Lorenz/Clifford/De Jong chaotic systems
- `isometric.ts` — isometric axis vectors + a shaded 3-face box primitive (Isometric City, Impossible Stairs)
- `complexEscape.ts` — shared z² + c escape-time iteration for Mandelbrot Landscape (c varies per pixel,
  z0 = 0) and Julia Orbits (c fixed, z0 varies per pixel) — the two fractals differ only in which value is
  swept across the plane, so the math lives in exactly one place.
- `multigrid.ts` — De Bruijn's N-line multigrid dualization, the algebraic (non-recursive) method for
  building N-fold quasiperiodic rhombus tilings: Penrose (N=5) and Ammann–Beenker (N=4) are the same
  function with a different N, not different code.
- `streamlines.ts` — traces one streamline through a velocity field by forward Euler integration at a
  fixed step length in the field's local direction; shared by Vortex Field, Double Vortex, Flow Field
  Sculpture, and Curl Noise, each of which only needs to supply a different `(x,y) => {vx,vy}` function.

## Generators (72)

**Geometric**: Dot Field, Grid, Circles, Polygon Field, Checker/Tile, Hex Grid.
**Lines**: Waves, Concentric Lines, Flow Lines, Spiral.
**Organic**: Blobs, Mandala, Metaballs, L-System Forest, Liquid Swirl, Paper Cut, Chaos Garden, Fractal Bloom,
Barnsley Fern, Fractal Tree Sculpture.
**Experimental**: Confetti, Halftone.
**Fields**: Force Field, Magnetic Lines, Gravity Well, Vortex Field, Double Vortex, Flow Field Sculpture,
Curl Noise.
**Particles**: Particle Constellation, Spiral Galaxy.
**Topology**: Voronoi Worlds.
**Tessellation**: Tile Morpher, Penrose Tiling, Ammann–Beenker Tiling, Hexagonal Tessellation, Triaxial
Tessellation.
**Mathematical**: Delaunay Mesh, String Art, Lorenz Trails, Strange Attractor, Spiral Shell, Orbital System,
Radial Mandala, Geometric Flower, Radiating Sun, Mandelbrot Landscape, Julia Orbits, Koch Coastline,
Sierpinski Architecture, Pascal Mosaic, Prime Field, Phyllotaxis, Fibonacci Spiral.
**Optical**: Kaleidoscope, Impossible Stairs, Moiré, Op Art, Spatial Warp Grid.
**Texture**: Topographic Map, Height Field, Weaving, Pixel Mosaic, Glitch Grid, Vector Field Topography.
**Playful**: Chaos Garden, Doodle Field.
**Architectural**: Isometric City, Abstract Floorplan.
**Illustrative**: Stained Glass, Paper Cut, Ribbon Sculpture, Ink Splash, Magnetic Typography Field.

(Some generators carry more than one category tag; the list above groups by primary category, matching the
generator library sidebar.) Two spec-requested concepts — Halftone and Confetti Party — already matched
existing generators (Halftone, Confetti) closely enough that adding near-duplicates would have violated the
spec's own "if indistinguishable, combine" guidance; they're the same generators, not new ones.

**Phase 2 of the advanced-generator expansion** (fractals/mathematics — Mandelbrot Landscape through
Fibonacci Spiral above) deliberately uses a different technique per generator even where two look
superficially similar to an existing one: Fractal Tree Sculpture is direct recursive branch-drawing
(taper/gravity/wind computed per segment), genuinely distinct from L-System Forest's grammar rewriting +
turtle interpretation; Barnsley Fern is an iterated function system (four affine maps, weighted-random
selection), unrelated to either.

**Phase 3** (tiling/geometry — Penrose Tiling through Vector Field Topography above) similarly avoids
reskinning what already existed: Vortex Field is a pure rotational field (streamlines circulate forever,
no source or sink), unlike Gravity Well's radial-attraction-plus-spiral or Magnetic Lines' dipole field
lines that terminate at the poles; Hexagonal Tessellation warps every cell coherently through a shared
noise field (with missing cells and a separate growth field) rather than Hex Grid's per-cell independent
scale jitter; Curl Noise is specifically the curl of a potential field (guaranteed divergence-free, no
flow ever converges or diverges anywhere) rather than Force Field's or Flow Field Sculpture's direct
(unconstrained) noise-driven direction. The remaining phases (simulation/growth, reaction/field systems,
typographic/optical — see ROADMAP.md) are intentionally not implemented yet, per the expansion plan's own
instruction not to add all 50 generators in one uncontrolled pass.

## Mutation & evolution

`engine/mutate.ts` implements semantic controls ("make it calmer/chaotic/denser...") as weighted parameter
deltas per generator category — deterministic, no AI. `engine/evolve.ts` derives 3-6 nearby variations from a
seed by nudging the RNG stream and/or parameters, for the Evolve / design-tree interaction.

## Controlled randomness (locks)

`state/useDesignStore.ts` maps each of the four locks (Geometry / Composition / Texture / Palette) to a set of
`ParamGroup`s (`engine/randomizeParams.ts` does the actual per-group reroll/nudge): Geometry owns `shape` (plus
the generator identity and seed), Composition owns `pattern` + `composition`, Texture owns `variation`, and
Palette owns `color` (plus the palette itself). "Shuffle" and "Evolve" reroll only the groups not covered
by an active lock; "Remix", "Recolor", "Distort", and "Surprise me" are direct single-purpose actions that
always act on their target regardless of locks.

## Stacked generator layers

A design isn't limited to one generator: `state/useDesignStore.ts` holds an optional `generatorLayers:
GeneratorLayerConfig[]` array — each entry its own `{ generatorId, parameters, seed, opacity, blendMode,
visible }`, composited on top of the base design via CSS `mix-blend-mode` (`BLEND_MODES` in `engine/types.ts`)
with `isolation:isolate` so a layer's own shapes composite normally before blending, once, against whatever is
stacked beneath it. `engine/composeGeneratorLayers.ts` runs each layer's generator and flattens its output into
a single `SVGLayer`; `useCurrentDesign` appends these after the base's own `composeLayers()` pass, so the
existing single-render-path renderer (`renderDesignInner`) needed only a `blendMode` field on `SVGLayer`, not a
parallel rendering path. The pre-existing per-generator "Shape layers" panel (`components/layers/LayerPanel.tsx`)
explicitly excludes these merged layers — their opacity/visibility live in `generatorLayers`, not in
`layers.overrides`, so a control bound to the wrong id would silently do nothing.

"Shuffle" (formerly "Surprise me") rerolls the base design and every stacked layer's generator/params/seed
independently — one reroll pass per layer, respecting locks the same way the base always has — without
touching the stack itself (layer count, opacity, blend mode). "Surprise me" (the new mode) is the inverse: a
direct action, like Remix, that rebuilds the whole stack from scratch — how many layers, which generators, and
(when the "Chaos blending" toggle is on) wildly randomized opacity/blend mode per layer rather than the tasteful
default range.
