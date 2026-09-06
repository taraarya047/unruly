import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const TOPOLOGY_OPTIONS = [
  { label: 'Leaf', value: 'leaf' },
  { label: 'Lung', value: 'lung' },
  { label: 'Root', value: 'root' },
]

interface Node {
  x: number
  y: number
  parent: number
  depth: number
}

/**
 * Space colonization (Runions et al.) — the algorithm actually used for realistic vein/leaf-venation
 * generative art, and a genuinely different growth paradigm from every other branching generator here:
 * instead of a fixed recursive rule, a scattered field of "attraction points" pulls the nearest growing
 * tip toward it one small step at a time, and is consumed once reached. The branching pattern is an
 * emergent side effect of the attraction-point layout, not something encoded directly.
 */
function growVeins(bounds: (x: number, y: number) => boolean, attractionCount: number, stepSize: number, influenceRadius: number, killRadius: number, seeds: { x: number; y: number }[], rng: ReturnType<typeof createRng>): Node[] {
  let attractors: { x: number; y: number }[] = []
  let guard = 0
  while (attractors.length < attractionCount && guard < attractionCount * 20) {
    guard++
    const x = rng.range(0, WIDTH)
    const y = rng.range(0, HEIGHT)
    if (bounds(x, y)) attractors.push({ x, y })
  }

  const nodes: Node[] = seeds.map((s) => ({ ...s, parent: -1, depth: 0 }))

  for (let iter = 0; iter < 200 && attractors.length > 0; iter++) {
    const closestNodeFor = new Map<number, { dist: number; dir: { x: number; y: number } }>()
    for (const a of attractors) {
      let bestIdx = -1
      let bestDist = influenceRadius
      for (let ni = 0; ni < nodes.length; ni++) {
        const d = Math.hypot(a.x - nodes[ni].x, a.y - nodes[ni].y)
        if (d < bestDist) {
          bestDist = d
          bestIdx = ni
        }
      }
      if (bestIdx === -1) continue
      const node = nodes[bestIdx]
      const dx = a.x - node.x
      const dy = a.y - node.y
      const len = Math.hypot(dx, dy) || 1
      const existing = closestNodeFor.get(bestIdx)
      if (existing) {
        existing.dir.x += dx / len
        existing.dir.y += dy / len
      } else {
        closestNodeFor.set(bestIdx, { dist: bestDist, dir: { x: dx / len, y: dy / len } })
      }
    }
    if (closestNodeFor.size === 0) break

    const newNodes: Node[] = []
    closestNodeFor.forEach((v, nodeIdx) => {
      const node = nodes[nodeIdx]
      const len = Math.hypot(v.dir.x, v.dir.y) || 1
      newNodes.push({ x: node.x + (v.dir.x / len) * stepSize, y: node.y + (v.dir.y / len) * stepSize, parent: nodeIdx, depth: node.depth + 1 })
    })
    const baseIndex = nodes.length
    nodes.push(...newNodes)

    attractors = attractors.filter((a) => {
      for (let ni = baseIndex; ni < nodes.length; ni++) {
        if (Math.hypot(a.x - nodes[ni].x, a.y - nodes[ni].y) < killRadius) return false
      }
      return true
    })
  }
  return nodes
}

export const organicVeinNetworkGenerator: GeneratorDefinition = {
  id: 'organic-vein-network',
  name: 'Organic Vein Network',
  category: 'organic',
  description: 'Branches that grow toward a field of scattered attraction points, consuming each as they reach it — the algorithm behind real leaf venation, not a recursive rule.',
  tags: ['organic', 'growth', 'branching', 'network', 'biological'],
  defaultParameters: {
    topology: 'leaf',
    density: 400,
    branching: 0.5,
    taper: 0.6,
  },
  parameterSchema: [
    { key: 'topology', label: 'Topology', type: 'select', group: 'shape', options: TOPOLOGY_OPTIONS },
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 150, max: 700, step: 10, semantic: 'density' },
    { key: 'branching', label: 'Branching', type: 'number', group: 'variation', min: 0.2, max: 1, step: 0.02, semantic: 'complexity' },
    { key: 'taper', label: 'Taper', type: 'number', group: 'shape', min: 0.3, max: 0.9, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const topology = String(parameters.topology)
    const density = Math.round(Number(parameters.density))
    const branching = Number(parameters.branching)
    const taper = Number(parameters.taper)
    const palette = colors.length ? colors : ['#3a7d44']

    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const bounds =
      topology === 'leaf'
        ? (x: number, y: number) => Math.pow((x - cx) / (WIDTH * 0.42), 2) + Math.pow((y - cy) / (HEIGHT * 0.46), 2) < 1
        : topology === 'lung'
          ? (x: number, y: number) => Math.hypot(x - cx * 0.6, y - cy) < WIDTH * 0.28 || Math.hypot(x - cx * 1.4, y - cy) < WIDTH * 0.28
          : (x: number, y: number) => y > HEIGHT * 0.15 && Math.pow((x - cx) / (WIDTH * 0.45), 2) + Math.pow((y - HEIGHT * 0.15) / (HEIGHT * 0.85), 2) < 1

    const seeds = topology === 'lung' ? [{ x: cx * 0.6, y: cy }, { x: cx * 1.4, y: cy }] : topology === 'root' ? [{ x: cx, y: HEIGHT * 0.1 }] : [{ x: cx, y: HEIGHT * 0.88 }]

    // Scaled to the average spacing between attraction points (area / density) rather than a fixed
    // constant — too large a radius (relative to that spacing) makes many attractors snap to the same
    // node at once, so they get consumed almost immediately and growth stalls after only a few steps.
    const influenceRadius = 2 * Math.sqrt((WIDTH * HEIGHT) / density)
    const stepSize = influenceRadius * 0.35 * (0.6 + branching * 0.4)
    const killRadius = stepSize * 1.2

    const nodes = growVeins(bounds, density, stepSize, influenceRadius, killRadius, seeds, rng)
    const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 1)

    const shapes: StyledShape[] = []
    for (const node of nodes) {
      if (node.parent === -1) continue
      const parent = nodes[node.parent]
      const t = node.depth / maxDepth
      shapes.push({
        shape: { kind: 'line', x1: parent.x, y1: parent.y, x2: node.x, y2: node.y },
        stroke: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette),
        strokeWidth: Math.max(0.3, 3.5 * Math.pow(1 - t, 1 + taper)),
        opacity: 0.85,
      })
    }

    return {
      id: `organic-vein-network-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'veins', name: 'Vein Network', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'organic-vein-network', generatorName: 'Organic Vein Network', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
