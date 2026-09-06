import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { ISO_RIGHT, ISO_LEFT, ISO_UP, isoAdd, isoBlock } from '@/engine/math/isometric'

const WIDTH = 800
const HEIGHT = 800

export const isometricMachineryGenerator: GeneratorDefinition = {
  id: 'isometric-machinery',
  name: 'Isometric Machinery',
  category: 'architectural',
  description: 'An abstract mechanical assembly of isometric blocks, gears, and connecting pipes — a diagram of a machine that doesn’t quite work, drawn as if it does.',
  tags: ['isometric', 'mechanical', 'technical', 'illustrative'],
  defaultParameters: {
    complexity: 22,
    scale: 42,
    symmetry: false,
    density: 0.7,
  },
  parameterSchema: [
    { key: 'complexity', label: 'Parts', type: 'number', group: 'pattern', min: 6, max: 26, step: 1, semantic: 'density' },
    { key: 'scale', label: 'Scale', type: 'number', group: 'shape', min: 20, max: 55, step: 1, semantic: 'scale' },
    { key: 'symmetry', label: 'Mirror', type: 'boolean', group: 'composition' },
    { key: 'density', label: 'Connector density', type: 'number', group: 'variation', min: 0.2, max: 1, step: 0.02, semantic: 'complexity' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const complexity = Math.round(Number(parameters.complexity))
    const scale = Number(parameters.scale)
    const symmetry = Boolean(parameters.symmetry)
    const density = Number(parameters.density)
    const palette = colors.length ? colors : ['#8a8f98']
    const origin = { x: WIDTH / 2, y: HEIGHT * 0.55 }

    // Each part sits at a lattice position reachable from the origin by whole ISO_RIGHT/ISO_LEFT/ISO_UP
    // steps, so blocks/gears/pipes naturally line up into a coherent assembly rather than floating
    // independently — the isometric analogue of snapping to a grid.
    const parts: { pos: { x: number; y: number }; kind: 'block' | 'gear' | 'pipe' }[] = []
    let cursor = { q: 0, r: 0, h: 0 }
    for (let i = 0; i < complexity; i++) {
      const kind = rng.pick(['block', 'block', 'gear', 'pipe'] as const)
      const pos = isoAdd(isoAdd(isoAdd(origin, ISO_RIGHT, cursor.q * scale), ISO_LEFT, cursor.r * scale), ISO_UP, cursor.h * scale)
      parts.push({ pos, kind })
      const move = rng.pick(['q', 'r', 'h'] as const)
      if (move === 'q') cursor = { ...cursor, q: cursor.q + rng.sign() }
      else if (move === 'r') cursor = { ...cursor, r: cursor.r + rng.sign() }
      else cursor = { ...cursor, h: Math.max(0, cursor.h + rng.sign()) }
    }

    const buildShapes = (mirror: boolean): StyledShape[] => {
      const shapes: StyledShape[] = []
      const flip = (p: { x: number; y: number }) => (mirror ? { x: WIDTH - p.x, y: p.y } : p)
      for (const part of parts) {
        const p = flip(part.pos)
        const color = rng.pick(palette)
        if (part.kind === 'block') {
          shapes.push(...isoBlock(p, scale * 0.7, scale * 0.7, scale * rng.range(0.4, 1), color))
        } else if (part.kind === 'gear') {
          const teeth = 8
          const rOuter = scale * 0.32
          const rInner = scale * 0.22
          shapes.push({ shape: { kind: 'star', cx: p.x, cy: p.y, rOuter, rInner, points: teeth }, fill: color, opacity: 0.9 })
          shapes.push({ shape: { kind: 'circle', cx: p.x, cy: p.y, r: rInner * 0.5 }, fill: '#111111', opacity: 0.6 })
        } else if (rng.bool(density)) {
          const other = rng.pick(parts)
          const op = flip(other.pos)
          shapes.push({ shape: { kind: 'line', x1: p.x, y1: p.y, x2: op.x, y2: op.y }, stroke: color, strokeWidth: 3, opacity: 0.7 })
        }
      }
      return shapes
    }

    const shapes = symmetry ? [...buildShapes(false), ...buildShapes(true)] : buildShapes(false)

    return {
      id: `isometric-machinery-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'machinery', name: 'Machinery', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'isometric-machinery', generatorName: 'Isometric Machinery', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
