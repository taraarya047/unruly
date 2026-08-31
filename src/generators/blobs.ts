import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const blobsGenerator: GeneratorDefinition = {
  id: 'blobs',
  name: 'Blobs',
  category: 'organic',
  description: 'Soft organic blob shapes scattered across the canvas.',
  defaultParameters: {
    count: 12,
    size: 90,
    complexity: 8,
    smoothness: 0.7,
    variation: 0.5,
  },
  parameterSchema: [
    { key: 'count', label: 'Count', type: 'number', group: 'pattern', min: 1, max: 40, step: 1, semantic: 'density' },
    { key: 'size', label: 'Size', type: 'number', group: 'shape', min: 10, max: 220, step: 1, semantic: 'size' },
    { key: 'complexity', label: 'Complexity', type: 'number', group: 'shape', min: 3, max: 20, step: 1, semantic: 'complexity', advanced: true },
    { key: 'smoothness', label: 'Smoothness', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
    { key: 'variation', label: 'Size variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const count = Number(parameters.count)
    const size = Number(parameters.size)
    const complexity = Number(parameters.complexity)
    const smoothness = Number(parameters.smoothness)
    const variation = Number(parameters.variation)
    const palette = colors.length ? colors : ['#111111']
    const irregularity = 0.65 - smoothness * 0.6

    const shapes = []
    for (let i = 0; i < count; i++) {
      const cx = rng.range(size * 0.3, WIDTH - size * 0.3)
      const cy = rng.range(size * 0.3, HEIGHT - size * 0.3)
      const r = Math.max(4, size * (1 + rng.range(-variation, variation)) * rng.range(0.4, 1))
      shapes.push({
        shape: {
          kind: 'blob' as const,
          cx,
          cy,
          r,
          points: Math.round(complexity),
          irregularity,
          seed: rng.int(0, 2 ** 31),
        },
        fill: rng.pick(palette),
        opacity: rng.range(0.75, 1),
      })
    }

    return {
      id: `blobs-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'blobs', name: 'Blobs', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'blobs', generatorName: 'Blobs', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
