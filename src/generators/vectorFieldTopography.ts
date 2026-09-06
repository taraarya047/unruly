import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeHeightField, makeNoiseField } from '@/engine/math/noise'
import { sampleGrid, marchingSquaresFromGrid } from '@/engine/math/marchingSquares'

const WIDTH = 800
const HEIGHT = 800
const RESOLUTION = 90

/**
 * Topographic Map (existing) draws plain contour lines straight from a scalar field. This generator
 * draws the same kind of contours, then displaces every point along each contour by a SEPARATE vector
 * field — the lines still trace real elevation, but flow like they're sitting in moving water rather
 * than being fixed to the terrain. That second displacement pass is the whole difference.
 */
export const vectorFieldTopographyGenerator: GeneratorDefinition = {
  id: 'vector-field-topography',
  name: 'Vector Field Topography',
  category: 'texture',
  description: 'Elevation contours displaced by an independent flow field — real terrain lines, bent as if drifting in a current.',
  tags: ['field', 'texture', 'terrain', 'organic'],
  defaultParameters: {
    contours: 20,
    terrainComplexity: 3,
    flowStrength: 0.5,
    thickness: 1.2,
  },
  parameterSchema: [
    { key: 'contours', label: 'Contour count', type: 'number', group: 'pattern', min: 6, max: 36, step: 1, semantic: 'density' },
    { key: 'terrainComplexity', label: 'Terrain complexity', type: 'number', group: 'shape', min: 1, max: 6, step: 1, semantic: 'complexity' },
    { key: 'flowStrength', label: 'Flow strength', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'thickness', label: 'Line thickness', type: 'number', group: 'color', min: 0.5, max: 3, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const contours = Math.round(Number(parameters.contours))
    const terrainComplexity = Math.round(Number(parameters.terrainComplexity))
    const flowStrength = Number(parameters.flowStrength)
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']

    const heightField = makeHeightField(rng.fork(1), terrainComplexity)
    const field = (x: number, y: number) => heightField(x / WIDTH, y / HEIGHT)
    const grid = sampleGrid(field, WIDTH, HEIGHT, RESOLUTION)

    const flowNoise = makeNoiseField(rng.fork(2), 3)
    const displace = (x: number, y: number) => {
      const angle = flowNoise(x, y) * Math.PI * 2
      const amount = flowStrength * 14
      return { x: x + Math.cos(angle) * amount, y: y + Math.sin(angle) * amount }
    }

    const shapes: StyledShape[] = []
    for (let i = 0; i < contours; i++) {
      const threshold = -0.9 + (i / Math.max(1, contours - 1)) * 1.8
      const segments = marchingSquaresFromGrid(grid, threshold)
      if (segments.length === 0) continue
      // Each segment endpoint gets its own independent displacement, so a contour that was a clean
      // line becomes a wavering ribbon — the flow field acts locally, not as one uniform shift.
      let d = ''
      for (const s of segments) {
        const p1 = displace(s.x1, s.y1)
        const p2 = displace(s.x2, s.y2)
        d += `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `
      }
      shapes.push({
        shape: { kind: 'path', d },
        stroke: rng.pick(palette),
        strokeWidth: thickness,
        fill: 'none',
        opacity: rng.range(0.55, 0.9),
      })
    }

    return {
      id: `vector-field-topography-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'contours', name: 'Flowing Contours', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'vector-field-topography', generatorName: 'Vector Field Topography', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
