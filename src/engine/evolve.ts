import type { GeneratorDefinition, GeneratorParameters } from './types'
import { createRng, randomSeed } from './prng'

export interface Variation {
  seed: number
  parameters: GeneratorParameters
}

/** Nudge parameters by a small deterministic amount, staying close to the source design's identity. */
function nudgeParameters(generator: GeneratorDefinition, parameters: GeneratorParameters, seed: number, amount: number): GeneratorParameters {
  const rng = createRng(seed)
  const next: GeneratorParameters = { ...parameters }
  for (const schema of generator.parameterSchema) {
    if (schema.type !== 'number' && schema.type !== 'angle') continue
    if (!rng.bool(0.6)) continue
    const current = Number(next[schema.key])
    const range = schema.max - schema.min
    const nudged = current + rng.range(-amount, amount) * range
    next[schema.key] = Math.min(schema.max, Math.max(schema.min, nudged))
  }
  return next
}

/** Generates a handful of nearby variations for the design-evolution tree. */
export function generateVariations(
  generator: GeneratorDefinition,
  parameters: GeneratorParameters,
  count = 4,
  amount = 0.15,
): Variation[] {
  return Array.from({ length: count }, () => {
    const seed = randomSeed()
    return { seed, parameters: nudgeParameters(generator, parameters, seed, amount) }
  })
}
