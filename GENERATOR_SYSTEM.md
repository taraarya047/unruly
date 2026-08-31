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

`ParameterSchema` entries declare `{ key, label, group ('shape'|'pattern'|'variation'|'composition'), type
('number'|'angle'|'select'|'boolean'), min, max, step, advanced }`. The control panel renders these generically —
no per-generator editor code. `advanced: true` params only show in Advanced Mode (§16 of the spec).

## Determinism

`generate()` is pure. All randomness comes from the `createRng(seed)` PRNG passed by the caller — generators
never call `Math.random()` directly. This guarantees `{generatorId, parameters, seed}` always reproduces the
same `GeneratedDesign`.

## Shape primitives

Generators compose from a small primitive set (`engine/shapes.ts`): `circle, rect, polygon, star, line, path,
blob, arc, ring`. Each primitive serializes to real SVG so output stays editable vector, never rasterized.

## MVP generators (Phase 1 + 2)

Dot Field, Grid, Circles, Waves, Blobs, Polygon Field, Concentric Lines, Flow Lines, Checker/Tile, Confetti —
10 generators spanning geometric, organic, lines, and experimental categories, validating the architecture
before scaling toward 30-50 generators.

## Mutation & evolution

`engine/mutate.ts` implements semantic controls ("make it calmer/chaotic/denser...") as weighted parameter
deltas per generator category — deterministic, no AI. `engine/evolve.ts` derives 3-6 nearby variations from a
seed by nudging the RNG stream and/or parameters, for the Evolve / design-tree interaction.

## Controlled randomness (locks)

`state/useDesignStore.ts` maps each of the four locks (Geometry / Composition / Texture / Palette) to a set of
`ParamGroup`s (`engine/randomizeParams.ts` does the actual per-group reroll/nudge): Geometry owns `shape` (plus
the generator identity and seed), Composition owns `pattern` + `composition`, Texture owns `variation`, and
Palette owns `color` (plus the palette itself). "Surprise me" and "Evolve" reroll only the groups not covered
by an active lock; "Remix", "Recolor", and "Distort" are direct single-purpose actions that always act on their
target regardless of locks.
