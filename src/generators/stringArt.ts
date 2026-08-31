import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const stringArtGenerator: GeneratorDefinition = {
  id: 'string-art',
  name: 'String Art',
  category: 'mathematical',
  description: 'Pins around a circle, connected by a simple multiplication rule — pure math string art.',
  tags: ['lines', 'circle', 'technical', 'geometric'],
  defaultParameters: {
    pins: 90,
    multiplier: 33,
    rotation: 0,
    strokeWidth: 0.6,
  },
  parameterSchema: [
    { key: 'pins', label: 'Pins', type: 'number', group: 'pattern', min: 12, max: 200, step: 1, semantic: 'density' },
    { key: 'multiplier', label: 'Pattern', type: 'number', group: 'shape', min: 2, max: 99, step: 1, semantic: 'complexity' },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 360, step: 1, semantic: 'rotation' },
    { key: 'strokeWidth', label: 'Thread width', type: 'number', group: 'color', min: 0.2, max: 2, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const pins = Math.round(Number(parameters.pins))
    const multiplier = Math.round(Number(parameters.multiplier))
    const rotation = (Number(parameters.rotation) * Math.PI) / 180
    const strokeWidth = Number(parameters.strokeWidth)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const r = Math.min(WIDTH, HEIGHT) * 0.42

    const pinPositions = Array.from({ length: pins }, (_, i) => {
      const a = (i / pins) * Math.PI * 2 + rotation
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
    })

    const shapes = []
    for (let i = 0; i < pins; i++) {
      const j = (i * multiplier) % pins
      if (i === j) continue
      const p1 = pinPositions[i]
      const p2 = pinPositions[j]
      shapes.push({
        shape: { kind: 'line' as const, x1: round(p1.x), y1: round(p1.y), x2: round(p2.x), y2: round(p2.y) },
        stroke: rng.pick(palette),
        strokeWidth,
        fill: 'none',
        opacity: rng.range(0.35, 0.7),
      })
    }

    return {
      id: `string-art-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'threads', name: 'Threads', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'string-art', generatorName: 'String Art', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
