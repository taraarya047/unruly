import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800
const MAX_SEGMENTS = 3000

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  depth: number
}

interface Tip {
  x: number
  y: number
  angle: number
  depth: number
}

/** Same collision-halting trick as diffusion-limited aggregation, reused for a very different growth
 *  rule: branches only turn in multiples of the lattice angle (60° for hexagonal, 90° for cubic), which
 *  is what makes the result read as crystalline rather than organic. */
class SegmentHash {
  private cells = new Map<string, { x: number; y: number }[]>()
  private cellSize: number
  constructor(cellSize: number) {
    this.cellSize = cellSize
  }
  private key(x: number, y: number) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`
  }
  add(p: { x: number; y: number }) {
    const k = this.key(p.x, p.y)
    const bucket = this.cells.get(k)
    if (bucket) bucket.push(p)
    else this.cells.set(k, [p])
  }
  within(p: { x: number; y: number }, radius: number, ignoreLast: { x: number; y: number }): boolean {
    const cx = Math.floor(p.x / this.cellSize)
    const cy = Math.floor(p.y / this.cellSize)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = this.cells.get(`${cx + dx},${cy + dy}`)
        if (!bucket) continue
        for (const q of bucket) {
          if (q === ignoreLast) continue
          if (Math.hypot(p.x - q.x, p.y - q.y) < radius) return true
        }
      }
    }
    return false
  }
}

export const crystalGrowthGenerator: GeneratorDefinition = {
  id: 'crystal-growth',
  name: 'Crystal Growth',
  category: 'organic',
  description: 'Branches that can only turn in lattice-angle steps and halt the instant they near another branch — the same growth-and-collision rule as real mineral crystals.',
  tags: ['organic', 'growth', 'branching', 'geometric', 'lattice'],
  defaultParameters: {
    seedCount: 3,
    lattice: 60,
    growthRate: 0.7,
    branchProbability: 0.35,
    thickness: 1.4,
  },
  parameterSchema: [
    { key: 'seedCount', label: 'Seed points', type: 'number', group: 'composition', min: 1, max: 6, step: 1, advanced: true },
    { key: 'lattice', label: 'Lattice angle', type: 'select', group: 'shape', options: [{ label: 'Hexagonal (60°)', value: '60' }, { label: 'Cubic (90°)', value: '90' }] },
    { key: 'growthRate', label: 'Growth rate', type: 'number', group: 'variation', min: 0.3, max: 1, step: 0.02, semantic: 'complexity' },
    { key: 'branchProbability', label: 'Branchiness', type: 'number', group: 'variation', min: 0.1, max: 0.6, step: 0.02 },
    { key: 'thickness', label: 'Thickness', type: 'number', group: 'color', min: 0.5, max: 3, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng: Rng = createRng(seed)
    const seedCount = Math.round(Number(parameters.seedCount))
    const latticeDeg = Number(parameters.lattice)
    const latticeRad = (latticeDeg * Math.PI) / 180
    const growthRate = Number(parameters.growthRate)
    const branchProbability = Number(parameters.branchProbability)
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#7fd4e0']

    const stepLength = 10 + growthRate * 8
    const collisionRadius = stepLength * 0.9
    const hash = new SegmentHash(collisionRadius * 2)
    const segments: Segment[] = []

    let tips: Tip[] = Array.from({ length: seedCount }, () => {
      const p = { x: rng.range(WIDTH * 0.3, WIDTH * 0.7), y: rng.range(HEIGHT * 0.3, HEIGHT * 0.7) }
      hash.add(p)
      return { ...p, angle: Math.round(rng.range(0, 5)) * latticeRad, depth: 0 }
    })

    let iterations = 0
    while (tips.length > 0 && segments.length < MAX_SEGMENTS && iterations < 4000) {
      iterations++
      const nextTips: Tip[] = []
      for (const tip of tips) {
        const nx = tip.x + Math.cos(tip.angle) * stepLength
        const ny = tip.y + Math.sin(tip.angle) * stepLength
        if (nx < 0 || nx > WIDTH || ny < 0 || ny > HEIGHT) continue
        if (hash.within({ x: nx, y: ny }, collisionRadius, { x: tip.x, y: tip.y })) continue

        segments.push({ x1: tip.x, y1: tip.y, x2: nx, y2: ny, depth: tip.depth })
        hash.add({ x: nx, y: ny })
        nextTips.push({ x: nx, y: ny, angle: tip.angle, depth: tip.depth + 1 })
        if (rng.bool(branchProbability)) {
          const turn = rng.bool(0.5) ? latticeRad : -latticeRad
          nextTips.push({ x: nx, y: ny, angle: tip.angle + turn, depth: tip.depth + 1 })
        }
      }
      tips = nextTips
    }

    const maxDepth = segments.reduce((m, s) => Math.max(m, s.depth), 1)
    const shapes: StyledShape[] = segments.map((s) => {
      const t = s.depth / maxDepth
      return {
        shape: { kind: 'line', x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 },
        stroke: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette),
        strokeWidth: Math.max(0.4, thickness * (1 - t * 0.6)),
        opacity: 0.85,
      }
    })

    return {
      id: `crystal-growth-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'crystal', name: 'Crystal Structure', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'crystal-growth', generatorName: 'Crystal Growth', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
