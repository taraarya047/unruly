import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { traceStreamline, streamlineToPathD } from '@/engine/math/streamlines'

const WIDTH = 800
const HEIGHT = 800

const MODE_OPTIONS = [
  { label: 'Orbit', value: 'orbit' },
  { label: 'Attraction', value: 'attraction' },
  { label: 'Repulsion', value: 'repulsion' },
  { label: 'Convergent', value: 'saddle' },
]

interface Vortex {
  x: number
  y: number
  rotation: number
  pull: number
}

/**
 * Two point vortices, each contributing both a rotational term (swirl) and a radial term (pull toward
 * or away from its center) — combining two such sources is what produces qualitatively different global
 * flow: same-sign rotation with inward pull merges into one shared orbit ("orbit"), one attracting and
 * one repelling vortex sweeps everything toward the attractor ("convergent"), and so on. This is a
 * genuinely different field shape from Vortex Field's pure rotation (no radial term at all).
 */
function fieldVelocity(x: number, y: number, vortices: Vortex[]): { vx: number; vy: number } {
  let vx = 0
  let vy = 0
  for (const v of vortices) {
    const dx = x - v.x
    const dy = y - v.y
    const distSq = dx * dx + dy * dy + 400
    const dist = Math.sqrt(distSq)
    vx += (-dy * v.rotation) / distSq - (dx / dist) * (v.pull / dist)
    vy += (dx * v.rotation) / distSq - (dy / dist) * (v.pull / dist)
  }
  return { vx: vx * 30000, vy: vy * 30000 }
}

export const doubleVortexGenerator: GeneratorDefinition = {
  id: 'double-vortex',
  name: 'Double Vortex',
  category: 'fields',
  description: 'Two interacting vortices, each with its own rotation and pull — the combination is what produces orbiting, merging, diverging, or convergent flow.',
  tags: ['field', 'vortex', 'flow', 'streamline'],
  defaultParameters: {
    mode: 'orbit',
    separation: 220,
    strength: 0.6,
    pathCount: 70,
    length: 300,
  },
  parameterSchema: [
    { key: 'mode', label: 'Interaction', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'separation', label: 'Separation', type: 'number', group: 'composition', min: 100, max: 400, step: 10 },
    { key: 'strength', label: 'Strength', type: 'number', group: 'shape', min: 0.1, max: 1, step: 0.02, semantic: 'complexity' },
    { key: 'pathCount', label: 'Path count', type: 'number', group: 'pattern', min: 15, max: 140, step: 1, semantic: 'density' },
    { key: 'length', label: 'Length', type: 'number', group: 'shape', min: 80, max: 500, step: 10, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const mode = String(parameters.mode)
    const separation = Number(parameters.separation)
    const strength = Number(parameters.strength)
    const pathCount = Math.round(Number(parameters.pathCount))
    const length = Number(parameters.length)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2

    const configs: Record<string, [Vortex, Vortex]> = {
      orbit: [
        { x: cx - separation / 2, y: cy, rotation: strength, pull: strength * 0.15 },
        { x: cx + separation / 2, y: cy, rotation: strength, pull: strength * 0.15 },
      ],
      attraction: [
        { x: cx - separation / 2, y: cy, rotation: strength * 0.2, pull: strength },
        { x: cx + separation / 2, y: cy, rotation: strength * 0.2, pull: strength },
      ],
      repulsion: [
        { x: cx - separation / 2, y: cy, rotation: strength * 0.2, pull: -strength },
        { x: cx + separation / 2, y: cy, rotation: strength * 0.2, pull: -strength },
      ],
      saddle: [
        { x: cx - separation / 2, y: cy, rotation: strength * 0.3, pull: strength },
        { x: cx + separation / 2, y: cy, rotation: -strength * 0.3, pull: -strength },
      ],
    }
    const vortices = configs[mode] ?? configs.orbit
    const velocity = (x: number, y: number) => fieldVelocity(x, y, vortices)

    const shapes: StyledShape[] = []
    for (let i = 0; i < pathCount; i++) {
      const start = { x: rng.range(20, WIDTH - 20), y: rng.range(20, HEIGHT - 20) }
      const points = traceStreamline(start, velocity, 90, length / 90, { width: WIDTH, height: HEIGHT })
      if (points.length < 3) continue
      const t = i / pathCount
      shapes.push({
        shape: { kind: 'path', d: streamlineToPathD(points) },
        stroke: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette),
        strokeWidth: rng.range(0.8, 2),
        fill: 'none',
        opacity: rng.range(0.5, 0.9),
      })
    }

    return {
      id: `double-vortex-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'streamlines', name: 'Field Streamlines', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'double-vortex', generatorName: 'Double Vortex', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
