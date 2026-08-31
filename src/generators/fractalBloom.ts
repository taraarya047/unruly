import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800
const MAX_SHAPES = 2500

export const fractalBloomGenerator: GeneratorDefinition = {
  id: 'fractal-bloom',
  name: 'Fractal Bloom',
  category: 'organic',
  description: 'A recursive radial bloom — flowers, snowflakes, and recursive ornaments.',
  tags: ['recursive', 'flower', 'mandala', 'fractal'],
  defaultParameters: {
    recursion: 4,
    petals: 4,
    branchScale: 0.55,
    rotation: 18,
  },
  parameterSchema: [
    { key: 'recursion', label: 'Recursion', type: 'number', group: 'shape', min: 1, max: 6, step: 1, semantic: 'complexity' },
    { key: 'petals', label: 'Petals', type: 'number', group: 'pattern', min: 2, max: 8, step: 1, semantic: 'density' },
    { key: 'branchScale', label: 'Shrink', type: 'number', group: 'shape', min: 0.3, max: 0.75, step: 0.02, semantic: 'scale' },
    { key: 'rotation', label: 'Twist', type: 'angle', group: 'composition', min: -60, max: 60, step: 1, semantic: 'rotation' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const recursion = Math.round(Number(parameters.recursion))
    const petals = Math.round(Number(parameters.petals))
    const branchScale = Number(parameters.branchScale)
    const rotationDeg = (Number(parameters.rotation) * Math.PI) / 180
    const palette = colors.length ? colors : ['#111111']

    const shapes: { shape: { kind: 'circle'; cx: number; cy: number; r: number }; fill: string; opacity: number }[] = []
    const startSize = Math.min(WIDTH, HEIGHT) * 0.16

    function recurse(x: number, y: number, size: number, angle: number, depth: number) {
      if (depth <= 0 || size < 3 || shapes.length >= MAX_SHAPES) return
      for (let i = 0; i < petals; i++) {
        if (shapes.length >= MAX_SHAPES) return
        const a = angle + (i / petals) * Math.PI * 2
        const px = x + Math.cos(a) * size
        const py = y + Math.sin(a) * size
        shapes.push({
          shape: { kind: 'circle', cx: px, cy: py, r: size * 0.55 },
          fill: rng.pick(palette),
          opacity: 0.6 + 0.4 * (depth / recursion),
        })
        recurse(px, py, size * branchScale, a + rotationDeg + rng.range(-0.05, 0.05), depth - 1)
      }
    }

    shapes.push({ shape: { kind: 'circle', cx: WIDTH / 2, cy: HEIGHT / 2, r: startSize * 0.6 }, fill: rng.pick(palette), opacity: 1 })
    recurse(WIDTH / 2, HEIGHT / 2, startSize, rng.range(0, Math.PI * 2), recursion)

    return {
      id: `fractal-bloom-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'bloom', name: 'Bloom', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'fractal-bloom', generatorName: 'Fractal Bloom', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
