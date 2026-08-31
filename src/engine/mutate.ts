import type { GeneratorDefinition, GeneratorParameters, NumberParamSchema } from './types'

export type SemanticAction = 'calmer' | 'chaotic' | 'denser' | 'simpler' | 'stranger' | 'symmetrical' | 'louder'

export const SEMANTIC_ACTIONS: { id: SemanticAction; label: string }[] = [
  { id: 'calmer', label: 'Make it calmer' },
  { id: 'chaotic', label: 'Make it chaotic' },
  { id: 'denser', label: 'Make it denser' },
  { id: 'simpler', label: 'Make it simpler' },
  { id: 'stranger', label: 'Make it stranger' },
  { id: 'symmetrical', label: 'Make it symmetrical' },
  { id: 'louder', label: 'Make it louder' },
]

type SemanticTag = NonNullable<NumberParamSchema['semantic']>

const ACTION_DELTAS: Record<SemanticAction, Partial<Record<SemanticTag, number>>> = {
  calmer: { jitter: -0.3, rotation: -0.3, density: -0.15, scale: -0.2, contrast: -0.2 },
  chaotic: { jitter: 0.35, rotation: 0.3, scale: 0.3, contrast: 0.2 },
  denser: { density: 0.3 },
  simpler: { density: -0.25, complexity: -0.3, jitter: -0.2 },
  stranger: { jitter: 0.25, complexity: 0.3, scale: 0.25 },
  symmetrical: { jitter: -0.4, rotation: -0.4 },
  louder: { size: 0.25, scale: 0.2, contrast: 0.2 },
}

/** Deterministic semantic parameter mutation — no AI, just weighted deltas over tagged parameters. */
export function applySemanticAction(
  generator: GeneratorDefinition,
  parameters: GeneratorParameters,
  action: SemanticAction,
): GeneratorParameters {
  const deltas = ACTION_DELTAS[action]
  const next: GeneratorParameters = { ...parameters }
  for (const schema of generator.parameterSchema) {
    if (schema.type !== 'number' && schema.type !== 'angle') continue
    if (!schema.semantic) continue
    const delta = deltas[schema.semantic]
    if (delta === undefined) continue
    const current = Number(next[schema.key])
    const range = schema.max - schema.min
    const nudged = current + delta * range
    next[schema.key] = Math.min(schema.max, Math.max(schema.min, nudged))
  }
  return next
}
