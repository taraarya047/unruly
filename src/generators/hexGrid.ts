import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const hexGridGenerator: GeneratorDefinition = {
  id: 'hex-grid',
  name: 'Hex Grid',
  category: 'geometric',
  description: 'A tessellating grid of hexagons.',
  defaultParameters: {
    size: 34,
    gap: 0.08,
    variation: 0.15,
    rotation: 0,
  },
  parameterSchema: [
    { key: 'size', label: 'Size', type: 'number', group: 'pattern', min: 12, max: 70, step: 1, semantic: 'density' },
    { key: 'gap', label: 'Gap', type: 'number', group: 'pattern', min: 0, max: 0.4, step: 0.01 },
    { key: 'variation', label: 'Scale variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'scale' },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 60, step: 1, semantic: 'rotation' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const size = Number(parameters.size)
    const gap = Number(parameters.gap)
    const variation = Number(parameters.variation)
    const rotation = Number(parameters.rotation)
    const palette = colors.length ? colors : ['#111111']

    const hexWidth = Math.sqrt(3) * size
    const hexHeight = 2 * size
    const vertSpacing = hexHeight * 0.75
    const cols = Math.ceil(WIDTH / hexWidth) + 2
    const rows = Math.ceil(HEIGHT / vertSpacing) + 2

    const shapes = []
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const xOffset = row % 2 === 0 ? 0 : hexWidth / 2
        const cx = col * hexWidth + xOffset
        const cy = row * vertSpacing
        const r = Math.max(2, (size - size * gap) * (1 + rng.range(-variation, variation)))
        shapes.push({
          shape: { kind: 'polygon' as const, cx, cy, r, sides: 6, rotation: (rotation * Math.PI) / 180 },
          fill: rng.pick(palette),
          opacity: rng.range(0.8, 1),
        })
      }
    }

    return {
      id: `hex-grid-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'hexagons', name: 'Hexagons', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'hex-grid', generatorName: 'Hex Grid', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
