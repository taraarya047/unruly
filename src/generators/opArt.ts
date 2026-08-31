import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const opArtGenerator: GeneratorDefinition = {
  id: 'op-art',
  name: 'Op Art',
  category: 'optical',
  description: 'Concentric rings warped into a rippling, vibrating illusion of depth.',
  tags: ['optical', 'illusion', 'rings', 'bold'],
  defaultParameters: {
    rings: 26,
    waviness: 8,
    frequency: 6,
    squareness: 0.3,
  },
  parameterSchema: [
    { key: 'rings', label: 'Rings', type: 'number', group: 'pattern', min: 8, max: 50, step: 1, semantic: 'density' },
    { key: 'waviness', label: 'Waviness', type: 'number', group: 'variation', min: 0, max: 30, step: 1, semantic: 'jitter' },
    { key: 'frequency', label: 'Ripple frequency', type: 'number', group: 'shape', min: 2, max: 16, step: 1, semantic: 'complexity' },
    { key: 'squareness', label: 'Squareness', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const rings = Math.round(Number(parameters.rings))
    const waviness = Number(parameters.waviness)
    const frequency = Math.round(Number(parameters.frequency))
    const squareness = Number(parameters.squareness)
    const palette = colors.length ? colors : ['#111111', '#f5f5f0']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxR = Math.min(WIDTH, HEIGHT) * 0.46
    const samples = 90
    const phase = rng.range(0, Math.PI * 2)

    const shapes = []
    for (let i = rings - 1; i >= 0; i--) {
      const baseR = ((i + 1) / rings) * maxR
      const color = palette[i % palette.length]
      let d = ''
      for (let s = 0; s <= samples; s++) {
        const theta = (s / samples) * Math.PI * 2
        const squareR = Math.cos(Math.PI / 4) / Math.cos((((theta % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2)) - Math.PI / 4)
        const shapeR = baseR * (1 - squareness) + baseR * squareR * squareness
        const ripple = Math.sin(theta * frequency + phase + i * 0.3) * waviness
        const r = Math.max(2, shapeR + ripple)
        const x = cx + Math.cos(theta) * r
        const y = cy + Math.sin(theta) * r
        d += `${s === 0 ? 'M' : 'L'} ${round(x)} ${round(y)} `
      }
      shapes.push({ shape: { kind: 'path' as const, d: d.trim() + ' Z' }, fill: color, opacity: 1 })
    }

    return {
      id: `op-art-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'rings', name: 'Rings', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'op-art', generatorName: 'Op Art', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
