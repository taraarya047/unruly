import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800
const GRID = 55

// Axial hex neighbor offsets (pointy-top hex grid), used both for the six-fold growth and for drawing.
const NEIGHBORS = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
]

/**
 * An anisotropic growth-front automaton on a hex lattice: each step, every open cell touching the
 * existing ice has a chance to freeze, weighted so cells with fewer frozen neighbors (exposed branch
 * tips) freeze far more readily than cells with several frozen neighbors (concave notches getting
 * filled in) — that bias toward tips over infill is what produces dendritic arms instead of a solid
 * blob, the same qualitative asymmetry real dendritic solidification shows. Growth only ever proceeds
 * outward from the current frontier one ring at a time, which keeps it easy to reason about (bounded,
 * monotonic, no runaway feedback) compared to a diffusion-based vapor model.
 */
function growSnowflake(density: number, threshold: number, gridSize: number, rng: ReturnType<typeof createRng>): number[][] {
  const frozen: boolean[][] = Array.from({ length: gridSize }, () => new Array(gridSize).fill(false))
  const inBounds = (q: number, r: number) => q >= 0 && q < gridSize && r >= 0 && r < gridSize
  const center = Math.floor(gridSize / 2)
  frozen[center][center] = true

  let frontier = new Set<string>()
  for (const [dq, dr] of NEIGHBORS) {
    const nq = center + dq
    const nr = center + dr
    if (inBounds(nq, nr)) frontier.add(`${nq},${nr}`)
  }

  const maxCells = Math.round(gridSize * gridSize * 0.55)
  let frozenCount = 1
  let iterations = 0
  while (frontier.size > 0 && frozenCount < maxCells && iterations < 400) {
    iterations++
    const toFreeze: string[] = []
    for (const key of frontier) {
      const [q, r] = key.split(',').map(Number)
      let neighborFrozen = 0
      for (const [dq, dr] of NEIGHBORS) {
        const nq = q + dq
        const nr = r + dr
        if (inBounds(nq, nr) && frozen[nr][nq]) neighborFrozen++
      }
      if (neighborFrozen === 0) continue
      // Exposed tips (1 frozen neighbor) freeze at close to `density`; cells boxed in by several
      // frozen neighbors freeze much more rarely as `threshold` increases — the tip-favoring bias.
      const p = Math.min(1, density * Math.pow(1 / neighborFrozen, threshold))
      if (rng.bool(p)) toFreeze.push(key)
    }
    for (const key of toFreeze) {
      const [q, r] = key.split(',').map(Number)
      frozen[r][q] = true
      frozenCount++
      frontier.delete(key)
      for (const [dq, dr] of NEIGHBORS) {
        const nq = q + dq
        const nr = r + dr
        if (inBounds(nq, nr) && !frozen[nr][nq]) frontier.add(`${nq},${nr}`)
      }
    }
  }
  return frozen.map((row) => row.map((f) => (f ? 1 : 0.05)))
}

export const crystallineCellularSystemGenerator: GeneratorDefinition = {
  id: 'crystalline-cellular-system',
  name: 'Crystalline Cellular System',
  category: 'organic',
  description: 'A hexagonal growth-front automaton — exposed branch tips freeze far more readily than concave notches, the same bias that gives real dendritic snow crystals their branching arms.',
  tags: ['organic', 'simulation', 'crystal', 'emergent', 'cellular'],
  defaultParameters: {
    density: 0.4,
    threshold: 1,
    cellSize: 12,
  },
  parameterSchema: [
    { key: 'density', label: 'Growth rate', type: 'number', group: 'variation', min: 0.2, max: 0.7, step: 0.01, semantic: 'density' },
    { key: 'threshold', label: 'Branchiness', type: 'number', group: 'variation', min: 0.6, max: 1.6, step: 0.02, semantic: 'complexity' },
    { key: 'cellSize', label: 'Cell size', type: 'number', group: 'shape', min: 6, max: 18, step: 1, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const density = Number(parameters.density)
    const threshold = Number(parameters.threshold)
    const cellSize = Number(parameters.cellSize)
    const palette = colors.length ? colors : ['#a8e6f0']

    const gridSize = Math.min(GRID, Math.max(30, Math.round((WIDTH * 0.8) / (cellSize * 1.5))))
    const field = growSnowflake(density, threshold, gridSize, rng)

    const hexW = cellSize * Math.sqrt(3)
    const hexH = cellSize * 1.5
    const originX = WIDTH / 2 - (gridSize / 2) * hexW
    const originY = HEIGHT / 2 - (gridSize / 2) * hexH

    const shapes: StyledShape[] = []
    for (let r = 0; r < gridSize; r++) {
      for (let q = 0; q < gridSize; q++) {
        const v = field[r][q]
        if (v < 0.05) continue
        const x = originX + q * hexW + (r % 2 !== 0 ? hexW / 2 : 0)
        const y = originY + r * hexH
        const points: string[] = []
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 180) * (60 * i)
          points.push(`${(x + Math.cos(angle) * cellSize * v).toFixed(1)},${(y + Math.sin(angle) * cellSize * v).toFixed(1)}`)
        }
        shapes.push({
          shape: { kind: 'path', d: `M ${points.join(' L ')} Z` },
          fill: palette[Math.floor(Math.min(1, v) * (palette.length - 0.001))] ?? rng.pick(palette),
          opacity: Math.min(1, 0.4 + v * 0.6),
        })
      }
    }

    return {
      id: `crystalline-cellular-system-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'crystal', name: 'Crystalline Structure', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'crystalline-cellular-system', generatorName: 'Crystalline Cellular System', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
