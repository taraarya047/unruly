import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { cliffordPoints, deJongPoints, boundsOf } from '@/engine/math/attractors'

const WIDTH = 800
const HEIGHT = 800

const VARIANT_OPTIONS = [
  { label: 'Clifford', value: 'clifford' },
  { label: 'De Jong', value: 'dejong' },
]

export const strangeAttractorGenerator: GeneratorDefinition = {
  id: 'strange-attractor',
  name: 'Strange Attractor',
  category: 'mathematical',
  description: 'Millions of tiny bounces settle into a hidden, beautiful shape.',
  tags: ['chaos', 'attractor', 'particles', 'scientific'],
  defaultParameters: {
    iterations: 12000,
    chaos: 1.6,
    dotSize: 1,
    variant: 'clifford',
  },
  parameterSchema: [
    { key: 'iterations', label: 'Density', type: 'number', group: 'pattern', min: 3000, max: 25000, step: 500, semantic: 'density' },
    { key: 'chaos', label: 'Chaos', type: 'number', group: 'shape', min: 0.5, max: 3, step: 0.05, semantic: 'jitter' },
    { key: 'dotSize', label: 'Dot size', type: 'number', group: 'shape', min: 0.4, max: 2.5, step: 0.1, semantic: 'size' },
    { key: 'variant', label: 'System', type: 'select', group: 'composition', options: VARIANT_OPTIONS, advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const iterations = Math.round(Number(parameters.iterations))
    const chaos = Number(parameters.chaos)
    const dotSize = Number(parameters.dotSize)
    const variant = String(parameters.variant)
    const palette = colors.length ? colors : ['#111111']

    const a = rng.range(-chaos, chaos)
    const b = rng.range(-chaos, chaos)
    const c = rng.range(-chaos, chaos)
    const d = rng.range(-chaos, chaos)
    const points = variant === 'dejong' ? deJongPoints(iterations, a, b, c, d) : cliffordPoints(iterations, a, b, c, d)

    const bounds = boundsOf(points)
    const spanX = bounds.maxX - bounds.minX || 1
    const spanY = bounds.maxY - bounds.minY || 1
    const fit = Math.min(WIDTH / spanX, HEIGHT / spanY) * 0.88
    const offsetX = WIDTH / 2 - ((bounds.minX + bounds.maxX) / 2) * fit
    const offsetY = HEIGHT / 2 - ((bounds.minY + bounds.maxY) / 2) * fit

    // Sample down for rendering — thousands of tiny dots read as a dense field without an oversized SVG.
    const stride = Math.max(1, Math.floor(points.length / 3500))
    const shapes = []
    for (let i = 0; i < points.length; i += stride) {
      const p = points[i]
      shapes.push({
        shape: { kind: 'circle' as const, cx: p.x * fit + offsetX, cy: p.y * fit + offsetY, r: dotSize },
        fill: rng.pick(palette),
        opacity: rng.range(0.35, 0.75),
      })
    }

    return {
      id: `strange-attractor-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'points', name: 'Points', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'strange-attractor', generatorName: 'Strange Attractor', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
