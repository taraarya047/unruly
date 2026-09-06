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
  Sculpture, Curl Noise, and River Network, each of which only needs to supply a different
  `(x,y) => {vx,vy}` function.
- `glyphs.ts` — a shared abstract letterform grammar: `buildGlyph` composes a small random set of typed
  strokes (straight lines and arcs — no font, no text rendering), and `placeGlyph` positions/scales/rotates
  one at a target point, with a `mirrorX` option that reflects in local space before rotation (negating
  `scale` instead produces a 180° point-reflection, not a left-right mirror — a bug caught before ever
  running the code). Shared by Parametric Letterform, Glyph Field, Generative Monogram, and Procedural
  Type Tunnel.

## Generators (101)

**Geometric**: Dot Field, Grid, Circles, Polygon Field, Checker/Tile, Hex Grid.
**Lines**: Waves, Concentric Lines, Flow Lines, Spiral.
**Organic**: Blobs, Mandala, Metaballs, L-System Forest, Liquid Swirl, Paper Cut, Chaos Garden, Fractal Bloom,
Barnsley Fern, Fractal Tree Sculpture, Particle Aggregation, Crystal Growth, Lightning Network,
River Network, Organic Vein Network, Reaction Diffusion, Crystalline Cellular System.
**Experimental**: Confetti, Halftone, Displacement Map.
**Fields**: Force Field, Magnetic Lines, Gravity Well, Vortex Field, Double Vortex, Flow Field Sculpture,
Curl Noise, Universal Field Sculptor.
**Particles**: Particle Constellation, Spiral Galaxy, Particle Collision.
**Topology**: Voronoi Worlds.
**Tessellation**: Tile Morpher, Penrose Tiling, Ammann–Beenker Tiling, Hexagonal Tessellation, Triaxial
Tessellation, Generative Mosaic Sculpture.
**Mathematical**: Delaunay Mesh, String Art, Lorenz Trails, Strange Attractor, Spiral Shell, Orbital System,
Radial Mandala, Geometric Flower, Radiating Sun, Mandelbrot Landscape, Julia Orbits, Koch Coastline,
Sierpinski Architecture, Pascal Mosaic, Prime Field, Phyllotaxis, Fibonacci Spiral, Cellular Automata,
Turing Patterns.
**Optical**: Kaleidoscope, Impossible Stairs, Moiré, Op Art, Spatial Warp Grid, Polar Distortion,
Spherical Projection, Mirror Maze, Hyperbolic Grid, Impossible Lattice.
**Texture**: Topographic Map, Height Field, Weaving, Pixel Mosaic, Glitch Grid, Vector Field Topography,
Cracked Earth, Circuit Board.
**Playful**: Chaos Garden, Doodle Field.
**Architectural**: Isometric City, Abstract Floorplan, Isometric Terrain, Isometric Machinery,
Procedural Blueprint, Fractal Window.
**Illustrative**: Stained Glass, Paper Cut, Ribbon Sculpture, Ink Splash, Magnetic Typography Field,
Circuit Organism, Parametric Letterform, Glyph Field, Generative Monogram, Procedural Type Tunnel.

(Some generators carry more than one category tag; the list above groups by primary category, matching the
generator library sidebar.) Two spec-requested concepts — Halftone and Confetti Party — already matched
existing generators (Halftone, Confetti) closely enough that adding near-duplicates would have violated the
spec's own "if indistinguishable, combine" guidance; they're the same generators, not new ones. A third —
"Neural Network" (nodes connected within a radius) — was skipped in Phase 4 for the same reason: Particle
Constellation's own description already reads "a star map or neural web," so a separate generator would
have been a near-exact reskin.

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
(unconstrained) noise-driven direction.

