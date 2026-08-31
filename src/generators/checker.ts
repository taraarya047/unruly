import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const checkerGenerator: GeneratorDefinition = {
  id: 'checker',
  name: 'Checker / Tile',
  category: 'geometric',
  description: 'A checkerboard of tiles with rotation and scale distortion.',
  defaultParameters: {
    tileSize: 16,
    rotation: 0,
    distortion: 0.1,
    scale: 1,
  },
  parameterSchema: [
    // Below ~8px tiles the shape count crosses the ~5000-node SVG performance/export threshold.
    { key: 'tileSize', label: 'Tile size', type: 'number', group: 'pattern', min: 8, max: 40, step: 1, semantic: 'density' },
    { key: 'scale', label: 'Scale', type: 'number', group: 'shape', min: 0.5, max: 1.3, step: 0.02, semantic: 'scale' },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 45, step: 1, semantic: 'rotation' },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const tileSize = Number(parameters.tileSize)
    const rotation = Number(parameters.rotation)
    const distortion = Number(parameters.distortion)
    const scale = Number(parameters.scale)
    const palette = colors.length ? colors : ['#111111', '#f5f5f0']

    const cols = Math.ceil(WIDTH / tileSize)
    const rows = Math.ceil(HEIGHT / tileSize)

    const shapes = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if ((row + col) % 2 !== 0) continue
        const jitter = rng.bool(distortion) ? rng.range(-distortion, distortion) * 25 : 0
        const size = tileSize * scale * (1 - Math.abs(jitter) * 0.01)
        const x = col * tileSize + (tileSize - size) / 2
        const y = row * tileSize + (tileSize - size) / 2
        shapes.push({
          shape: { kind: 'rect' as const, x, y, w: size, h: size, rotation: rotation + jitter },
          fill: rng.pick(palette),
          opacity: rng.range(0.85, 1),
        })
      }
    }

    return {
      id: `checker-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'tiles', name: 'Tiles', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'checker', generatorName: 'Checker / Tile', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
