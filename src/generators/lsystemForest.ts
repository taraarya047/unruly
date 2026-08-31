import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { expandLSystem, turtleInterpret, LSYSTEM_PRESETS } from '@/engine/math/lsystem'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

const PRESET_OPTIONS = [
  { label: 'Tree', value: 'tree' },
  { label: 'Fern', value: 'fern' },
  { label: 'Coral', value: 'coral' },
  { label: 'Lightning', value: 'lightning' },
  { label: 'Roots', value: 'roots' },
]

export const lsystemForestGenerator: GeneratorDefinition = {
  id: 'lsystem-forest',
  name: 'L-System Forest',
  category: 'organic',
  description: 'Procedural branching structures — trees, coral, ferns, lightning.',
  tags: ['branching', 'fractal', 'nature', 'plants'],
  defaultParameters: {
    preset: 'tree',
    iterations: 4,
    branchAngle: 22,
    randomness: 0.15,
  },
  parameterSchema: [
    { key: 'preset', label: 'Species', type: 'select', group: 'shape', options: PRESET_OPTIONS },
    { key: 'iterations', label: 'Growth', type: 'number', group: 'pattern', min: 2, max: 6, step: 1, semantic: 'complexity' },
    { key: 'branchAngle', label: 'Branch angle', type: 'angle', group: 'shape', min: 5, max: 45, step: 1 },
    { key: 'randomness', label: 'Randomness', type: 'number', group: 'variation', min: 0, max: 0.6, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const presetId = String(parameters.preset)
    const iterations = Math.round(Number(parameters.iterations))
    const branchAngle = Number(parameters.branchAngle)
    const randomness = Number(parameters.randomness)
    const palette = colors.length ? colors : ['#111111']
    const preset = LSYSTEM_PRESETS[presetId] ?? LSYSTEM_PRESETS.tree

    const stepLength = Math.max(4, 90 / Math.pow(1.6, iterations))
    const expanded = expandLSystem(preset, iterations)
    const angleRad = (branchAngle * Math.PI) / 180
    const segments = turtleInterpret(expanded, WIDTH / 2, HEIGHT * 0.92, -Math.PI / 2, stepLength, angleRad, randomness * 0.5, rng)

    const maxDepth = segments.reduce((m, s) => Math.max(m, s.depth), 1)
    const shapes = segments.map((s) => ({
      shape: { kind: 'line' as const, x1: round(s.x1), y1: round(s.y1), x2: round(s.x2), y2: round(s.y2) },
      stroke: rng.pick(palette),
      strokeWidth: Math.max(0.6, 4 * (1 - s.depth / (maxDepth + 1))),
      fill: 'none',
      opacity: rng.range(0.75, 1),
    }))

    return {
      id: `lsystem-forest-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'branches', name: 'Branches', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'lsystem-forest', generatorName: 'L-System Forest', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
