import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const glitchGridGenerator: GeneratorDefinition = {
  id: 'glitch-grid',
  name: 'Glitch Grid',
  category: 'texture',
  description: 'Controlled digital glitch — torn scanlines and displaced fragments.',
  tags: ['glitch', 'digital', 'texture', 'bold'],
  defaultParameters: {
    rows: 40,
    intensity: 0.4,
    displacement: 60,
    fragmentation: 3,
  },
  parameterSchema: [
    { key: 'rows', label: 'Scanlines', type: 'number', group: 'pattern', min: 12, max: 80, step: 1, semantic: 'density' },
    { key: 'intensity', label: 'Glitch intensity', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'displacement', label: 'Displacement', type: 'number', group: 'shape', min: 5, max: 150, step: 5 },
    { key: 'fragmentation', label: 'Fragments', type: 'number', group: 'shape', min: 2, max: 6, step: 1, semantic: 'complexity' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const rows = Math.round(Number(parameters.rows))
    const intensity = Number(parameters.intensity)
    const displacement = Number(parameters.displacement)
    const fragmentation = Math.round(Number(parameters.fragmentation))
    const palette = colors.length ? colors : ['#111111']
    const rowHeight = HEIGHT / rows

    const shapes: StyledShape[] = []
    for (let row = 0; row < rows; row++) {
      const y = row * rowHeight
      const glitched = rng.bool(intensity)
      const color = rng.pick(palette)
      if (!glitched) {
        shapes.push({ shape: { kind: 'rect', x: 0, y, w: WIDTH, h: rowHeight * 0.92 }, fill: color, opacity: 0.12 })
        continue
      }
      const pieces = rng.int(2, fragmentation)
      let x = 0
      for (let p = 0; p < pieces; p++) {
        const w = WIDTH / pieces
        const dx = rng.range(-displacement, displacement)
        shapes.push({
          shape: { kind: 'rect', x: x + dx, y, w: w * rng.range(0.6, 1), h: rowHeight * rng.range(0.5, 0.95) },
          fill: rng.pick(palette),
          opacity: rng.range(0.6, 1),
        })
        x += w
      }
      if (rng.bool(0.3)) {
        shapes.push({ shape: { kind: 'rect', x: 0, y: y + rowHeight * 0.3, w: WIDTH, h: 1.5 }, fill: rng.pick(palette), opacity: 0.8 })
      }
    }

    return {
      id: `glitch-grid-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'glitch', name: 'Glitch', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'glitch-grid', generatorName: 'Glitch Grid', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
