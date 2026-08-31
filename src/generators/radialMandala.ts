import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const radialMandalaGenerator: GeneratorDefinition = {
  id: 'radial-mandala',
  name: 'Radial Mandala',
  category: 'mathematical',
  description: 'Concentric rings of technical geometry — a diagram-like mandala.',
  tags: ['radial', 'symmetry', 'technical', 'rings'],
  defaultParameters: {
    rings: 6,
    segments: 10,
    innerDensity: 0.5,
    rotation: 0,
  },
  parameterSchema: [
    { key: 'rings', label: 'Rings', type: 'number', group: 'pattern', min: 2, max: 12, step: 1, semantic: 'density' },
    { key: 'segments', label: 'Segments', type: 'number', group: 'shape', min: 4, max: 24, step: 1, semantic: 'complexity' },
    { key: 'innerDensity', label: 'Inner vs outer', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02 },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 360, step: 1, semantic: 'rotation' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const rings = Math.round(Number(parameters.rings))
    const segments = Math.round(Number(parameters.segments))
    const innerDensity = Number(parameters.innerDensity)
    const rotation = (Number(parameters.rotation) * Math.PI) / 180
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxR = Math.min(WIDTH, HEIGHT) * 0.45

    const shapes: StyledShape[] = []
    for (let r = 0; r < rings; r++) {
      const radius = ((r + 1) / rings) * maxR
      const t = r / (rings - 1 || 1)
      const densityBias = innerDensity < 0.5 ? 1 - t : t
      const ringSegments = Math.max(3, Math.round(segments * (0.4 + densityBias * (innerDensity < 0.5 ? -0.6 : 0.6) + 0.6)))
      const style = r % 3
      const color = rng.pick(palette)

      shapes.push({ shape: { kind: 'ring', cx, cy, r: radius }, stroke: color, strokeWidth: 1, fill: 'none', opacity: 0.35 })

      for (let s = 0; s < ringSegments; s++) {
        const angle = rotation + (s / ringSegments) * Math.PI * 2 + (r % 2 === 0 ? 0 : Math.PI / ringSegments)
        const x = cx + Math.cos(angle) * radius
        const y = cy + Math.sin(angle) * radius
        if (style === 0) {
          shapes.push({ shape: { kind: 'circle', cx: x, cy: y, r: 6 }, fill: color, opacity: rng.range(0.8, 1) })
        } else if (style === 1) {
          shapes.push({ shape: { kind: 'polygon', cx: x, cy: y, r: 9, sides: 3, rotation: angle }, fill: color, opacity: rng.range(0.8, 1) })
        } else {
          shapes.push({
            shape: { kind: 'arc', cx, cy, r: radius, startAngle: angle - 0.15, endAngle: angle + 0.15 },
            stroke: color,
            strokeWidth: 3,
            fill: 'none',
            opacity: 0.9,
          })
        }
      }
    }

    return {
      id: `radial-mandala-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'mandala', name: 'Mandala', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'radial-mandala', generatorName: 'Radial Mandala', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
