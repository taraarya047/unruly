import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeHeightField } from '@/engine/math/noise'

const WIDTH = 800
const HEIGHT = 800

export const heightFieldGenerator: GeneratorDefinition = {
  id: 'height-field',
  name: 'Height Field',
  category: 'texture',
  description: 'A 2D terrain mesh, shaded cell by cell like a hypsometric map.',
  tags: ['terrain', 'mesh', 'map', 'heatmap'],
  defaultParameters: {
    resolution: 34,
    centers: 3,
    contrast: 1,
    gap: 0.06,
  },
  parameterSchema: [
    { key: 'resolution', label: 'Mesh resolution', type: 'number', group: 'pattern', min: 12, max: 60, step: 1, semantic: 'density' },
    { key: 'centers', label: 'Peaks', type: 'number', group: 'shape', min: 1, max: 6, step: 1, semantic: 'complexity' },
    { key: 'contrast', label: 'Contrast', type: 'number', group: 'variation', min: 0.4, max: 2, step: 0.05 },
    { key: 'gap', label: 'Cell gap', type: 'number', group: 'shape', min: 0, max: 0.3, step: 0.01 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const resolution = Math.round(Number(parameters.resolution))
    const centers = Math.round(Number(parameters.centers))
    const contrast = Number(parameters.contrast)
    const gap = Number(parameters.gap)
    const palette = colors.length ? colors : ['#111111']

    const field = makeHeightField(rng, centers)
    const cell = WIDTH / resolution

    const shapes = []
    for (let row = 0; row < resolution; row++) {
      for (let col = 0; col < resolution; col++) {
        const nx = (col + 0.5) / resolution
        const ny = (row + 0.5) / resolution
        const h = Math.max(-1, Math.min(1, field(nx, ny) * contrast))
        const t = (h + 1) / 2
        const colorIndex = Math.min(palette.length - 1, Math.floor(t * palette.length))
        const size = cell * (1 - gap)
        shapes.push({
          shape: { kind: 'rect' as const, x: col * cell + (cell - size) / 2, y: row * cell + (cell - size) / 2, w: size, h: size },
          fill: palette[colorIndex],
          opacity: 0.55 + t * 0.45,
        })
      }
    }

    return {
      id: `height-field-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'mesh', name: 'Mesh', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'height-field', generatorName: 'Height Field', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
