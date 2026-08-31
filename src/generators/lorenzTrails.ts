import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { lorenzPoints, boundsOf } from '@/engine/math/attractors'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const lorenzTrailsGenerator: GeneratorDefinition = {
  id: 'lorenz-trails',
  name: 'Lorenz Trails',
  category: 'mathematical',
  description: 'The Lorenz butterfly — a chaotic system traced as one continuous ribbon.',
  tags: ['chaos', 'attractor', 'curves', 'scientific'],
  defaultParameters: {
    iterations: 6000,
    chaos: 28,
    scale: 1,
    thickness: 1,
  },
  parameterSchema: [
    { key: 'iterations', label: 'Trail length', type: 'number', group: 'pattern', min: 1000, max: 15000, step: 500, semantic: 'density' },
    { key: 'chaos', label: 'Chaos', type: 'number', group: 'variation', min: 10, max: 40, step: 1, semantic: 'jitter' },
    { key: 'scale', label: 'Scale', type: 'number', group: 'shape', min: 0.5, max: 1.8, step: 0.05, semantic: 'scale' },
    { key: 'thickness', label: 'Line thickness', type: 'number', group: 'color', min: 0.4, max: 3, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const iterations = Math.round(Number(parameters.iterations))
    const chaos = Number(parameters.chaos)
    const scale = Number(parameters.scale)
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']

    const points = lorenzPoints(iterations, 10, chaos, 8 / 3)
    const bounds = boundsOf(points)
    const spanX = bounds.maxX - bounds.minX || 1
    const spanY = bounds.maxY - bounds.minY || 1
    const fit = Math.min(WIDTH / spanX, HEIGHT / spanY) * 0.82 * scale
    const offsetX = WIDTH / 2 - ((bounds.minX + bounds.maxX) / 2) * fit
    const offsetY = HEIGHT / 2 - ((bounds.minY + bounds.maxY) / 2) * fit

    const segmentCount = 6
    const perSegment = Math.ceil(points.length / segmentCount)
    const shapes = []
    for (let seg = 0; seg < segmentCount; seg++) {
      const slice = points.slice(seg * perSegment, (seg + 1) * perSegment + 1)
      if (slice.length < 2) continue
      let d = ''
      for (let i = 0; i < slice.length; i++) {
        const x = slice[i].x * fit + offsetX
        const y = slice[i].y * fit + offsetY
        d += `${i === 0 ? 'M' : 'L'} ${round(x)} ${round(y)} `
      }
      shapes.push({
        shape: { kind: 'path' as const, d: d.trim() },
        stroke: rng.pick(palette),
        strokeWidth: thickness,
        fill: 'none',
        opacity: rng.range(0.6, 0.95),
      })
    }

    return {
      id: `lorenz-trails-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'trail', name: 'Trail', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'lorenz-trails', generatorName: 'Lorenz Trails', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
