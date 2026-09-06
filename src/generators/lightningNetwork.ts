import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const MODE_OPTIONS = [
  { label: 'Lightning', value: 'lightning' },
  { label: 'Roots', value: 'roots' },
  { label: 'Neural', value: 'neural' },
  { label: 'Cracks', value: 'cracks' },
]

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
}

/**
 * Recursive branching, but jagged rather than tapered/curved — each branch is drawn as several short
 * kinked sub-segments with an independent random turn each, which is what gives it a Lichtenberg-figure
 * look instead of Fractal Tree Sculpture's smooth curvature.
 */
function grow(x: number, y: number, angle: number, length: number, width: number, depth: number, maxDepth: number, jitter: number, branchProbability: number, rng: Rng, out: Segment[]) {
  if (depth > maxDepth || length < 3 || out.length > 3000) return
  const subSegments = 3 + Math.floor(rng.range(0, 3))
  let cx = x
  let cy = y
  let a = angle
  for (let s = 0; s < subSegments; s++) {
    a += rng.range(-jitter, jitter)
    const nx = cx + Math.cos(a) * (length / subSegments)
    const ny = cy + Math.sin(a) * (length / subSegments)
    out.push({ x1: cx, y1: cy, x2: nx, y2: ny, width })
    cx = nx
    cy = ny
  }
  if (depth === maxDepth) return
  grow(cx, cy, a, length * 0.72, width * 0.7, depth + 1, maxDepth, jitter, branchProbability, rng, out)
  if (rng.bool(branchProbability)) {
    const branchAngle = a + rng.sign() * rng.range(0.35, 1.0)
    grow(cx, cy, branchAngle, length * 0.55, width * 0.55, depth + 2, maxDepth, jitter, branchProbability, rng, out)
  }
}

export const lightningNetworkGenerator: GeneratorDefinition = {
  id: 'lightning-network',
  name: 'Lightning Network',
  category: 'organic',
  description: 'A jagged branching bolt — recursive growth like Fractal Tree Sculpture, but kinked at every step instead of smoothly curved.',
  tags: ['branching', 'electric', 'network', 'organic'],
  defaultParameters: {
    mode: 'lightning',
    depth: 9,
    jitter: 0.4,
    branchProbability: 0.4,
    thickness: 3,
  },
  parameterSchema: [
    { key: 'mode', label: 'Mode', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'depth', label: 'Reach', type: 'number', group: 'variation', min: 5, max: 12, step: 1, semantic: 'complexity' },
    { key: 'jitter', label: 'Jaggedness', type: 'number', group: 'variation', min: 0.1, max: 0.8, step: 0.02, semantic: 'jitter' },
    { key: 'branchProbability', label: 'Branch probability', type: 'number', group: 'pattern', min: 0.1, max: 0.7, step: 0.02, semantic: 'density' },
    { key: 'thickness', label: 'Thickness', type: 'number', group: 'color', min: 1, max: 6, step: 0.2 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const mode = String(parameters.mode)
    const maxDepth = Math.round(Number(parameters.depth))
    const jitter = Number(parameters.jitter)
    const branchProbability = Number(parameters.branchProbability)
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']

    // Lightning and roots both start near an edge and must grow INTO the canvas, not out of it —
    // lightning starts near the top and falls downward (angle = +90°), roots does the same (a root
    // system viewed growing down from the surface); only "neural" starts centered, where any direction
    // stays on-canvas for a while.
    const startAngle = mode === 'neural' ? rng.range(0, Math.PI * 2) : Math.PI / 2
    const startY = mode === 'neural' ? HEIGHT / 2 : HEIGHT * 0.05
    const startX = WIDTH / 2
    const effectiveBranch = mode === 'cracks' ? Math.min(0.7, branchProbability + 0.2) : branchProbability
    const effectiveJitter = mode === 'neural' ? jitter * 0.5 : jitter

    const segments: Segment[] = []
    grow(startX, startY, startAngle, HEIGHT * 0.5, thickness, 0, maxDepth, effectiveJitter, effectiveBranch, rng, segments)

    const maxWidth = segments.reduce((m, s) => Math.max(m, s.width), thickness)
    const shapes: StyledShape[] = segments.map((s) => ({
      shape: { kind: 'line', x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 },
      stroke: rng.pick(palette),
      strokeWidth: Math.max(0.4, s.width),
      opacity: 0.7 + (s.width / maxWidth) * 0.3,
    }))

    return {
      id: `lightning-network-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'bolts', name: 'Branches', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'lightning-network', generatorName: 'Lightning Network', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