**Phase 4** (simulation/growth — Particle Collision through Turing Patterns above) is organized around
three genuinely distinct growth paradigms rather than one recursive rule reused nine times: Particle
Aggregation is real diffusion-limited aggregation (particles random-walk in from a boundary and freeze on
contact — the spawn ring has to expand as the cluster grows, or particles start spawning inside the
existing structure and stick immediately, producing a tight ball instead of branching); Crystal Growth is
direct recursive branching constrained to lattice-angle turns with collision-based halting (distinct from
both DLA's random-walk process and Fractal Tree Sculpture's smooth taper/gravity/wind); Organic Vein
Network is space colonization (Runions et al.) — branches grow toward a field of attraction points that
get consumed on contact, an emergent-from-data-layout paradigm unrelated to any recursive rule. River
Network reuses the streamline tracer from Phase 3, but follows a height field's downhill gradient rather
than an arbitrary vector field — its raw gradient magnitude is tiny relative to the meander-jitter term
(a real bug caught in QA), so the gradient is normalized to a unit direction before jitter is blended in,
or the jitter completely swamps the terrain-following signal. Turing Patterns is a fast, one-shot spectral
approximation (summed plane waves at one shared wavelength, thresholded into contours) — a real
Gray-Scott reaction-diffusion PDE simulation is reserved for a later Reaction Diffusion generator, since
the master spec asks for both as separate generators.

**Phase 5** (reaction/field systems — Reaction Diffusion through Circuit Organism above) delivers on that
Turing/Reaction-Diffusion distinction: Reaction Diffusion runs a genuine iterative Gray-Scott PDE
simulation (not the spectral approximation). It surfaced two real numerical/QA bugs worth noting for
future grid-simulation generators — the textbook-quoted Du=1/Dv=0.5 diffusion rates are unconditionally
unstable at dt=1 with a 5-point discrete Laplacian and blow up to NaN within dozens of steps (fixed with
the actual Pearson 1993 rates, Du=0.16/Dv=0.08), and different feed/kill presets settle at very different
characteristic concentrations, so a single fixed contour threshold that works for one preset can sit
entirely outside another's range and render blank (fixed the same way as Mandelbrot/Julia, by thresholding
within the field's own observed min/max) — the same fix was needed for Turing Patterns' user-facing
threshold slider, caught by strengthening the test harness to flag shapes whose path data is empty rather
than trusting a non-zero shape count. Crystalline Cellular System went through a similar debugging arc:
an initial diffusion-based vapor model reproducing Reiter's snowflake automaton either never grew past its
seed cell (no driving term) or avalanched to near-total fill within a couple of iterations once a
background gain term was added (positive feedback with no counterbalance) — replaced with a directly
controllable growth-front automaton where tip cells (few frozen neighbors) freeze far more readily than
infill cells (many frozen neighbors), which is easy to reason about and bounded by construction. Isometric
Terrain and Isometric Machinery reuse the existing `engine/math/isometric.ts` block-drawing primitive
Isometric City already established.

**Phase 6** (typographic/optical — Parametric Letterform through Universal Field Sculptor above), the sixth
and final phase, completes the 50-generator expansion. Its four "type" generators (Parametric Letterform,
Glyph Field, Generative Monogram, Procedural Type Tunnel) all build on one shared abstract letterform
grammar (`engine/math/glyphs.ts`) rather than four independent implementations — a real font-rendering
pipeline is out of scope for an SVG shape generator, so "typography" here means structurally letterform-like
strokes (arcs and lines composed the way pen strokes build a glyph), not literal characters. Generative
Monogram is the one deliberate adaptation from the master spec: it calls for building a monogram from
user-typed initials, but the parameter schema has no free-text type, so it substitutes seed-selected
abstract "characters" for literal input — same visual idea (2-3 overlapping stroke-glyphs), no text entry
behind it. Three optical-geometry generators avoid reskinning: Mirror Maze renders a real recursive-backtrack
maze (not a decorative pattern) reflected across its symmetry axes; Hyperbolic Grid applies a genuine
Poincaré-disk conformal mapping (`x,y ↦ x·tanh(r·k)/(r·k)`, ditto y) to a Euclidean grid, distinct from
Spatial Warp Grid's noise-driven point displacement; Impossible Lattice (deliberately renamed from the
spec's "Penrose-like Optical Space" to avoid confusion with the unrelated Penrose Tiling generator) tiles
Escher-style impossible tribars, a different illusion family from Impossible Stairs. Fractal Window is
straightforward recursive nested framing (square/arch/circle/polygon), included as a poster-friendly
centerpiece. Universal Field Sculptor is the phase's flagship: any two of six named vector fields
(none/radial/vortex/noise/wave/spiral) combine by direct vector summation, and the combined direction and
magnitude at each point drive a shape's position, rotation, size, and opacity together — nine presets cover
common combinations, and a "Custom" preset (added during QA — every preset option originally matched an
entry in the presets table, so the manual field/strength controls were permanently unreachable dead
controls) exposes the same mechanism directly.

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
