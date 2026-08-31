import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

// r(theta) for a regular n-gon of "radius" 1 (distance to flat edge along theta=0).
function polygonRadius(theta: number, n: number, rotation = 0): number {
  const t = theta - rotation
  const step = (Math.PI * 2) / n
  const local = (((t % step) + step) % step) - step / 2
  return Math.cos(Math.PI / n) / Math.cos(local)
}

const SHAPES = [
  (_theta: number) => 1, // circle
  (theta: number) => polygonRadius(theta, 4, Math.PI / 4), // square
  (theta: number) => polygonRadius(theta, 4, 0), // diamond
  (theta: number) => polygonRadius(theta, 3, -Math.PI / 2), // triangle
]

const DIRECTION_OPTIONS = [
  { label: 'Horizontal', value: 'horizontal' },
  { label: 'Diagonal', value: 'diagonal' },
  { label: 'Radial', value: 'radial' },
]

export const tileMorpherGenerator: GeneratorDefinition = {
  id: 'tile-morpher',
  name: 'Tile Morpher',
  category: 'tessellation',
  description: 'A repeating tile that gradually morphs — circle to square to diamond to triangle — across the canvas.',
  tags: ['tiles', 'morph', 'geometric', 'grid'],
  defaultParameters: {
    tileCount: 10,
    intensity: 1,
    direction: 'horizontal',
    variation: 0.1,
  },
  parameterSchema: [
    { key: 'tileCount', label: 'Tiles', type: 'number', group: 'pattern', min: 3, max: 24, step: 1, semantic: 'density' },
    { key: 'intensity', label: 'Morph intensity', type: 'number', group: 'shape', min: 0.2, max: 1.5, step: 0.05 },
    { key: 'direction', label: 'Direction', type: 'select', group: 'composition', options: DIRECTION_OPTIONS },
    { key: 'variation', label: 'Variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const tileCount = Math.round(Number(parameters.tileCount))
    const intensity = Number(parameters.intensity)
    const direction = String(parameters.direction)
    const variation = Number(parameters.variation)
    const palette = colors.length ? colors : ['#111111']

    const cell = WIDTH / tileCount
    const samples = 28
    const shapes = []

    for (let row = 0; row < tileCount; row++) {
      for (let col = 0; col < tileCount; col++) {
        const cx = col * cell + cell / 2
        const cy = row * cell + cell / 2
        const u = col / (tileCount - 1 || 1)
        const v = row / (tileCount - 1 || 1)
        let progress = u
        if (direction === 'diagonal') progress = (u + v) / 2
        if (direction === 'radial') progress = Math.min(1, Math.hypot(u - 0.5, v - 0.5) * 1.6)

        const t = progress * (SHAPES.length - 1)
        const idx = Math.min(SHAPES.length - 2, Math.floor(t))
        const localT = t - idx
        const jitter = rng.range(-variation, variation)

        let d = ''
        for (let s = 0; s <= samples; s++) {
          const theta = (s / samples) * Math.PI * 2
          const rA = SHAPES[idx](theta)
          const rB = SHAPES[idx + 1](theta)
          const blended = rA + (rB - rA) * localT
          const radius = (cell * 0.38 * (1 + (blended - 1) * intensity)) * (1 + jitter * 0.15)
          const x = cx + Math.cos(theta) * radius
          const y = cy + Math.sin(theta) * radius
          d += `${s === 0 ? 'M' : 'L'} ${round(x)} ${round(y)} `
        }

        shapes.push({
          shape: { kind: 'path' as const, d: d.trim() + ' Z' },
          fill: rng.pick(palette),
          opacity: rng.range(0.82, 1),
        })
      }
    }

    return {
      id: `tile-morpher-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'tiles', name: 'Tiles', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'tile-morpher', generatorName: 'Tile Morpher', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
