import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { traceStreamline, streamlineToPathD } from '@/engine/math/streamlines'

const WIDTH = 800
const HEIGHT = 800

interface Vortex {
  x: number
  y: number
  strength: number
}

/**
 * A true rotational field — velocity at a point is perpendicular to the line to the vortex center, so
 * traced streamlines circulate around it (like a whirlpool), never falling toward or away from it. This
 * is the key difference from Gravity Well (radial attraction plus a separate spiral term) and Magnetic
 * Lines (dipole field lines that terminate at the poles) — a vortex field has no source or sink.
 */
function vortexVelocity(x: number, y: number, vortices: Vortex[]): { vx: number; vy: number } {
  let vx = 0
  let vy = 0
  for (const v of vortices) {
    const dx = x - v.x
    const dy = y - v.y
    const distSq = dx * dx + dy * dy + 400 // soften near the singularity
    vx += (-dy * v.strength) / distSq
    vy += (dx * v.strength) / distSq
  }
  return { vx: vx * 40000, vy: vy * 40000 }
}

export const vortexFieldGenerator: GeneratorDefinition = {
  id: 'vortex-field',
  name: 'Vortex Field',
  category: 'fields',
  description: 'Streamlines circulating around one or more rotational vortices — a true whirlpool field, not particles falling toward a center.',
  tags: ['field', 'vortex', 'flow', 'streamline'],
  defaultParameters: {
    vortexCount: 2,
    strength: 0.6,
    falloff: 0.5,
    pathCount: 60,
    length: 260,
  },
  parameterSchema: [
    { key: 'vortexCount', label: 'Vortex count', type: 'number', group: 'composition', min: 1, max: 4, step: 1, advanced: true },
    { key: 'strength', label: 'Strength', type: 'number', group: 'shape', min: 0.1, max: 1, step: 0.02 },
    { key: 'falloff', label: 'Turbulence', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'pathCount', label: 'Path count', type: 'number', group: 'pattern', min: 15, max: 140, step: 1, semantic: 'density' },
    { key: 'length', label: 'Length', type: 'number', group: 'shape', min: 80, max: 500, step: 10, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const vortexCount = Math.round(Number(parameters.vortexCount))
    const strength = Number(parameters.strength)
    const turbulence = Number(parameters.falloff)
    const pathCount = Math.round(Number(parameters.pathCount))
    const length = Number(parameters.length)
    const palette = colors.length ? colors : ['#111111']

    const vortices: Vortex[] = Array.from({ length: vortexCount }, () => ({
      x: rng.range(WIDTH * 0.25, WIDTH * 0.75),
      y: rng.range(HEIGHT * 0.25, HEIGHT * 0.75),
      strength: strength * rng.sign(),
    }))

    const velocity = (x: number, y: number) => {
      const base = vortexVelocity(x, y, vortices)
      const jitterAngle = rng.range(-turbulence, turbulence) * 0.3
      const cos = Math.cos(jitterAngle)
      const sin = Math.sin(jitterAngle)
      return { vx: base.vx * cos - base.vy * sin, vy: base.vx * sin + base.vy * cos }
    }

    const shapes: StyledShape[] = []
    for (let i = 0; i < pathCount; i++) {
      const start = { x: rng.range(20, WIDTH - 20), y: rng.range(20, HEIGHT - 20) }
      const points = traceStreamline(start, velocity, 80, length / 80, { width: WIDTH, height: HEIGHT })
      if (points.length < 3) continue
      shapes.push({
        shape: { kind: 'path', d: streamlineToPathD(points) },
        stroke: rng.pick(palette),
        strokeWidth: rng.range(0.8, 2),
        fill: 'none',
        opacity: rng.range(0.5, 0.9),
      })
    }

    return {
      id: `vortex-field-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'streamlines', name: 'Vortex Streamlines', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'vortex-field', generatorName: 'Vortex Field', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
