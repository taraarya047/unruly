import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  depth: number
}

/** Snaps an angle toward the nearest 90° increment by `organicity` — 0 is pure Circuit Board (always
 *  orthogonal), 1 is pure organic branching (angle never snaps), and values between blend continuously. */
function blendAngle(angle: number, organicity: number): number {
  const snapped = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2)
  return snapped + (angle - snapped) * organicity
}

function grow(x: number, y: number, angle: number, length: number, depth: number, maxDepth: number, organicity: number, branchProbability: number, rng: Rng, out: Segment[]) {
  if (depth > maxDepth || length < 4 || out.length > 2500) return
  const a = blendAngle(angle + rng.range(-0.3, 0.3) * organicity, organicity)
  const nx = x + Math.cos(a) * length
  const ny = y + Math.sin(a) * length
  out.push({ x1: x, y1: y, x2: nx, y2: ny, depth })
  if (depth === maxDepth) return
  grow(nx, ny, a, length * 0.78, depth + 1, maxDepth, organicity, branchProbability, rng, out)
  if (rng.bool(branchProbability)) {
    const branchAngle = a + rng.sign() * (Math.PI / 2) * (0.5 + organicity * 0.5)
    grow(nx, ny, branchAngle, length * 0.65, depth + 1, maxDepth, organicity, branchProbability, rng, out)
  }
}

export const circuitOrganismGenerator: GeneratorDefinition = {
  id: 'circuit-organism',
  name: 'Circuit Organism',
  category: 'illustrative',
  description: 'Branching that blends orthogonal PCB traces with organic curvature — one growth rule, with a single dial between "printed circuit" and "living tissue."',
  tags: ['hybrid', 'circuit', 'organic', 'branching', 'technical'],
  defaultParameters: {
    organicity: 0.5,
    depth: 9,
    branchProbability: 0.4,
    seedCount: 3,
  },
  parameterSchema: [
    { key: 'organicity', label: 'Organicity', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
    { key: 'depth', label: 'Growth', type: 'number', group: 'variation', min: 5, max: 12, step: 1, semantic: 'complexity' },
    { key: 'branchProbability', label: 'Branch density', type: 'number', group: 'pattern', min: 0.1, max: 0.6, step: 0.02, semantic: 'density' },
    { key: 'seedCount', label: 'Seed points', type: 'number', group: 'composition', min: 1, max: 5, step: 1, advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const organicity = Number(parameters.organicity)
    const maxDepth = Math.round(Number(parameters.depth))
    const branchProbability = Number(parameters.branchProbability)
    const seedCount = Math.round(Number(parameters.seedCount))
    const palette = colors.length ? colors : ['#3ddc84']

    const segments: Segment[] = []
    for (let i = 0; i < seedCount; i++) {
      const start = { x: rng.range(WIDTH * 0.25, WIDTH * 0.75), y: rng.range(HEIGHT * 0.25, HEIGHT * 0.75) }
      const angle = rng.range(0, Math.PI * 2)
      grow(start.x, start.y, angle, WIDTH * 0.16, 0, maxDepth, organicity, branchProbability, rng, segments)
    }

    const maxD = segments.reduce((m, s) => Math.max(m, s.depth), 1)
    const shapes: StyledShape[] = []
    for (const s of segments) {
      const t = s.depth / maxD
      const color = palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette)
      shapes.push({ shape: { kind: 'line', x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }, stroke: color, strokeWidth: Math.max(0.6, 3.2 * (1 - t)), opacity: 0.85 })
      // Circuit-style via dots at joints, sized down as organicity increases toward a purely organic look.
      shapes.push({ shape: { kind: 'circle', cx: s.x2, cy: s.y2, r: Math.max(0.8, 2.2 * (1 - organicity) * (1 - t * 0.5)) }, fill: color, opacity: 0.9 })
    }

    return {
      id: `circuit-organism-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'organism', name: 'Circuit Organism', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'circuit-organism', generatorName: 'Circuit Organism', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
