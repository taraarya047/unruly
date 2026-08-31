import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { randomPoints } from '@/engine/math/points'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const particleConstellationGenerator: GeneratorDefinition = {
  id: 'particle-constellation',
  name: 'Particle Constellation',
  category: 'particles',
  description: 'Scatter points and connect the ones that are close enough — a star map or neural web.',
  tags: ['network', 'points', 'connections', 'technical'],
  defaultParameters: {
    particleCount: 70,
    connectionDistance: 110,
    size: 3,
    clustering: 0.3,
  },
  parameterSchema: [
    { key: 'particleCount', label: 'Particles', type: 'number', group: 'pattern', min: 15, max: 160, step: 1, semantic: 'density' },
    { key: 'connectionDistance', label: 'Connection reach', type: 'number', group: 'shape', min: 30, max: 220, step: 5 },
    { key: 'size', label: 'Point size', type: 'number', group: 'shape', min: 1, max: 10, step: 0.5, semantic: 'size' },
    { key: 'clustering', label: 'Clustering', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const particleCount = Math.round(Number(parameters.particleCount))
    const connectionDistance = Number(parameters.connectionDistance)
    const size = Number(parameters.size)
    const clustering = Number(parameters.clustering)
    const palette = colors.length ? colors : ['#111111']

    const clusterCount = Math.max(1, Math.round(1 + clustering * 5))
    const clusterCenters = randomPoints(rng, clusterCount, WIDTH, HEIGHT)
    const points = Array.from({ length: particleCount }, () => {
      if (rng.bool(clustering)) {
        const c = rng.pick(clusterCenters)
        return { x: c.x + rng.range(-1, 1) * WIDTH * 0.15, y: c.y + rng.range(-1, 1) * HEIGHT * 0.15 }
      }
      return { x: rng.range(0, WIDTH), y: rng.range(0, HEIGHT) }
    })

    const lineShapes = []
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)
        if (d < connectionDistance) {
          lineShapes.push({
            shape: { kind: 'line' as const, x1: round(points[i].x), y1: round(points[i].y), x2: round(points[j].x), y2: round(points[j].y) },
            stroke: rng.pick(palette),
            strokeWidth: 0.75,
            fill: 'none',
            opacity: Math.max(0.1, 1 - d / connectionDistance) * 0.7,
          })
        }
      }
    }

    const dotShapes = points.map((p) => ({
      shape: { kind: 'circle' as const, cx: p.x, cy: p.y, r: size * rng.range(0.7, 1.3) },
      fill: rng.pick(palette),
      opacity: rng.range(0.85, 1),
    }))

    return {
      id: `particle-constellation-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [
        { id: 'connections', name: 'Connections', visible: true, locked: false, opacity: 1, shapes: lineShapes },
        { id: 'particles', name: 'Particles', visible: true, locked: false, opacity: 1, shapes: dotShapes },
      ],
      metadata: { generatorId: 'particle-constellation', generatorName: 'Particle Constellation', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
