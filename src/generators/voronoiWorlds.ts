import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { jitteredGridPoints } from '@/engine/math/points'
import { voronoiCells } from '@/engine/math/voronoi'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

function cellPathD(polygon: { x: number; y: number }[], distortion: number, rng: ReturnType<typeof createRng>): string {
  const pts = polygon.map((p) => ({ x: p.x + rng.range(-distortion, distortion) * 14, y: p.y + rng.range(-distortion, distortion) * 14 }))
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${round(p.x)} ${round(p.y)} `).join('') + 'Z'
}

export const voronoiWorldsGenerator: GeneratorDefinition = {
  id: 'voronoi-worlds',
  name: 'Voronoi Worlds',
  category: 'topology',
  description: 'Turn scattered points into strange cellular landscapes.',
  tags: ['cells', 'geometric', 'abstract', 'maps'],
  defaultParameters: {
    pointCount: 28,
    regularity: 0.55,
    distortion: 0.2,
    strokeWidth: 1.5,
  },
  parameterSchema: [
    { key: 'pointCount', label: 'Cell count', type: 'number', group: 'pattern', min: 6, max: 90, step: 1, semantic: 'density' },
    { key: 'regularity', label: 'Regularity', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'strokeWidth', label: 'Border width', type: 'number', group: 'color', min: 0, max: 6, step: 0.25 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const pointCount = Math.round(Number(parameters.pointCount))
    const regularity = Number(parameters.regularity)
    const distortion = Number(parameters.distortion)
    const strokeWidth = Number(parameters.strokeWidth)
    const palette = colors.length ? colors : ['#111111']

    const points = jitteredGridPoints(rng, pointCount, WIDTH, HEIGHT, 1 - regularity)
    const cells = voronoiCells(points, WIDTH, HEIGHT)

    const shapes = cells.map((cell) => ({
      shape: { kind: 'path' as const, d: cellPathD(cell.polygon, distortion, rng) },
      fill: rng.pick(palette),
      stroke: strokeWidth > 0 ? '#00000022' : undefined,
      strokeWidth: strokeWidth > 0 ? strokeWidth : undefined,
      opacity: rng.range(0.85, 1),
    }))

    return {
      id: `voronoi-worlds-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'cells', name: 'Cells', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'voronoi-worlds', generatorName: 'Voronoi Worlds', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
