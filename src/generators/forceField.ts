import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeNoiseField } from '@/engine/math/noise'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const forceFieldGenerator: GeneratorDefinition = {
  id: 'force-field',
  name: 'Force Field',
  category: 'fields',
  description: 'A grid of iron-filing dashes aligned to an invisible magnetic field.',
  tags: ['field', 'vector', 'magnetic', 'technical'],
  defaultParameters: {
    density: 34,
    strength: 16,
    curvature: 0.6,
    noise: 0.4,
  },
  parameterSchema: [
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 10, max: 60, step: 1, semantic: 'density' },
    { key: 'strength', label: 'Dash length', type: 'number', group: 'shape', min: 4, max: 30, step: 1, semantic: 'size' },
    { key: 'curvature', label: 'Field curvature', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
    { key: 'noise', label: 'Noise', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const density = Number(parameters.density)
    const strength = Number(parameters.strength)
    const curvature = Number(parameters.curvature)
    const noiseAmount = Number(parameters.noise)
    const palette = colors.length ? colors : ['#111111']
    const field = makeNoiseField(rng, 3)

    const cell = WIDTH / density
    const cols = Math.ceil(WIDTH / cell)
    const rows = Math.ceil(HEIGHT / cell)

    const shapes = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cell + cell / 2
        const y = row * cell + cell / 2
        const n = field(x, y)
        const angle = n * Math.PI * curvature * 2 + rng.range(-noiseAmount, noiseAmount) * Math.PI * 0.3
        const len = strength * (0.6 + Math.abs(n) * 0.8)
        const dx = Math.cos(angle) * len * 0.5
        const dy = Math.sin(angle) * len * 0.5
        shapes.push({
          shape: { kind: 'line' as const, x1: round(x - dx), y1: round(y - dy), x2: round(x + dx), y2: round(y + dy) },
          stroke: rng.pick(palette),
          strokeWidth: rng.range(1, 2.5),
          fill: 'none',
          opacity: rng.range(0.6, 1),
        })
      }
    }

    return {
      id: `force-field-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'field', name: 'Field', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'force-field', generatorName: 'Force Field', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
