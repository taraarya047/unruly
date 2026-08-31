import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const moireGenerator: GeneratorDefinition = {
  id: 'moire',
  name: 'Moiré',
  category: 'optical',
  description: 'Two overlapping line grids that interfere into a vibrating optical pattern.',
  tags: ['optical', 'lines', 'interference', 'illusion'],
  defaultParameters: {
    lineCount: 60,
    rotationA: 0,
    rotationB: 8,
    thickness: 1.5,
  },
  parameterSchema: [
    { key: 'lineCount', label: 'Line count', type: 'number', group: 'pattern', min: 15, max: 120, step: 1, semantic: 'density' },
    { key: 'rotationA', label: 'Grid A angle', type: 'angle', group: 'composition', min: 0, max: 90, step: 1, advanced: true },
    { key: 'rotationB', label: 'Grid B angle', type: 'angle', group: 'composition', min: 0, max: 90, step: 0.5, semantic: 'rotation' },
    { key: 'thickness', label: 'Line thickness', type: 'number', group: 'shape', min: 0.5, max: 3, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const lineCount = Math.round(Number(parameters.lineCount))
    const rotationA = (Number(parameters.rotationA) * Math.PI) / 180
    const rotationB = (Number(parameters.rotationB) * Math.PI) / 180
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const diag = Math.hypot(WIDTH, HEIGHT)
    const colorA = rng.pick(palette)
    const colorB = rng.pick(palette)

    function gridLines(rotation: number, color: string): StyledShape[] {
      const spacing = diag / lineCount
      const shapes: StyledShape[] = []
      for (let i = -lineCount; i <= lineCount; i++) {
        const offset = i * spacing
        const dx = Math.cos(rotation)
        const dy = Math.sin(rotation)
        const perpX = -dy
        const perpY = dx
        const x1 = cx + perpX * offset - dx * diag
        const y1 = cy + perpY * offset - dy * diag
        const x2 = cx + perpX * offset + dx * diag
        const y2 = cy + perpY * offset + dy * diag
        shapes.push({ shape: { kind: 'line', x1, y1, x2, y2 }, stroke: color, strokeWidth: thickness, fill: 'none', opacity: 0.7 })
      }
      return shapes
    }

    const shapes = [...gridLines(rotationA, colorA), ...gridLines(rotationA + rotationB, colorB)]

    return {
      id: `moire-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'moire', name: 'Moiré', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'moire', generatorName: 'Moiré', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
