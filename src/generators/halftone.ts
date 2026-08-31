import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const halftoneGenerator: GeneratorDefinition = {
  id: 'halftone',
  name: 'Halftone',
  category: 'experimental',
  description: 'Classic halftone dot gradient radiating from a focal point.',
  defaultParameters: {
    density: 26,
    maxSize: 16,
    focalX: 0.5,
    focalY: 0.5,
    jitter: 0.1,
  },
  parameterSchema: [
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 8, max: 50, step: 1, semantic: 'density' },
    { key: 'maxSize', label: 'Max dot size', type: 'number', group: 'shape', min: 4, max: 30, step: 1, semantic: 'size' },
    { key: 'focalX', label: 'Focal X', type: 'number', group: 'composition', min: 0, max: 1, step: 0.02 },
    { key: 'focalY', label: 'Focal Y', type: 'number', group: 'composition', min: 0, max: 1, step: 0.02 },
    { key: 'jitter', label: 'Jitter', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const density = Number(parameters.density)
    const maxSize = Number(parameters.maxSize)
    const focalX = Number(parameters.focalX) * WIDTH
    const focalY = Number(parameters.focalY) * HEIGHT
    const jitter = Number(parameters.jitter)
    const palette = colors.length ? colors : ['#111111']

    const cell = WIDTH / density
    const cols = Math.ceil(WIDTH / cell)
    const rows = Math.ceil(HEIGHT / cell)
    const maxDist = Math.hypot(WIDTH, HEIGHT) / 2

    const shapes = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = col * cell + cell / 2
        const cy = row * cell + cell / 2
        const dist = Math.hypot(cx - focalX, cy - focalY)
        const t = Math.min(1, dist / maxDist)
        const baseR = maxSize * (1 - t)
        const r = Math.max(0.4, baseR * (1 + rng.range(-jitter, jitter)))
        if (r < 0.6) continue
        shapes.push({
          shape: { kind: 'circle' as const, cx, cy, r },
          fill: rng.pick(palette),
          opacity: rng.range(0.85, 1),
        })
      }
    }

    return {
      id: `halftone-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'halftone', name: 'Halftone', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'halftone', generatorName: 'Halftone', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
