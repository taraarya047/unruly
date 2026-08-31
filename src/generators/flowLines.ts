import type { GeneratorDefinition } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

/** Cheap seeded 2D value-noise approximation — a sum of a few phase-shifted sine waves. */
function makeFlowField(rng: Rng) {
  const terms = Array.from({ length: 4 }, () => ({
    fx: rng.range(0.004, 0.012),
    fy: rng.range(0.004, 0.012),
    phase: rng.range(0, Math.PI * 2),
  }))
  return (x: number, y: number) => {
    let sum = 0
    for (const t of terms) sum += Math.sin(x * t.fx + y * t.fy + t.phase)
    return sum / terms.length // roughly [-1, 1]
  }
}

export const flowLinesGenerator: GeneratorDefinition = {
  id: 'flow-lines',
  name: 'Flow Lines',
  category: 'lines',
  description: 'Lines that drift along an invisible flow field.',
  defaultParameters: {
    count: 60,
    curvature: 0.6,
    length: 120,
    noise: 0.5,
    spacing: 12,
  },
  parameterSchema: [
    { key: 'count', label: 'Count', type: 'number', group: 'pattern', min: 5, max: 160, step: 1, semantic: 'density' },
    { key: 'curvature', label: 'Curvature', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
    { key: 'length', label: 'Length', type: 'number', group: 'shape', min: 20, max: 300, step: 5, semantic: 'size' },
    { key: 'noise', label: 'Noise', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'spacing', label: 'Line spacing', type: 'number', group: 'pattern', min: 2, max: 40, step: 1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const count = Number(parameters.count)
    const curvature = Number(parameters.curvature)
    const length = Number(parameters.length)
    const noise = Number(parameters.noise)
    const spacing = Number(parameters.spacing)
    const palette = colors.length ? colors : ['#111111']
    const field = makeFlowField(rng)
    const stepSize = 6
    const steps = Math.max(2, Math.round(length / stepSize))

    const shapes = []
    for (let i = 0; i < count; i++) {
      let x = rng.range(0, WIDTH)
      let y = rng.range(0, HEIGHT)
      let angle = rng.range(0, Math.PI * 2)
      let d = `M ${round(x)} ${round(y)} `
      for (let s = 0; s < steps; s++) {
        const n = field(x, y) * (0.3 + noise * 0.6)
        angle += n * curvature * 0.35 + rng.range(-noise, noise) * 0.05
        x += Math.cos(angle) * stepSize
        y += Math.sin(angle) * stepSize
        d += `L ${round(x)} ${round(y)} `
      }
      shapes.push({
        shape: { kind: 'path' as const, d: d.trim() },
        stroke: rng.pick(palette),
        strokeWidth: Math.max(1, spacing / 10),
        fill: 'none',
        opacity: rng.range(0.5, 0.9),
      })
    }

    return {
      id: `flow-lines-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'flow', name: 'Flow lines', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'flow-lines', generatorName: 'Flow Lines', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
