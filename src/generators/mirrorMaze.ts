import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const SYMMETRY_OPTIONS = [
  { label: '2-way', value: '2' },
  { label: '4-way', value: '4' },
  { label: '8-way', value: '8' },
  { label: 'Radial', value: 'radial' },
]

interface Wall {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** A real maze via recursive-backtracking wall removal — distinct from every other branching generator
 *  here since it starts from a fully-walled grid and *removes* walls to carve a single connected path
 *  network, rather than growing structure outward from nothing. */
function carveMaze(cols: number, rows: number, rng: Rng): number[][] {
  // removed[r][c] bit 0 = wall to the right removed, bit 1 = wall below removed
  const removed: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0))
  const visited: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false))
  const stack: [number, number][] = [[0, 0]]
  visited[0][0] = true
  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1]
    const neighbors: [number, number, number][] = [] // [nr, nc, wallBit-to-remove-on-current]
    if (c + 1 < cols && !visited[r][c + 1]) neighbors.push([r, c + 1, 0])
    if (r + 1 < rows && !visited[r + 1][c]) neighbors.push([r + 1, c, 1])
    if (c - 1 >= 0 && !visited[r][c - 1]) neighbors.push([r, c - 1, -1])
    if (r - 1 >= 0 && !visited[r - 1][c]) neighbors.push([r - 1, c, -2])
    if (neighbors.length === 0) {
      stack.pop()
      continue
    }
    const [nr, nc, bit] = rng.pick(neighbors)
    if (bit === 0) removed[r][c] |= 1
    else if (bit === 1) removed[r][c] |= 2
    else if (bit === -1) removed[r][nc] |= 1
    else removed[nr][c] |= 2
    visited[nr][nc] = true
    stack.push([nr, nc])
  }
  return removed
}

export const mirrorMazeGenerator: GeneratorDefinition = {
  id: 'mirror-maze',
  name: 'Mirror Maze',
  category: 'optical',
  description: 'A genuine backtracking-carved maze, reflected across multiple axes into a symmetric structure.',
  tags: ['optical', 'maze', 'symmetry', 'geometric'],
  defaultParameters: {
    symmetry: '4',
    complexity: 14,
    segmentLength: 24,
    thickness: 2,
  },
  parameterSchema: [
    { key: 'symmetry', label: 'Symmetry', type: 'select', group: 'composition', options: SYMMETRY_OPTIONS },
    { key: 'complexity', label: 'Maze complexity', type: 'number', group: 'pattern', min: 6, max: 20, step: 1, semantic: 'complexity' },
    { key: 'segmentLength', label: 'Cell size', type: 'number', group: 'shape', min: 14, max: 36, step: 1, semantic: 'scale' },
    { key: 'thickness', label: 'Wall thickness', type: 'number', group: 'color', min: 1, max: 4, step: 0.2 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const symmetry = String(parameters.symmetry)
    const complexity = Math.round(Number(parameters.complexity))
    const cell = Number(parameters.segmentLength)
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']

    const quadrantSize = Math.max(4, Math.floor(complexity))
    const removed = carveMaze(quadrantSize, quadrantSize, rng)

    // Build one quadrant's wall segments (the maze's *missing* walls become open passages, so we draw
    // every wall that was NOT removed).
    const baseWalls: Wall[] = []
    for (let r = 0; r < quadrantSize; r++) {
      for (let c = 0; c < quadrantSize; c++) {
        const bits = removed[r][c]
        const x = c * cell
        const y = r * cell
        if (!(bits & 1) && c + 1 < quadrantSize) baseWalls.push({ x1: x + cell, y1: y, x2: x + cell, y2: y + cell })
        if (!(bits & 2) && r + 1 < quadrantSize) baseWalls.push({ x1: x, y1: y + cell, x2: x + cell, y2: y + cell })
      }
    }
    // Outer border.
    const size = quadrantSize * cell
    baseWalls.push({ x1: 0, y1: 0, x2: size, y2: 0 }, { x1: 0, y1: 0, x2: 0, y2: size })

    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const transforms: ((p: { x: number; y: number }) => { x: number; y: number })[] =
      symmetry === '2'
        ? [(p) => p, (p) => ({ x: 2 * cx - p.x, y: p.y })]
        : symmetry === '8'
          ? [0, 1, 2, 3].flatMap((q) => {
              const rot = (Math.PI / 2) * q
              const cos = Math.cos(rot)
              const sin = Math.sin(rot)
              const rotate = (p: { x: number; y: number }) => ({ x: cx + (p.x - cx) * cos - (p.y - cy) * sin, y: cy + (p.x - cx) * sin + (p.y - cy) * cos })
              return [rotate, (p: { x: number; y: number }) => rotate({ x: 2 * cx - p.x, y: p.y })]
            })
          : symmetry === 'radial'
            ? Array.from({ length: 6 }, (_, i) => {
                const rot = ((Math.PI * 2) / 6) * i
                const cos = Math.cos(rot)
                const sin = Math.sin(rot)
                return (p: { x: number; y: number }) => ({ x: cx + (p.x - cx) * cos - (p.y - cy) * sin, y: cy + (p.x - cx) * sin + (p.y - cy) * cos })
              })
            : [
                (p: { x: number; y: number }) => p,
                (p: { x: number; y: number }) => ({ x: 2 * cx - p.x, y: p.y }),
                (p: { x: number; y: number }) => ({ x: p.x, y: 2 * cy - p.y }),
                (p: { x: number; y: number }) => ({ x: 2 * cx - p.x, y: 2 * cy - p.y }),
              ]

    const shapes: StyledShape[] = []
    for (const t of transforms) {
      const color = rng.pick(palette)
      for (const w of baseWalls) {
        const p1 = t({ x: w.x1 - size / 2 + cx, y: w.y1 - size / 2 + cy })
        const p2 = t({ x: w.x2 - size / 2 + cx, y: w.y2 - size / 2 + cy })
        shapes.push({ shape: { kind: 'line', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, stroke: color, strokeWidth: thickness, opacity: 0.9 })
      }
    }

    return {
      id: `mirror-maze-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'maze', name: 'Mirrored Maze', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'mirror-maze', generatorName: 'Mirror Maze', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
