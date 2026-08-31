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

## MVP generators (Phase 1)

Dot Field, Grid, Circles, Waves, Blobs — chosen to cover geometric, organic, and line-based visual systems
with minimal shared code, to validate the architecture before scaling to 30-50 generators (Phase 2+).

## Mutation & evolution

`engine/mutate.ts` implements semantic controls ("make it calmer/chaotic/denser...") as weighted parameter
deltas per generator category — deterministic, no AI. `engine/evolve.ts` derives 3-6 nearby variations from a
seed by nudging the RNG stream and/or parameters, for the Evolve / design-tree interaction.
