import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeNoiseField } from '@/engine/math/noise'
import { traceStreamline, streamlineToPathD } from '@/engine/math/streamlines'

const WIDTH = 800
const HEIGHT = 800
const EPSILON = 3

/**
 * The curl of a scalar potential field is guaranteed divergence-free (incompressible) — v = (dpsi/dy,
 * -dpsi/dx), approximated here by finite differences on a noise potential. That guarantee is what makes
 * curl noise read as genuine fluid-like swirling with no sources or sinks anywhere, unlike sampling a
 * noise field directly for a direction (as Force Field does), which has no such constraint and can show
 * points where flow appears to spontaneously converge or diverge.
 */
function curlVelocity(potential: (x: number, y: number) => number, x: number, y: number) {
  const dPsiDy = (potential(x, y + EPSILON) - potential(x, y - EPSILON)) / (2 * EPSILON)
  const dPsiDx = (potential(x + EPSILON, y) - potential(x - EPSILON, y)) / (2 * EPSILON)
  return { vx: dPsiDy, vy: -dPsiDx }
}

export const curlNoiseGenerator: GeneratorDefinition = {
  id: 'curl-noise',
  name: 'Curl Noise',
  category: 'fields',
  description: 'Divergence-free flow traced from the curl of a noise field — genuinely fluid-like, with no points where lines converge or diverge.',
  tags: ['field', 'flow', 'noise', 'fluid', 'streamline'],
  defaultParameters: {
    scale: 1,
    turbulence: 0.5,
    density: 90,
    length: 200,
  },
  parameterSchema: [
    { key: 'scale', label: 'Field scale', type: 'number', group: 'shape', min: 0.4, max: 3, step: 0.1, semantic: 'scale' },
    { key: 'turbulence', label: 'Turbulence', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'complexity' },
    { key: 'density', label: 'Path density', type: 'number', group: 'pattern', min: 20, max: 200, step: 1, semantic: 'density' },
    { key: 'length', label: 'Length', type: 'number', group: 'shape', min: 60, max: 400, step: 10 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const scale = Number(parameters.scale)
    const turbulence = Number(parameters.turbulence)
    const density = Math.round(Number(parameters.density))
    const length = Number(parameters.length)
    const palette = colors.length ? colors : ['#111111']

    const octaves = 2 + Math.round(turbulence * 4)
    const potential = makeNoiseField(rng, octaves)
    const velocity = (x: number, y: number) => {
      const v = curlVelocity(potential, x / scale, y / scale)
      return { vx: v.vx, vy: v.vy }
    }

    const shapes: StyledShape[] = []
    for (let i = 0; i < density; i++) {
      const start = { x: rng.range(0, WIDTH), y: rng.range(0, HEIGHT) }
      const points = traceStreamline(start, velocity, 70, length / 70, { width: WIDTH, height: HEIGHT })
      if (points.length < 3) continue
      const t = i / density
      shapes.push({
        shape: { kind: 'path', d: streamlineToPathD(points) },
        stroke: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette),
        strokeWidth: rng.range(0.6, 1.6),
        fill: 'none',
        opacity: rng.range(0.4, 0.85),
      })
    }

    return {
      id: `curl-noise-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'streamlines', name: 'Curl Streamlines', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'curl-noise', generatorName: 'Curl Noise', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
