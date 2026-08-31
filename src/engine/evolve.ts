import type { GeneratorDefinition, GeneratorParameters, ParamGroup } from './types'
import { createRng, randomSeed } from './prng'
import { nudgeParameters } from './randomizeParams'

export interface Variation {
  seed: number
  parameters: GeneratorParameters
}

const ALL_GROUPS: ParamGroup[] = ['shape', 'pattern', 'variation', 'composition', 'color']

/** Generates a handful of nearby variations for the design-evolution tree. */
export function generateVariations(
  generator: GeneratorDefinition,
  parameters: GeneratorParameters,
  count = 4,
  amount = 0.15,
  unlockedGroups: ReadonlySet<ParamGroup> = new Set(ALL_GROUPS),
): Variation[] {
  return Array.from({ length: count }, () => {
    const seed = randomSeed()
    const rng = createRng(seed)
    return { seed, parameters: nudgeParameters(generator.parameterSchema, parameters, unlockedGroups, rng, amount) }
  })
}
