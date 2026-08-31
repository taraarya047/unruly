import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const polygonFieldGenerator: GeneratorDefinition = {
  id: 'polygon-field',
  name: 'Polygon Field',
  category: 'geometric',
  description: 'A scattered field of rotated polygons.',
  defaultParameters: {
    sides: 6,
    size: 34,
    density: 12,
    rotation: 0,
    variation: 0.4,
  },
  parameterSchema: [
    { key: 'sides', label: 'Sides', type: 'number', group: 'shape', min: 3, max: 12, step: 1, semantic: 'complexity' },
    { key: 'size', label: 'Size', type: 'number', group: 'shape', min: 6, max: 90, step: 1, semantic: 'size' },
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 3, max: 30, step: 1, semantic: 'density' },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 360, step: 1, semantic: 'rotation' },
    { key: 'variation', label: 'Variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const sides = Math.round(Number(parameters.sides))
    const size = Number(parameters.size)
    const density = Number(parameters.density)
    const rotation = (Number(parameters.rotation) * Math.PI) / 180
    const variation = Number(parameters.variation)
    const palette = colors.length ? colors : ['#111111']

    const cell = WIDTH / density
    const cols = Math.ceil(WIDTH / cell) + 1
    const rows = Math.ceil(HEIGHT / cell) + 1

    const shapes = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = col * cell + rng.range(-cell, cell) * 0.3
        const cy = row * cell + rng.range(-cell, cell) * 0.3
        const r = Math.max(2, size * (1 + rng.range(-variation, variation)))
        shapes.push({
          shape: { kind: 'polygon' as const, cx, cy, r, sides, rotation: rotation + rng.range(-variation, variation) * Math.PI },
          fill: rng.pick(palette),
          opacity: rng.range(0.75, 1),
        })
      }
    }

    return {
      id: `polygon-field-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'polygons', name: 'Polygons', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'polygon-field', generatorName: 'Polygon Field', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
