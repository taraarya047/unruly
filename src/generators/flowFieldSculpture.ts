import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeNoiseField } from '@/engine/math/noise'
import { traceStreamline, streamlineToPathD } from '@/engine/math/streamlines'

const WIDTH = 800
const HEIGHT = 800

/**
 * Unlike Vortex Field / Double Vortex / Curl Noise (each one specific field type, traced the same way),
 * this combines several field types — sine waves, a radial pull, noise, and a couple of vortex sources —
 * into one weighted sum, which is what "sculpture" is meant to convey: a denser, more layered composite
 * flow rather than one clean mathematical field.
 */
function buildVelocityField(rng: ReturnType<typeof createRng>, complexity: number, turbulence: number) {
  const noise = makeNoiseField(rng.fork(1), 3)
  const cx = WIDTH / 2
  const cy = HEIGHT / 2
  const vortexA = { x: rng.range(WIDTH * 0.2, WIDTH * 0.5), y: rng.range(HEIGHT * 0.2, HEIGHT * 0.8), s: rng.sign() }
  const vortexB = { x: rng.range(WIDTH * 0.5, WIDTH * 0.8), y: rng.range(HEIGHT * 0.2, HEIGHT * 0.8), s: rng.sign() }
  const waveFreq = 1 + complexity * 3

  return (x: number, y: number) => {
    let vx = Math.sin((y / HEIGHT) * Math.PI * waveFreq) * 0.5
    let vy = Math.cos((x / WIDTH) * Math.PI * waveFreq) * 0.5

    const rdx = x - cx
    const rdy = y - cy
    const rdist = Math.hypot(rdx, rdy) + 1
    vx += (rdx / rdist) * 0.2
    vy += (rdy / rdist) * 0.2

    for (const v of [vortexA, vortexB]) {
      const dx = x - v.x
      const dy = y - v.y
      const distSq = dx * dx + dy * dy + 3000
      vx += (-dy * v.s * 12000) / distSq
      vy += (dx * v.s * 12000) / distSq
    }

    const n = noise(x, y) * turbulence
    vx += Math.cos(n * Math.PI * 2) * turbulence
    vy += Math.sin(n * Math.PI * 2) * turbulence

    return { vx, vy }
  }
}

export const flowFieldSculptureGenerator: GeneratorDefinition = {
  id: 'flow-field-sculpture',
  name: 'Flow Field Sculpture',
  category: 'fields',
  description: 'A dense composite flow — sine waves, a radial pull, noise, and two vortices summed into one field, then traced as hundreds of streamlines.',
  tags: ['field', 'flow', 'streamline', 'composite'],
  defaultParameters: {
    complexity: 0.5,
    turbulence: 0.4,
    density: 160,
    curvature: 0.6,
    length: 240,
  },
  parameterSchema: [
    { key: 'complexity', label: 'Complexity', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'complexity' },
    { key: 'turbulence', label: 'Turbulence', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 30, max: 300, step: 1, semantic: 'density' },
    { key: 'curvature', label: 'Curvature', type: 'number', group: 'shape', min: 0.2, max: 1, step: 0.02 },
    { key: 'length', label: 'Length', type: 'number', group: 'shape', min: 60, max: 400, step: 10, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const complexity = Number(parameters.complexity)
    const turbulence = Number(parameters.turbulence)
    const density = Math.round(Number(parameters.density))
    const curvature = Number(parameters.curvature)
    const length = Number(parameters.length)
    const palette = colors.length ? colors : ['#111111']

    const velocity = buildVelocityField(rng, complexity, turbulence)

    const shapes: StyledShape[] = []
    for (let i = 0; i < density; i++) {
      const start = { x: rng.range(0, WIDTH), y: rng.range(0, HEIGHT) }
      const points = traceStreamline(start, velocity, Math.round(50 * curvature) + 20, length / (Math.round(50 * curvature) + 20), { width: WIDTH, height: HEIGHT })
      if (points.length < 3) continue
      const t = i / density
      shapes.push({
        shape: { kind: 'path', d: streamlineToPathD(points) },
        stroke: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette),
        strokeWidth: rng.range(0.5, 1.5),
        fill: 'none',
        opacity: rng.range(0.35, 0.75),
      })
    }

    return {
      id: `flow-field-sculpture-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'streamlines', name: 'Flow Streamlines', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'flow-field-sculpture', generatorName: 'Flow Field Sculpture', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
