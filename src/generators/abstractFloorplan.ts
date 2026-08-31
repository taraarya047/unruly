import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800
const MAX_ROOMS = 200

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

function split(rect: Rect, depth: number, corridorWidth: number, rng: Rng, out: Rect[]) {
  if (out.length >= MAX_ROOMS) return
  const tooSmall = rect.w < 60 || rect.h < 60
  if (depth <= 0 || tooSmall) {
    out.push(rect)
    return
  }
  const splitVertical = rect.w > rect.h ? rng.bool(0.75) : rng.bool(0.25)
  const ratio = rng.range(0.35, 0.65)
  if (splitVertical) {
    const w1 = rect.w * ratio - corridorWidth / 2
    const w2 = rect.w * (1 - ratio) - corridorWidth / 2
    split({ x: rect.x, y: rect.y, w: w1, h: rect.h }, depth - 1, corridorWidth, rng, out)
    split({ x: rect.x + rect.w - w2, y: rect.y, w: w2, h: rect.h }, depth - 1, corridorWidth, rng, out)
  } else {
    const h1 = rect.h * ratio - corridorWidth / 2
    const h2 = rect.h * (1 - ratio) - corridorWidth / 2
    split({ x: rect.x, y: rect.y, w: rect.w, h: h1 }, depth - 1, corridorWidth, rng, out)
    split({ x: rect.x, y: rect.y + rect.h - h2, w: rect.w, h: h2 }, depth - 1, corridorWidth, rng, out)
  }
}

export const abstractFloorplanGenerator: GeneratorDefinition = {
  id: 'abstract-floorplan',
  name: 'Abstract Floorplan',
  category: 'architectural',
  description: 'A recursively subdivided floorplan of rooms and corridors.',
  tags: ['architecture', 'rooms', 'blueprint', 'geometric'],
  defaultParameters: {
    depth: 5,
    corridorWidth: 14,
    wallWidth: 2,
    margin: 40,
  },
  parameterSchema: [
    { key: 'depth', label: 'Room count', type: 'number', group: 'pattern', min: 2, max: 8, step: 1, semantic: 'density' },
    { key: 'corridorWidth', label: 'Corridor width', type: 'number', group: 'shape', min: 4, max: 30, step: 1 },
    { key: 'wallWidth', label: 'Wall thickness', type: 'number', group: 'color', min: 0.5, max: 5, step: 0.5 },
    { key: 'margin', label: 'Outer margin', type: 'number', group: 'composition', min: 0, max: 100, step: 5, advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const depth = Math.round(Number(parameters.depth))
    const corridorWidth = Number(parameters.corridorWidth)
    const wallWidth = Number(parameters.wallWidth)
    const margin = Number(parameters.margin)
    const palette = colors.length ? colors : ['#111111']

    const rooms: Rect[] = []
    split({ x: margin, y: margin, w: WIDTH - margin * 2, h: HEIGHT - margin * 2 }, depth, corridorWidth, rng, rooms)

    const shapes: StyledShape[] = rooms
      .filter((r) => r.w > 4 && r.h > 4)
      .map((r) => ({
        shape: { kind: 'rect', x: r.x, y: r.y, w: r.w, h: r.h },
        fill: rng.pick(palette),
        stroke: '#00000055',
        strokeWidth: wallWidth,
        opacity: rng.range(0.7, 1),
      }))

    return {
      id: `abstract-floorplan-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'rooms', name: 'Rooms', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'abstract-floorplan', generatorName: 'Abstract Floorplan', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
