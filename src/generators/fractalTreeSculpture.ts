import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const STYLE_OPTIONS = [
  { label: 'Winter tree', value: 'winter' },
  { label: 'Coral', value: 'coral' },
  { label: 'Lightning', value: 'lightning' },
  { label: 'Roots', value: 'roots' },
  { label: 'Cosmic tree', value: 'cosmic' },
]

interface BranchParams {
  spread: number
  taper: number
  widthTaper: number
  gravity: number
  wind: number
  asymmetry: number
  jitter: number
}

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  depthT: number
}

/**
 * Recursive branch drawing — deliberately a different technique from the L-System Forest generator
 * (grammar rewriting + turtle interpretation): each call directly computes one branch's endpoint and
 * spawns 2-3 children with taper, gravity bend, and wind, closer to how real growth simulations work.
 */
function branch(x: number, y: number, angle: number, length: number, width: number, depth: number, maxDepth: number, params: BranchParams, rng: Rng, out: Segment[]) {
  if (depth > maxDepth || length < 3 || out.length > 6000) return
  const bent = angle + params.gravity * (Math.PI / 2 - angle) * 0.08 + params.wind * (depth / maxDepth) * 0.3
  const x2 = x + Math.cos(bent) * length
  const y2 = y + Math.sin(bent) * length
  out.push({ x1: x, y1: y, x2, y2, width, depthT: depth / maxDepth })
  if (depth === maxDepth) return

  const childCount = rng.bool(0.25) ? 3 : 2
  for (let i = 0; i < childCount; i++) {
    const side = i === 0 ? -1 : i === 1 ? 1 : 0
    const asym = side !== 0 ? params.asymmetry * side : 0
    const childAngle = bent + side * params.spread + asym + rng.range(-params.jitter, params.jitter)
    branch(x2, y2, childAngle, length * params.taper, width * params.widthTaper, depth + 1, maxDepth, params, rng, out)
  }
}

export const fractalTreeSculptureGenerator: GeneratorDefinition = {
  id: 'fractal-tree-sculpture',
  name: 'Fractal Tree Sculpture',
  category: 'organic',
  description: 'Branching structures grown segment by segment, with taper, gravity, and wind — a direct recursive alternative to grammar-based trees.',
  tags: ['fractal', 'organic', 'recursive', 'branching', 'growth'],
  defaultParameters: {
    style: 'winter',
    depth: 9,
    spread: 0.5,
    taper: 0.78,
    gravity: 0.2,
    wind: 0.15,
    asymmetry: 0.1,
    jitter: 0.08,
  },
  parameterSchema: [
    { key: 'style', label: 'Style', type: 'select', group: 'shape', options: STYLE_OPTIONS },
    { key: 'depth', label: 'Growth', type: 'number', group: 'variation', min: 4, max: 12, step: 1, semantic: 'complexity' },
    { key: 'spread', label: 'Branch angle', type: 'angle', group: 'shape', min: 0.15, max: 1.1, step: 0.01, semantic: 'rotation' },
    { key: 'taper', label: 'Taper', type: 'number', group: 'shape', min: 0.6, max: 0.9, step: 0.01 },
    { key: 'gravity', label: 'Gravity', type: 'number', group: 'variation', min: -0.6, max: 0.6, step: 0.02 },
    { key: 'wind', label: 'Wind', type: 'number', group: 'variation', min: 0, max: 0.6, step: 0.02, semantic: 'jitter' },
    { key: 'asymmetry', label: 'Asymmetry', type: 'number', group: 'variation', min: 0, max: 0.5, step: 0.01 },
    { key: 'jitter', label: 'Randomness', type: 'number', group: 'variation', min: 0, max: 0.3, step: 0.01, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const style = String(parameters.style)
    const maxDepth = Math.round(Number(parameters.depth))
    const params: BranchParams = {
      spread: Number(parameters.spread),
      taper: Number(parameters.taper),
      widthTaper: 0.72,
      gravity: style === 'roots' ? -Math.abs(Number(parameters.gravity)) - 0.3 : Number(parameters.gravity),
      wind: Number(parameters.wind),
      asymmetry: Number(parameters.asymmetry),
      jitter: Number(parameters.jitter),
    }
    const palette = colors.length ? colors : ['#4a3728']

    const startAngle = style === 'roots' ? Math.PI / 2 : -Math.PI / 2
    const startY = style === 'roots' ? HEIGHT * 0.15 : HEIGHT * 0.92
    const startWidth = style === 'lightning' ? 3 : 7
    const startLength = HEIGHT * (style === 'cosmic' ? 0.16 : 0.2)

    const segments: Segment[] = []
    branch(WIDTH / 2, startY, startAngle, startLength, startWidth, 0, maxDepth, params, rng, segments)

    const shapes: StyledShape[] = segments.map((s) => ({
      shape: { kind: 'line', x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 },
      stroke: palette[Math.floor(s.depthT * (palette.length - 0.001))] ?? rng.pick(palette),
      strokeWidth: Math.max(0.4, s.width),
      opacity: style === 'cosmic' ? 0.5 + (1 - s.depthT) * 0.5 : 0.85 + s.depthT * 0.15,
    }))

    return {
      id: `fractal-tree-sculpture-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'branches', name: 'Branches', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'fractal-tree-sculpture', generatorName: 'Fractal Tree Sculpture', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
