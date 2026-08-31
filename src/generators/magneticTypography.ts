import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const magneticTypographyGenerator: GeneratorDefinition = {
  id: 'magnetic-typography',
  name: 'Magnetic Typography Field',
  category: 'illustrative',
  description: 'Flowing lines that read like handwriting without spelling anything — generative calligraphy.',
  tags: ['calligraphy', 'abstract', 'typography', 'flow'],
  defaultParameters: {
    lines: 7,
    density: 14,
    letterHeight: 26,
    curvature: 0.6,
  },
  parameterSchema: [
    { key: 'lines', label: 'Lines', type: 'number', group: 'pattern', min: 2, max: 16, step: 1, semantic: 'density' },
    { key: 'density', label: 'Strokes per line', type: 'number', group: 'shape', min: 6, max: 30, step: 1, semantic: 'complexity' },
    { key: 'letterHeight', label: 'Letter height', type: 'number', group: 'shape', min: 10, max: 50, step: 1, semantic: 'size' },
    { key: 'curvature', label: 'Curvature', type: 'number', group: 'variation', min: 0.1, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const lineCount = Math.round(Number(parameters.lines))
    const density = Math.round(Number(parameters.density))
    const letterHeight = Number(parameters.letterHeight)
    const curvature = Number(parameters.curvature)
    const palette = colors.length ? colors : ['#111111']

    const marginX = 60
    const marginY = 60
    const spacing = (HEIGHT - marginY * 2) / lineCount
    const shapes: StyledShape[] = []

    for (let l = 0; l < lineCount; l++) {
      const baseline = marginY + l * spacing + spacing / 2
      const color = rng.pick(palette)
      const strokeW = rng.range(2, 4)
      const segWidth = (WIDTH - marginX * 2) / density

      let d = `M ${round(marginX)} ${round(baseline)} `
      for (let s = 0; s < density; s++) {
        const x0 = marginX + s * segWidth
        const x1 = x0 + segWidth
        const cp1 = { x: x0 + segWidth * 0.3, y: baseline + rng.range(-1, 1) * letterHeight * curvature }
        const cp2 = { x: x0 + segWidth * 0.7, y: baseline + rng.range(-1, 1) * letterHeight * curvature }
        const end = { x: x1, y: baseline + rng.range(-0.3, 0.3) * letterHeight * 0.3 }
        d += `C ${round(cp1.x)} ${round(cp1.y)}, ${round(cp2.x)} ${round(cp2.y)}, ${round(end.x)} ${round(end.y)} `

        if (rng.bool(0.25)) {
          shapes.push({ shape: { kind: 'circle', cx: end.x, cy: baseline - letterHeight * rng.range(0.6, 1), r: 2 }, fill: color, opacity: 0.9 })
        }
      }
      shapes.push({ shape: { kind: 'path', d: d.trim() }, stroke: color, strokeWidth: strokeW, fill: 'none', opacity: rng.range(0.8, 1) })
    }

    return {
      id: `magnetic-typography-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'lines', name: 'Lines', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'magnetic-typography', generatorName: 'Magnetic Typography Field', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
