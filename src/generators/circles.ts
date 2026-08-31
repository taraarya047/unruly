import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const circlesGenerator: GeneratorDefinition = {
  id: 'circles',
  name: 'Circles',
  category: 'geometric',
  description: 'Overlapping translucent circles for layered compositions.',
  defaultParameters: {
    size: 60,
    spacing: 1,
    scaleVariation: 0.5,
    opacity: 0.75,
    overlap: 0.3,
  },
  parameterSchema: [
    { key: 'size', label: 'Size', type: 'number', group: 'shape', min: 10, max: 150, step: 1, semantic: 'size' },
    { key: 'spacing', label: 'Spacing', type: 'number', group: 'pattern', min: 0.5, max: 2, step: 0.05, semantic: 'density' },
    { key: 'scaleVariation', label: 'Scale variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'scale' },
    { key: 'opacity', label: 'Opacity', type: 'number', group: 'color', min: 0.1, max: 1, step: 0.02 },
    { key: 'overlap', label: 'Overlap', type: 'number', group: 'pattern', min: 0, max: 1, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const size = Number(parameters.size)
    const spacing = Number(parameters.spacing)
    const scaleVariation = Number(parameters.scaleVariation)
    const opacity = Number(parameters.opacity)
    const overlap = Number(parameters.overlap)
    const palette = colors.length ? colors : ['#111111']

    const cell = size * 1.6 * spacing
    const cols = Math.ceil(WIDTH / cell) + 1
    const rows = Math.ceil(HEIGHT / cell) + 1

    const shapes = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = row % 2 === 0 ? 0 : cell / 2
        const cx = col * cell + offsetX + rng.range(-cell, cell) * 0.08
        const cy = row * cell + rng.range(-cell, cell) * 0.08
        const r = Math.max(2, size * (1 + rng.range(-scaleVariation, scaleVariation)) * (1 + overlap * 0.4))
        shapes.push({
          shape: { kind: 'circle' as const, cx, cy, r },
          fill: rng.pick(palette),
          opacity: opacity * rng.range(0.7, 1),
        })
      }
    }

    return {
      id: `circles-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'circles', name: 'Circles', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'circles', generatorName: 'Circles', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
