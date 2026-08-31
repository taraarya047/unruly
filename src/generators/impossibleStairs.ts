import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { ISO_RIGHT, ISO_LEFT, ISO_UP, isoAdd, isoBlock, type Vec } from '@/engine/math/isometric'

const WIDTH = 800
const HEIGHT = 800

// Four flight directions forming a closed loop when walked in order — the "impossible" part is that
// the loop keeps ascending forever instead of returning to its starting height, per the classic illusion.
const FLIGHT_DIRS: Vec[] = [ISO_RIGHT, ISO_LEFT, { x: -ISO_RIGHT.x, y: -ISO_RIGHT.y }, { x: -ISO_LEFT.x, y: -ISO_LEFT.y }]

export const impossibleStairsGenerator: GeneratorDefinition = {
  id: 'impossible-stairs',
  name: 'Impossible Stairs',
  category: 'optical',
  description: 'An original isometric staircase loop that keeps climbing without ever arriving.',
  tags: ['optical', 'isometric', 'illusion', 'architecture'],
  defaultParameters: {
    stepsPerFlight: 5,
    stepSize: 46,
    stepHeight: 16,
    scale: 1,
  },
  parameterSchema: [
    { key: 'stepsPerFlight', label: 'Steps per flight', type: 'number', group: 'pattern', min: 2, max: 8, step: 1, semantic: 'density' },
    { key: 'stepSize', label: 'Step size', type: 'number', group: 'shape', min: 20, max: 70, step: 2, semantic: 'size' },
    { key: 'stepHeight', label: 'Step height', type: 'number', group: 'shape', min: 6, max: 30, step: 1 },
    { key: 'scale', label: 'Scale', type: 'number', group: 'composition', min: 0.6, max: 1.4, step: 0.05, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const stepsPerFlight = Math.round(Number(parameters.stepsPerFlight))
    const stepSize = Number(parameters.stepSize) * Number(parameters.scale)
    const stepHeight = Number(parameters.stepHeight) * Number(parameters.scale)
    const palette = colors.length ? colors : ['#111111']

    const shapes: StyledShape[] = []
    let cursor: Vec = { x: WIDTH / 2, y: HEIGHT / 2 + 140 }
    for (let flight = 0; flight < 4; flight++) {
      const dir = FLIGHT_DIRS[flight]
      const color = rng.pick(palette)
      for (let s = 0; s < stepsPerFlight; s++) {
        shapes.push(...isoBlock(cursor, stepSize, stepSize, stepHeight, color))
        cursor = isoAdd(cursor, dir, stepSize)
        cursor = isoAdd(cursor, ISO_UP, stepHeight)
      }
    }

    return {
      id: `impossible-stairs-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'stairs', name: 'Stairs', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'impossible-stairs', generatorName: 'Impossible Stairs', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
