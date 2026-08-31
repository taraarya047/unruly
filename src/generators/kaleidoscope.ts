import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const kaleidoscopeGenerator: GeneratorDefinition = {
  id: 'kaleidoscope',
  name: 'Kaleidoscope',
  category: 'optical',
  description: 'A scatter of shapes mirrored around the center, kaleidoscope-style.',
  tags: ['symmetry', 'mirror', 'radial', 'optical'],
  defaultParameters: {
    segments: 8,
    sourceShapes: 14,
    complexity: 0.5,
    rotation: 0,
  },
  parameterSchema: [
    { key: 'segments', label: 'Mirrors', type: 'number', group: 'composition', min: 3, max: 16, step: 1, semantic: 'complexity' },
    { key: 'sourceShapes', label: 'Source shapes', type: 'number', group: 'pattern', min: 4, max: 30, step: 1, semantic: 'density' },
    { key: 'complexity', label: 'Shape variety', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 360, step: 1, semantic: 'rotation' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const segments = Math.round(Number(parameters.segments))
    const sourceShapes = Math.round(Number(parameters.sourceShapes))
    const complexity = Number(parameters.complexity)
    const rotationOffset = (Number(parameters.rotation) * Math.PI) / 180
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxR = Math.min(WIDTH, HEIGHT) * 0.46

    // Build one wedge of source shapes, positioned within a single segment slice, then mirror/rotate it.
    const wedgeAngle = (Math.PI * 2) / segments
    const sources = Array.from({ length: sourceShapes }, () => {
      const r = rng.range(20, maxR)
      const a = rng.range(0, wedgeAngle)
      const size = rng.range(6, 30) * (1 - r / maxR * 0.3)
      return { r, a, size, color: rng.pick(palette), kind: rng.bool(complexity) ? ('polygon' as const) : ('circle' as const), sides: rng.int(3, 6) }
    })

    const shapes: StyledShape[] = []
    for (let seg = 0; seg < segments; seg++) {
      const baseAngle = seg * wedgeAngle + rotationOffset
      const mirror = seg % 2 === 1
      for (const s of sources) {
        const a = mirror ? baseAngle + (wedgeAngle - s.a) : baseAngle + s.a
        const x = cx + Math.cos(a) * s.r
        const y = cy + Math.sin(a) * s.r
        if (s.kind === 'circle') {
          shapes.push({ shape: { kind: 'circle', cx: x, cy: y, r: s.size }, fill: s.color, opacity: rng.range(0.75, 1) })
        } else {
          shapes.push({ shape: { kind: 'polygon', cx: x, cy: y, r: s.size, sides: s.sides, rotation: a }, fill: s.color, opacity: rng.range(0.75, 1) })
        }
      }
    }

    return {
      id: `kaleidoscope-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'kaleidoscope', name: 'Kaleidoscope', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'kaleidoscope', generatorName: 'Kaleidoscope', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
