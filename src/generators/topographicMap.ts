import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeHeightField } from '@/engine/math/noise'
import { sampleGrid, marchingSquaresFromGrid, segmentsToPathD } from '@/engine/math/marchingSquares'

const WIDTH = 800
const HEIGHT = 800

const PRESET_OPTIONS = [
  { label: 'Mountain', value: 'mountain' },
  { label: 'Island', value: 'island' },
  { label: 'Desert', value: 'desert' },
]

export const topographicMapGenerator: GeneratorDefinition = {
  id: 'topographic-map',
  name: 'Topographic Map',
  category: 'texture',
  description: 'Contour lines traced around an invisible mathematical terrain.',
  tags: ['contours', 'terrain', 'map', 'nature'],
  defaultParameters: {
    contours: 16,
    terrain: 'mountain',
    complexity: 3,
    thickness: 1.2,
  },
  parameterSchema: [
    { key: 'contours', label: 'Contour count', type: 'number', group: 'pattern', min: 5, max: 40, step: 1, semantic: 'density' },
    { key: 'terrain', label: 'Terrain', type: 'select', group: 'shape', options: PRESET_OPTIONS },
    { key: 'complexity', label: 'Complexity', type: 'number', group: 'variation', min: 1, max: 6, step: 1, semantic: 'complexity' },
    { key: 'thickness', label: 'Line thickness', type: 'number', group: 'color', min: 0.5, max: 3, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const contours = Math.round(Number(parameters.contours))
    const terrain = String(parameters.terrain)
    const complexity = Math.round(Number(parameters.complexity))
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']

    const centers = terrain === 'island' ? 1 : terrain === 'desert' ? 5 : complexity
    const heightField = makeHeightField(rng, centers)
    const field = (x: number, y: number) => heightField(x / WIDTH, y / HEIGHT)
    // Sample the (expensive) noise field once and reuse it for every contour threshold below —
    // recomputing it per-contour was the difference between ~15ms and ~800ms at 40 contours.
    const grid = sampleGrid(field, WIDTH, HEIGHT, 90)

    const shapes: StyledShape[] = []
    for (let i = 0; i < contours; i++) {
      const threshold = -0.9 + (i / (contours - 1 || 1)) * 1.8
      const segments = marchingSquaresFromGrid(grid, threshold)
      if (segments.length === 0) continue
      shapes.push({
        shape: { kind: 'path', d: segmentsToPathD(segments) },
        stroke: rng.pick(palette),
        strokeWidth: thickness,
        fill: 'none',
        opacity: rng.range(0.55, 0.9),
      })
    }

    return {
      id: `topographic-map-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'contours', name: 'Contours', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'topographic-map', generatorName: 'Topographic Map', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
