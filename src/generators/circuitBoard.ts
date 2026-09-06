import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

interface Pt {
  x: number
  y: number
}

/** A Manhattan-routed trace: every step moves purely horizontally or vertically, and consecutive steps
 *  prefer to keep going the same direction — the orthogonal-only movement is what reads as a PCB trace
 *  rather than an organic line. */
function routeTrace(start: Pt, grid: number, steps: number, turnProbability: number, rng: Rng): Pt[] {
  const points: Pt[] = [start]
  let { x, y } = start
  let dir: [number, number] = rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
  for (let i = 0; i < steps; i++) {
    if (rng.bool(turnProbability)) {
      dir = rng.bool(0.5) ? [dir[1], -dir[0]] : [-dir[1], dir[0]]
    }
    x = Math.max(grid, Math.min(WIDTH - grid, x + dir[0] * grid))
    y = Math.max(grid, Math.min(HEIGHT - grid, y + dir[1] * grid))
    points.push({ x, y })
  }
  return points
}

export const circuitBoardGenerator: GeneratorDefinition = {
  id: 'circuit-board',
  name: 'Circuit Board',
  category: 'texture',
  description: 'Orthogonal traces, pads, and chips laid out like a real PCB — every trace moves in straight horizontal/vertical runs, never a diagonal or a curve.',
  tags: ['technical', 'circuit', 'texture', 'grid'],
  defaultParameters: {
    traceCount: 26,
    gridSize: 20,
    complexity: 0.5,
    componentDensity: 0.5,
  },
  parameterSchema: [
    { key: 'traceCount', label: 'Traces', type: 'number', group: 'pattern', min: 8, max: 50, step: 1, semantic: 'density' },
    { key: 'gridSize', label: 'Grid size', type: 'number', group: 'shape', min: 12, max: 34, step: 1, semantic: 'scale' },
    { key: 'complexity', label: 'Turn frequency', type: 'number', group: 'variation', min: 0.05, max: 0.6, step: 0.02, semantic: 'complexity' },
    { key: 'componentDensity', label: 'Component density', type: 'number', group: 'variation', min: 0.1, max: 1, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const traceCount = Math.round(Number(parameters.traceCount))
    const gridSize = Number(parameters.gridSize)
    const turnProbability = Number(parameters.complexity)
    const componentDensity = Number(parameters.componentDensity)
    const palette = colors.length ? colors : ['#3ddc84']

    const shapes: StyledShape[] = []

    // A handful of larger "chips" anchor the composition first, so traces read as connecting real
    // components rather than wandering aimlessly.
    const chips: Pt[] = []
    const chipCount = Math.max(2, Math.round(3 + componentDensity * 4))
    for (let i = 0; i < chipCount; i++) {
      const x = Math.round(rng.range(2, WIDTH / gridSize - 6)) * gridSize
      const y = Math.round(rng.range(2, HEIGHT / gridSize - 6)) * gridSize
      const w = gridSize * Math.round(rng.range(2, 5))
      const h = gridSize * Math.round(rng.range(2, 5))
      chips.push({ x: x + w / 2, y: y + h / 2 })
      shapes.push({ shape: { kind: 'rect', x, y, w, h, rx: 2 }, fill: '#1a1a1a', stroke: rng.pick(palette), strokeWidth: 1, opacity: 0.95 })
      for (let px = 0; px < w; px += gridSize) {
        shapes.push({ shape: { kind: 'circle', cx: x + px + gridSize / 2, cy: y - 3, r: 1.5 }, fill: rng.pick(palette), opacity: 0.8 })
        shapes.push({ shape: { kind: 'circle', cx: x + px + gridSize / 2, cy: y + h + 3, r: 1.5 }, fill: rng.pick(palette), opacity: 0.8 })
      }
    }

    for (let i = 0; i < traceCount; i++) {
      const start = rng.bool(0.7) && chips.length ? rng.pick(chips) : { x: Math.round(rng.range(1, WIDTH / gridSize - 1)) * gridSize, y: Math.round(rng.range(1, HEIGHT / gridSize - 1)) * gridSize }
      const steps = Math.round(rng.range(4, 14))
      const trace = routeTrace(start, gridSize, steps, turnProbability, rng)
      const color = rng.pick(palette)
      const d = `M ${trace.map((p) => `${p.x} ${p.y}`).join(' L ')}`
      shapes.push({ shape: { kind: 'path', d }, stroke: color, strokeWidth: 2, fill: 'none', opacity: 0.85 })
      shapes.push({ shape: { kind: 'circle', cx: trace[0].x, cy: trace[0].y, r: 3 }, fill: color, opacity: 0.9 })
      shapes.push({ shape: { kind: 'circle', cx: trace[trace.length - 1].x, cy: trace[trace.length - 1].y, r: 3 }, fill: color, opacity: 0.9 })
    }

    return {
      id: `circuit-board-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'board', name: 'Circuit Board', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'circuit-board', generatorName: 'Circuit Board', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
