import type { GeneratorParameters, ParameterSchema, ParamGroup } from './types'
import type { Rng } from './prng'

/** Assigns a fresh random value to each schema entry whose group is in `unlockedGroups`; keeps the rest untouched. */
export function randomizeParameters(
  schema: ParameterSchema[],
  current: GeneratorParameters,
  unlockedGroups: ReadonlySet<ParamGroup>,
  rng: Rng,
): GeneratorParameters {
  const next: GeneratorParameters = { ...current }
  for (const param of schema) {
    if (!unlockedGroups.has(param.group)) continue
    if (param.type === 'boolean') {
      next[param.key] = rng.bool()
    } else if (param.type === 'select') {
      next[param.key] = rng.pick(param.options).value
    } else {
      next[param.key] = rng.range(param.min, param.max)
    }
  }
  return next
}

/** Gently nudges (rather than fully rerolls) schema entries whose group is in `unlockedGroups`. */
export function nudgeParameters(
  schema: ParameterSchema[],
  current: GeneratorParameters,
  unlockedGroups: ReadonlySet<ParamGroup>,
  rng: Rng,
  amount: number,
): GeneratorParameters {
  const next: GeneratorParameters = { ...current }
  for (const param of schema) {
    if (!unlockedGroups.has(param.group)) continue
    if (param.type !== 'number' && param.type !== 'angle') continue
    if (!rng.bool(0.6)) continue
    const range = param.max - param.min
    const nudged = Number(next[param.key]) + rng.range(-amount, amount) * range
    next[param.key] = Math.min(param.max, Math.max(param.min, nudged))
  }
  return next
}
