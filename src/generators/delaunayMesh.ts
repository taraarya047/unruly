import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { randomPoints, jitteredGridPoints } from '@/engine/math/points'
import { delaunayTriangulate } from '@/engine/math/delaunay'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

const FILL_OPTIONS = [
  { label: 'Wireframe', value: 'wireframe' },
  { label: 'Filled', value: 'filled' },
  { label: 'Mixed', value: 'mixed' },
]

export const delaunayMeshGenerator: GeneratorDefinition = {
  id: 'delaunay-mesh',
  name: 'Delaunay Mesh',
  category: 'mathematical',
  description: 'Scatter points and weave them into a web of triangles.',
  tags: ['triangles', 'technical', 'geometric', 'network'],
  defaultParameters: {
    pointCount: 36,
    grid: 0.4,
    fillMode: 'mixed',
    strokeWidth: 1,
  },
  parameterSchema: [
    { key: 'pointCount', label: 'Point count', type: 'number', group: 'pattern', min: 8, max: 100, step: 1, semantic: 'density' },
    { key: 'grid', label: 'Order', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
    { key: 'fillMode', label: 'Style', type: 'select', group: 'color', options: FILL_OPTIONS },
    { key: 'strokeWidth', label: 'Line width', type: 'number', group: 'color', min: 0.25, max: 4, step: 0.25 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const pointCount = Math.round(Number(parameters.pointCount))
    const grid = Number(parameters.grid)
    const fillMode = String(parameters.fillMode)
    const strokeWidth = Number(parameters.strokeWidth)
    const palette = colors.length ? colors : ['#111111']

    const points = grid > 0.05 ? jitteredGridPoints(rng, pointCount, WIDTH, HEIGHT, 1 - grid) : randomPoints(rng, pointCount, WIDTH, HEIGHT)
    const triangles = delaunayTriangulate(points, WIDTH, HEIGHT)

    const shapes = triangles.map((t) => {
      const filled = fillMode === 'filled' || (fillMode === 'mixed' && rng.bool(0.5))
      const d = `M ${round(t.a.x)} ${round(t.a.y)} L ${round(t.b.x)} ${round(t.b.y)} L ${round(t.c.x)} ${round(t.c.y)} Z`
      return {
        shape: { kind: 'path' as const, d },
        fill: filled ? rng.pick(palette) : 'none',
        stroke: filled ? undefined : rng.pick(palette),
        strokeWidth: filled ? undefined : strokeWidth,
        opacity: filled ? rng.range(0.75, 1) : rng.range(0.5, 0.9),
      }
    })

    return {
      id: `delaunay-mesh-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'mesh', name: 'Mesh', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'delaunay-mesh', generatorName: 'Delaunay Mesh', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
