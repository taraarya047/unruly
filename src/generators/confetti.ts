import type { GeneratorDefinition, ShapePrimitive } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const SHAPE_OPTIONS = [
  { label: 'Mixed', value: 'mixed' },
  { label: 'Circles', value: 'circle' },
  { label: 'Squares', value: 'rect' },
  { label: 'Triangles', value: 'triangle' },
  { label: 'Stars', value: 'star' },
]

function makeShape(kind: string, cx: number, cy: number, size: number, rotation: number): ShapePrimitive {
  switch (kind) {
    case 'circle':
      return { kind: 'circle', cx, cy, r: size / 2 }
    case 'rect':
      return { kind: 'rect', x: cx - size / 2, y: cy - size / 2, w: size, h: size, rotation }
    case 'triangle':
      return { kind: 'polygon', cx, cy, r: size / 1.6, sides: 3, rotation }
    default:
      return { kind: 'star', cx, cy, rOuter: size / 1.6, rInner: size / 3.6, points: 5, rotation }
  }
}

export const confettiGenerator: GeneratorDefinition = {
  id: 'confetti',
  name: 'Confetti',
  category: 'experimental',
  description: 'A scatter of small shapes — mixed or a single kind.',
  defaultParameters: {
    count: 220,
    shape: 'mixed',
    size: 16,
    rotation: 1,
    distribution: 0.5,
  },
  parameterSchema: [
    { key: 'count', label: 'Count', type: 'number', group: 'pattern', min: 20, max: 600, step: 10, semantic: 'density' },
    { key: 'shape', label: 'Shape', type: 'select', group: 'shape', options: SHAPE_OPTIONS },
    { key: 'size', label: 'Size', type: 'number', group: 'shape', min: 3, max: 60, step: 1, semantic: 'size' },
    { key: 'rotation', label: 'Random rotation', type: 'number', group: 'composition', min: 0, max: 1, step: 0.02, semantic: 'rotation' },
    { key: 'distribution', label: 'Clustering', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const count = Number(parameters.count)
    const shapeKind = String(parameters.shape)
    const size = Number(parameters.size)
    const rotationAmount = Number(parameters.rotation)
    const distribution = Number(parameters.distribution)
    const palette = colors.length ? colors : ['#111111']
    const kinds = ['circle', 'rect', 'triangle', 'star']

    // Clustering: blend uniform placement with a handful of gravity-well centers.
    const clusterCount = Math.max(1, Math.round(distribution * 5))
    const clusters = Array.from({ length: clusterCount }, () => ({ x: rng.range(0, WIDTH), y: rng.range(0, HEIGHT) }))

    const shapes = []
    for (let i = 0; i < count; i++) {
      let cx: number
      let cy: number
      if (rng.bool(distribution)) {
        const c = rng.pick(clusters)
        cx = c.x + rng.range(-1, 1) * WIDTH * 0.12
        cy = c.y + rng.range(-1, 1) * HEIGHT * 0.12
      } else {
        cx = rng.range(0, WIDTH)
        cy = rng.range(0, HEIGHT)
      }
      const s = size * rng.range(0.5, 1.4)
      const rotation = rng.range(0, 360) * rotationAmount
      const kind = shapeKind === 'mixed' ? rng.pick(kinds) : shapeKind
      shapes.push({
        shape: makeShape(kind, cx, cy, s, rotation),
        fill: rng.pick(palette),
        opacity: rng.range(0.7, 1),
      })
    }

    return {
      id: `confetti-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'confetti', name: 'Confetti', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'confetti', generatorName: 'Confetti', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
