import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800
const GRID_SIZE = 70

const RULE_OPTIONS = [
  { label: 'Life', value: 'life' },
  { label: 'Seeds', value: 'seeds' },
  { label: 'HighLife', value: 'highlife' },
  { label: 'Maze', value: 'maze' },
]

// Outer-totalistic birth/survive rule sets — a cell is born with `birth` live neighbors, an already-live
// cell survives with `survive` live neighbors, everything else dies. This is what makes it a genuine
// cellular automaton (the grid actually evolves generation to generation) rather than a static pattern.
const RULES: Record<string, { birth: Set<number>; survive: Set<number> }> = {
  life: { birth: new Set([3]), survive: new Set([2, 3]) },
  seeds: { birth: new Set([2]), survive: new Set() },
  highlife: { birth: new Set([3, 6]), survive: new Set([2, 3]) },
  maze: { birth: new Set([3]), survive: new Set([1, 2, 3, 4, 5]) },
}

function step(grid: boolean[][], rule: { birth: Set<number>; survive: Set<number> }): boolean[][] {
  const size = grid.length
  const next: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let neighbors = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const rr = (r + dr + size) % size
          const cc = (c + dc + size) % size
          if (grid[rr][cc]) neighbors++
        }
      }
      next[r][c] = grid[r][c] ? rule.survive.has(neighbors) : rule.birth.has(neighbors)
    }
  }
  return next
}

export const cellularAutomataGenerator: GeneratorDefinition = {
  id: 'cellular-automata',
  name: 'Cellular Automata',
  category: 'mathematical',
  description: 'A real cellular automaton, run forward from a random seed — every cell in the final grid is the actual outcome of that many generations of birth/survival rules.',
  tags: ['mathematical', 'simulation', 'grid', 'emergent'],
  defaultParameters: {
    rule: 'life',
    initialDensity: 0.35,
    generations: 24,
  },
  parameterSchema: [
    { key: 'rule', label: 'Rule', type: 'select', group: 'shape', options: RULE_OPTIONS },
    { key: 'initialDensity', label: 'Initial density', type: 'number', group: 'pattern', min: 0.15, max: 0.55, step: 0.01, semantic: 'density' },
    { key: 'generations', label: 'Generations', type: 'number', group: 'variation', min: 4, max: 60, step: 1, semantic: 'complexity' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const ruleName = String(parameters.rule)
    const initialDensity = Number(parameters.initialDensity)
    const generations = Math.round(Number(parameters.generations))
    const palette = colors.length ? colors : ['#111111']
    const rule = RULES[ruleName] ?? RULES.life

    let grid: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => rng.bool(initialDensity)))
    for (let g = 0; g < generations; g++) grid = step(grid, rule)

    const cell = WIDTH / GRID_SIZE
    const shapes: StyledShape[] = []
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!grid[r][c]) continue
        shapes.push({
          shape: { kind: 'rect', x: c * cell, y: r * cell, w: cell * 0.92, h: cell * 0.92 },
          fill: rng.pick(palette),
          opacity: rng.range(0.85, 1),
        })
      }
    }

    return {
      id: `cellular-automata-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'cells', name: 'Cell Grid', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'cellular-automata', generatorName: 'Cellular Automata', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
