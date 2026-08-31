import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { ISO_RIGHT, ISO_LEFT, isoAdd, isoBlock } from '@/engine/math/isometric'

const WIDTH = 800
const HEIGHT = 800

export const isometricCityGenerator: GeneratorDefinition = {
  id: 'isometric-city',
  name: 'Isometric City',
  category: 'architectural',
  description: 'A miniature stylized city block, drawn in clean isometric projection.',
  tags: ['isometric', 'city', 'buildings', 'architecture'],
  defaultParameters: {
    gridSize: 7,
    density: 0.75,
    maxHeight: 90,
    blockSize: 42,
  },
  parameterSchema: [
    { key: 'gridSize', label: 'Grid size', type: 'number', group: 'pattern', min: 3, max: 10, step: 1, semantic: 'density' },
    { key: 'density', label: 'Building density', type: 'number', group: 'composition', min: 0.3, max: 1, step: 0.02 },
    { key: 'maxHeight', label: 'Max height', type: 'number', group: 'shape', min: 30, max: 160, step: 5, semantic: 'size' },
    { key: 'blockSize', label: 'Block size', type: 'number', group: 'shape', min: 24, max: 60, step: 2 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const gridSize = Math.round(Number(parameters.gridSize))
    const density = Number(parameters.density)
    const maxHeight = Number(parameters.maxHeight)
    const blockSize = Number(parameters.blockSize)
    const palette = colors.length ? colors : ['#111111']

    const origin = { x: WIDTH / 2, y: HEIGHT / 2 - gridSize * blockSize * 0.3 }
    const footprint = blockSize * 0.82

    const shapes: StyledShape[] = []
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const base = isoAdd(isoAdd(origin, ISO_RIGHT, col * blockSize), ISO_LEFT, row * blockSize)
        if (!rng.bool(density)) continue
        const h = Math.max(14, maxHeight * rng.range(0.2, 1))
        const color = rng.pick(palette)
        shapes.push(...isoBlock(base, footprint, footprint, h, color))
        if (rng.bool(0.3)) {
          // Rooftop accent — a small second block for skyline variety.
          const topCenter = isoAdd(isoAdd(base, { x: 0, y: -h }, 1), ISO_RIGHT, footprint * 0.2)
          shapes.push(...isoBlock(topCenter, footprint * 0.4, footprint * 0.4, h * 0.3, rng.pick(palette)))
        }
      }
    }

    return {
      id: `isometric-city-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'city', name: 'City', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'isometric-city', generatorName: 'Isometric City', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
