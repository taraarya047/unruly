import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const SYMMETRY_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Horizontal', value: 'horizontal' },
  { label: 'Both', value: 'both' },
]

export const pixelMosaicGenerator: GeneratorDefinition = {
  id: 'pixel-mosaic',
  name: 'Pixel Mosaic',
  category: 'texture',
  description: 'A symmetric pixel-art sprite, built one vector square at a time.',
  tags: ['pixel', 'mosaic', 'icon', 'retro'],
  defaultParameters: {
    gridSize: 12,
    density: 0.5,
    symmetry: 'both',
    gap: 0.08,
  },
  parameterSchema: [
    { key: 'gridSize', label: 'Grid size', type: 'number', group: 'pattern', min: 6, max: 24, step: 1, semantic: 'density' },
    { key: 'density', label: 'Fill density', type: 'number', group: 'shape', min: 0.2, max: 0.8, step: 0.02 },
    { key: 'symmetry', label: 'Symmetry', type: 'select', group: 'composition', options: SYMMETRY_OPTIONS },
    { key: 'gap', label: 'Gap', type: 'number', group: 'shape', min: 0, max: 0.3, step: 0.01, advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const gridSize = Math.round(Number(parameters.gridSize))
    const density = Number(parameters.density)
    const symmetry = String(parameters.symmetry)
    const gap = Number(parameters.gap)
    const palette = colors.length ? colors : ['#111111']
    const cell = WIDTH / gridSize
    const half = Math.ceil(gridSize / 2)

    const grid: (string | null)[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < half; col++) {
        if (!rng.bool(density)) continue
        const color = rng.pick(palette)
        grid[row][col] = color
        if (symmetry === 'horizontal' || symmetry === 'both') grid[row][gridSize - 1 - col] = color
      }
    }
    if (symmetry === 'both') {
      for (let row = 0; row < Math.ceil(gridSize / 2); row++) {
        for (let col = 0; col < gridSize; col++) {
          if (grid[row][col]) grid[gridSize - 1 - row][col] = grid[row][col]
        }
      }
    }

    const shapes = []
    const size = cell * (1 - gap)
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const color = grid[row][col]
        if (!color) continue
        shapes.push({
          shape: { kind: 'rect' as const, x: col * cell + (cell - size) / 2, y: row * cell + (cell - size) / 2, w: size, h: size },
          fill: color,
          opacity: 1,
        })
      }
    }

    return {
      id: `pixel-mosaic-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'pixels', name: 'Pixels', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'pixel-mosaic', generatorName: 'Pixel Mosaic', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
