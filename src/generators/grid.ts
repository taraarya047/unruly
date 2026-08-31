import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const gridGenerator: GeneratorDefinition = {
  id: 'grid',
  name: 'Grid',
  category: 'geometric',
  description: 'A rhythmic grid of cells with rotation and distortion.',
  defaultParameters: {
    columns: 10,
    rows: 10,
    spacing: 0.15,
    rotation: 0,
    distortion: 0.1,
  },
  parameterSchema: [
    { key: 'columns', label: 'Columns', type: 'number', group: 'pattern', min: 2, max: 30, step: 1, semantic: 'density' },
    { key: 'rows', label: 'Rows', type: 'number', group: 'pattern', min: 2, max: 30, step: 1, semantic: 'density' },
    { key: 'spacing', label: 'Gap', type: 'number', group: 'pattern', min: 0, max: 0.5, step: 0.01 },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 45, step: 1, semantic: 'rotation' },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const columns = Number(parameters.columns)
    const rows = Number(parameters.rows)
    const spacing = Number(parameters.spacing)
    const rotation = Number(parameters.rotation)
    const distortion = Number(parameters.distortion)
    const palette = colors.length ? colors : ['#111111']

    const cellW = WIDTH / columns
    const cellH = HEIGHT / rows
    const gapX = cellW * spacing
    const gapY = cellH * spacing

    const shapes = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = col * cellW + gapX / 2
        const y = row * cellH + gapY / 2
        const w = cellW - gapX
        const h = cellH - gapY
        const cellRotation = rotation + rng.range(-distortion, distortion) * 25
        shapes.push({
          shape: { kind: 'rect' as const, x, y, w, h, rotation: cellRotation },
          fill: rng.pick(palette),
          opacity: rng.range(0.8, 1),
        })
      }
    }

    return {
      id: `grid-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'cells', name: 'Cells', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'grid', generatorName: 'Grid', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
