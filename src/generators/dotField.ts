import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const dotFieldGenerator: GeneratorDefinition = {
  id: 'dot-field',
  name: 'Dot Field',
  category: 'geometric',
  description: 'A field of dots with adjustable density, size, and jitter.',
  defaultParameters: {
    density: 16,
    size: 10,
    spacing: 1,
    jitter: 0.2,
    scaleVariation: 0.4,
  },
  parameterSchema: [
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 4, max: 40, step: 1, semantic: 'density' },
    { key: 'size', label: 'Size', type: 'number', group: 'shape', min: 2, max: 30, step: 1, semantic: 'size' },
    { key: 'spacing', label: 'Spacing', type: 'number', group: 'pattern', min: 0.5, max: 2, step: 0.05 },
    { key: 'jitter', label: 'Jitter', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'scaleVariation', label: 'Scale variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const density = Number(parameters.density)
    const size = Number(parameters.size)
    const spacing = Number(parameters.spacing)
    const jitter = Number(parameters.jitter)
    const scaleVariation = Number(parameters.scaleVariation)
    const cell = (WIDTH / density) * spacing
    const cols = Math.ceil(WIDTH / cell) + 1
    const rows = Math.ceil(HEIGHT / cell) + 1
    const palette = colors.length ? colors : ['#111111']

    const shapes = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const baseX = col * cell
        const baseY = row * cell
        const jx = rng.range(-jitter, jitter) * cell * 0.5
        const jy = rng.range(-jitter, jitter) * cell * 0.5
        const r = Math.max(0.5, size * (1 + rng.range(-scaleVariation, scaleVariation)))
        shapes.push({
          shape: { kind: 'circle' as const, cx: baseX + jx, cy: baseY + jy, r },
          fill: rng.pick(palette),
          opacity: rng.range(0.75, 1),
        })
      }
    }

    return {
      id: `dot-field-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'dots', name: 'Dots', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'dot-field', generatorName: 'Dot Field', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
