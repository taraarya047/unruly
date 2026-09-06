import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeHeightField } from '@/engine/math/noise'
import { ISO_RIGHT, ISO_LEFT, isoAdd, isoBlock } from '@/engine/math/isometric'

const WIDTH = 800
const HEIGHT = 800

export const isometricTerrainGenerator: GeneratorDefinition = {
  id: 'isometric-terrain',
  name: 'Isometric Terrain',
  category: 'architectural',
  description: 'A procedural heightmap read out as stacked isometric blocks — hills, valleys, and water, not buildings.',
  tags: ['isometric', 'terrain', 'architecture', 'landscape'],
  defaultParameters: {
    gridSize: 16,
    elevation: 70,
    terrainComplexity: 3,
    blockSize: 26,
    waterLevel: 0.15,
  },
  parameterSchema: [
    { key: 'gridSize', label: 'Grid size', type: 'number', group: 'pattern', min: 8, max: 22, step: 1, semantic: 'density' },
    { key: 'elevation', label: 'Elevation', type: 'number', group: 'shape', min: 20, max: 140, step: 5, semantic: 'size' },
    { key: 'terrainComplexity', label: 'Terrain complexity', type: 'number', group: 'variation', min: 1, max: 6, step: 1, semantic: 'complexity' },
    { key: 'blockSize', label: 'Block size', type: 'number', group: 'shape', min: 16, max: 40, step: 1 },
    { key: 'waterLevel', label: 'Water level', type: 'number', group: 'composition', min: 0, max: 0.4, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const gridSize = Math.round(Number(parameters.gridSize))
    const elevation = Number(parameters.elevation)
    const terrainComplexity = Math.round(Number(parameters.terrainComplexity))
    const blockSize = Number(parameters.blockSize)
    const waterLevel = Number(parameters.waterLevel)
    const palette = colors.length ? colors : ['#5b8c5a']
    const waterColor = '#4a90c2'

    const heightField = makeHeightField(rng.fork(1), terrainComplexity)
    const origin = { x: WIDTH / 2, y: HEIGHT * 0.14 }

    // Render back-to-front (far row/col first) so nearer blocks correctly occlude farther ones — the
    // same painter's-algorithm ordering Isometric City relies on.
    const shapes: StyledShape[] = []
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const nx = col / (gridSize - 1)
        const ny = row / (gridSize - 1)
        const h01 = (heightField(nx, ny) + 1) / 2
        const base = isoAdd(isoAdd(origin, ISO_RIGHT, col * blockSize), ISO_LEFT, row * blockSize)
        const footprint = blockSize * 0.86

        if (h01 < waterLevel) {
          shapes.push(...isoBlock(base, footprint, footprint, elevation * waterLevel * 0.6, waterColor, 0.85))
          continue
        }
        const h = Math.max(6, h01 * elevation)
        const color = palette[Math.min(palette.length - 1, Math.floor(h01 * palette.length))] ?? rng.pick(palette)
        shapes.push(...isoBlock(base, footprint, footprint, h, color))
        if (h01 > 0.8 && rng.bool(0.3)) {
          const top = isoAdd(base, { x: 0, y: -h }, 1)
          shapes.push(...isoBlock(top, footprint * 0.3, footprint * 0.3, blockSize * 0.5, '#f4f4f4', 0.9))
        }
      }
    }

    return {
      id: `isometric-terrain-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'terrain', name: 'Terrain', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'isometric-terrain', generatorName: 'Isometric Terrain', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
