import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const mandalaGenerator: GeneratorDefinition = {
  id: 'mandala',
  name: 'Mandala',
  category: 'organic',
  description: 'Radially symmetric rings of petals around a center point.',
  defaultParameters: {
    segments: 12,
    rings: 4,
    petalSize: 26,
    spacing: 42,
    variation: 0.15,
  },
  parameterSchema: [
    { key: 'segments', label: 'Segments', type: 'number', group: 'shape', min: 3, max: 32, step: 1, semantic: 'complexity' },
    { key: 'rings', label: 'Rings', type: 'number', group: 'pattern', min: 1, max: 8, step: 1, semantic: 'density' },
    { key: 'petalSize', label: 'Petal size', type: 'number', group: 'shape', min: 6, max: 60, step: 1, semantic: 'size' },
    { key: 'spacing', label: 'Ring spacing', type: 'number', group: 'pattern', min: 16, max: 70, step: 1 },
    { key: 'variation', label: 'Variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const segments = Math.round(Number(parameters.segments))
    const rings = Math.round(Number(parameters.rings))
    const petalSize = Number(parameters.petalSize)
    const spacing = Number(parameters.spacing)
    const variation = Number(parameters.variation)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2

    const shapes = []
    for (let ring = 0; ring < rings; ring++) {
      const radius = (ring + 1) * spacing
      const falloff = 1 - ring * (0.5 / rings)
      const ringOffset = ring % 2 === 0 ? 0 : Math.PI / segments
      const ringSeed = rng.int(0, 2 ** 31)
      const ringRng = createRng(ringSeed)
      const fill = ringRng.pick(palette)
      for (let s = 0; s < segments; s++) {
        const angle = (s / segments) * Math.PI * 2 + ringOffset
        const px = cx + Math.cos(angle) * radius
        const py = cy + Math.sin(angle) * radius
        const r = Math.max(2, petalSize * falloff * (1 + ringRng.range(-variation, variation)))
        shapes.push({
          shape: { kind: 'blob' as const, cx: px, cy: py, r, points: 7, irregularity: 0.15 + variation * 0.2, seed: ringRng.int(0, 2 ** 31) },
          fill,
          opacity: ringRng.range(0.8, 1),
        })
      }
    }

    // Center accent.
    shapes.push({
      shape: { kind: 'circle' as const, cx, cy, r: petalSize * 0.6 },
      fill: rng.pick(palette),
      opacity: 0.95,
    })

    return {
      id: `mandala-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'mandala', name: 'Mandala', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'mandala', generatorName: 'Mandala', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
