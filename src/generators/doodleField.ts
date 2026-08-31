import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

type Point = { x: number; y: number }

function transform(points: Point[], cx: number, cy: number, scale: number, rotation: number): Point[] {
  return points.map((p) => ({
    x: cx + (p.x * Math.cos(rotation) - p.y * Math.sin(rotation)) * scale,
    y: cy + (p.x * Math.sin(rotation) + p.y * Math.cos(rotation)) * scale,
  }))
}

function toPath(points: Point[], closed = false): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${round(p.x)} ${round(p.y)}`).join(' ') + (closed ? ' Z' : '')
}

const DOODLES: Record<string, (rng: Rng) => Point[]> = {
  star: () => {
    const pts: Point[] = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.45
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
    }
    return pts
  },
  spiral: (rng) => {
    const pts: Point[] = []
    const turns = rng.range(1.5, 2.5)
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const a = t * turns * Math.PI * 2
      const r = t
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
    }
    return pts
  },
  cross: () => [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ],
  wave: () => {
    const pts: Point[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      pts.push({ x: t * 2 - 1, y: Math.sin(t * Math.PI * 3) * 0.35 })
    }
    return pts
  },
  scribble: (rng) => {
    const pts: Point[] = [{ x: 0, y: 0 }]
    let x = 0
    let y = 0
    for (let i = 0; i < 8; i++) {
      x += rng.range(-0.5, 0.5)
      y += rng.range(-0.5, 0.5)
      pts.push({ x, y })
    }
    return pts
  },
  loop: (rng) => {
    const pts: Point[] = []
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2
      const wobble = 1 + Math.sin(a * 3 + rng.range(0, 6)) * 0.15
      pts.push({ x: Math.cos(a) * wobble, y: Math.sin(a) * wobble })
    }
    return pts
  },
}

const DOODLE_NAMES = Object.keys(DOODLES)

export const doodleFieldGenerator: GeneratorDefinition = {
  id: 'doodle-field',
  name: 'Doodle Field',
  category: 'playful',
  description: 'Hand-drawn-feeling marks — stars, spirals, scribbles — scattered like a margin full of doodles.',
  tags: ['doodle', 'hand-drawn', 'playful', 'sketch'],
  defaultParameters: {
    density: 40,
    size: 30,
    strokeWidth: 2.5,
    variation: 0.5,
  },
  parameterSchema: [
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 10, max: 90, step: 1, semantic: 'density' },
    { key: 'size', label: 'Size', type: 'number', group: 'shape', min: 10, max: 60, step: 1, semantic: 'size' },
    { key: 'strokeWidth', label: 'Stroke width', type: 'number', group: 'color', min: 1, max: 5, step: 0.25 },
    { key: 'variation', label: 'Scale variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const density = Math.round(Number(parameters.density))
    const size = Number(parameters.size)
    const strokeWidth = Number(parameters.strokeWidth)
    const variation = Number(parameters.variation)
    const palette = colors.length ? colors : ['#111111']

    const shapes: StyledShape[] = []
    for (let i = 0; i < density; i++) {
      const cx = rng.range(size, WIDTH - size)
      const cy = rng.range(size, HEIGHT - size)
      const kind = rng.pick(DOODLE_NAMES)
      const local = DOODLES[kind](rng)
      const scale = size * (1 + rng.range(-variation, variation))
      const rotation = rng.range(0, Math.PI * 2)
      const points = transform(local, cx, cy, scale, rotation)
      shapes.push({
        shape: { kind: 'path', d: toPath(points, kind === 'star' || kind === 'loop') },
        stroke: rng.pick(palette),
        strokeWidth,
        fill: 'none',
        opacity: rng.range(0.7, 1),
      })
    }

    return {
      id: `doodle-field-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'doodles', name: 'Doodles', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'doodle-field', generatorName: 'Doodle Field', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
