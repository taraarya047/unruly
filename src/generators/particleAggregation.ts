import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const STYLE_OPTIONS = [
  { label: 'Coral', value: 'coral' },
  { label: 'Lightning', value: 'lightning' },
  { label: 'Frost', value: 'frost' },
  { label: 'Tree', value: 'tree' },
]

interface Pt {
  x: number
  y: number
}

/** Spatial hash so "is anything within stickRadius of p" is a handful of lookups, not a scan of the
 *  whole cluster — the classic trick that keeps diffusion-limited aggregation tractable. */
class SpatialHash {
  private cells = new Map<string, Pt[]>()
  private cellSize: number
  constructor(cellSize: number) {
    this.cellSize = cellSize
  }
  private key(x: number, y: number) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`
  }
  add(p: Pt) {
    const k = this.key(p.x, p.y)
    const bucket = this.cells.get(k)
    if (bucket) bucket.push(p)
    else this.cells.set(k, [p])
  }
  nearestWithin(p: Pt, radius: number): boolean {
    const cx = Math.floor(p.x / this.cellSize)
    const cy = Math.floor(p.y / this.cellSize)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = this.cells.get(`${cx + dx},${cy + dy}`)
        if (!bucket) continue
        for (const q of bucket) if (Math.hypot(p.x - q.x, p.y - q.y) < radius) return true
      }
    }
    return false
  }
}

/** Real diffusion-limited aggregation: each new particle random-walks in from the boundary until it
 *  touches the existing cluster, then freezes in place. Branchy, coral/frost-like structures emerge
 *  from that rule alone — nothing about the branching itself is hard-coded. */
function growDLA(maxParticles: number, stickRadius: number, stickiness: number, bias: { x: number; y: number } | null, rng: Rng): Pt[] {
  const center = { x: WIDTH / 2, y: HEIGHT / 2 }
  const cluster: Pt[] = [center]
  const hash = new SpatialHash(stickRadius * 2)
  hash.add(center)
  const stepSize = stickRadius * 0.8
  const maxClusterRadius = WIDTH * 0.45
  // The spawn ring must expand as the cluster grows, or particles start spawning inside the existing
  // structure and stick almost instantly — the tight-ball artifact that a fixed spawn radius produces.
  let clusterRadius = 0

  for (let n = 0; n < maxParticles; n++) {
    if (clusterRadius > maxClusterRadius) break
    const spawnRadius = clusterRadius + 30
    const maxWander = spawnRadius + 60
    const angle = rng.range(0, Math.PI * 2)
    let p = { x: center.x + Math.cos(angle) * spawnRadius, y: center.y + Math.sin(angle) * spawnRadius }
    let stuck = false
    for (let step = 0; step < 500; step++) {
      p = {
        x: p.x + rng.range(-1, 1) * stepSize + (bias?.x ?? 0),
        y: p.y + rng.range(-1, 1) * stepSize + (bias?.y ?? 0),
      }
      if (Math.hypot(p.x - center.x, p.y - center.y) > maxWander) break
      if (hash.nearestWithin(p, stickRadius) && rng.bool(stickiness)) {
        stuck = true
        break
      }
    }
    if (stuck) {
      clusterRadius = Math.max(clusterRadius, Math.hypot(p.x - center.x, p.y - center.y))
      cluster.push(p)
      hash.add(p)
    }
  }
  return cluster
}

export const particleAggregationGenerator: GeneratorDefinition = {
  id: 'particle-aggregation',
  name: 'Particle Aggregation',
  category: 'organic',
  description: 'Diffusion-limited aggregation — particles wander in at random and freeze the instant they touch the growing cluster, the same process behind real coral and frost.',
  tags: ['organic', 'growth', 'branching', 'simulation', 'dla'],
  defaultParameters: {
    style: 'coral',
    particles: 500,
    stickiness: 0.85,
    branchiness: 0.5,
  },
  parameterSchema: [
    { key: 'style', label: 'Style', type: 'select', group: 'shape', options: STYLE_OPTIONS },
    { key: 'particles', label: 'Growth', type: 'number', group: 'pattern', min: 100, max: 900, step: 20, semantic: 'density' },
    { key: 'stickiness', label: 'Stickiness', type: 'number', group: 'variation', min: 0.2, max: 1, step: 0.02 },
    { key: 'branchiness', label: 'Branchiness', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'complexity' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const style = String(parameters.style)
    const particleCount = Math.round(Number(parameters.particles))
    const stickiness = Number(parameters.stickiness)
    const branchiness = Number(parameters.branchiness)
    const palette = colors.length ? colors : ['#111111']

    // Higher branchiness -> smaller stick radius relative to step size, the real DLA lever for
    // sparse/branchy versus dense/blobby growth.
    const stickRadius = 10 - branchiness * 5
    const bias = style === 'lightning' ? { x: 0, y: -1.5 } : style === 'tree' ? { x: 0, y: -0.8 } : null

    const cluster = growDLA(particleCount, stickRadius, stickiness, bias, rng)

    const shapes: StyledShape[] = cluster.map((p, i) => {
      const t = i / cluster.length
      return {
        shape: { kind: 'circle', cx: p.x, cy: p.y, r: style === 'frost' ? 1.4 : 1.8 },
        fill: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette),
        opacity: rng.range(0.8, 1),
      }
    })

    return {
      id: `particle-aggregation-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'cluster', name: 'Aggregated Cluster', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'particle-aggregation', generatorName: 'Particle Aggregation', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
