import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { marchingSquares, segmentsToPathD } from '@/engine/math/marchingSquares'

const WIDTH = 800
const HEIGHT = 800

export const metaballsGenerator: GeneratorDefinition = {
  id: 'metaballs',
  name: 'Metaballs',
  category: 'organic',
  description: 'Soft blobs that melt and merge into one continuous organic field.',
  tags: ['blobs', 'organic', 'liquid', 'field'],
  defaultParameters: {
    blobCount: 8,
    blobSize: 90,
    smoothness: 1,
    threshold: 1,
  },
  parameterSchema: [
    { key: 'blobCount', label: 'Blob count', type: 'number', group: 'pattern', min: 2, max: 16, step: 1, semantic: 'density' },
    { key: 'blobSize', label: 'Blob size', type: 'number', group: 'shape', min: 30, max: 160, step: 5, semantic: 'size' },
    { key: 'smoothness', label: 'Merge strength', type: 'number', group: 'variation', min: 0.4, max: 2, step: 0.05 },
    { key: 'threshold', label: 'Threshold', type: 'number', group: 'shape', min: 0.5, max: 2, step: 0.05, advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const blobCount = Math.round(Number(parameters.blobCount))
    const blobSize = Number(parameters.blobSize)
    const smoothness = Number(parameters.smoothness)
    const threshold = Number(parameters.threshold)
    const palette = colors.length ? colors : ['#111111']

    const blobs = Array.from({ length: blobCount }, () => ({
      x: rng.range(WIDTH * 0.15, WIDTH * 0.85),
      y: rng.range(HEIGHT * 0.15, HEIGHT * 0.85),
      r: blobSize * rng.range(0.6, 1.3),
    }))

    const field = (x: number, y: number) => {
      let sum = 0
      for (const b of blobs) {
        const d2 = Math.max(4, (x - b.x) ** 2 + (y - b.y) ** 2)
        sum += (b.r * b.r * smoothness * smoothness) / d2
      }
      return sum
    }

    const segments = marchingSquares(field, WIDTH, HEIGHT, 120, threshold)
    const d = segmentsToPathD(segments)

    // Faint filled dots under the outline give the merged field a soft glow of color without
    // needing to chain marching-squares segments into closed fillable polygons.
    const shapes: StyledShape[] = blobs.map((b) => ({
      shape: { kind: 'circle' as const, cx: b.x, cy: b.y, r: b.r * 0.55 },
      fill: rng.pick(palette),
      opacity: 0.35,
    }))
    shapes.push({ shape: { kind: 'path' as const, d }, fill: 'none', stroke: rng.pick(palette), strokeWidth: 2.5, opacity: 0.95 })

    return {
      id: `metaballs-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'field', name: 'Field', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'metaballs', generatorName: 'Metaballs', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
