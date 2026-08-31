import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const weavingGenerator: GeneratorDefinition = {
  id: 'weaving',
  name: 'Weaving',
  category: 'texture',
  description: 'Threads woven over and under each other, like fabric or a basket.',
  tags: ['weave', 'fabric', 'texture', 'craft'],
  defaultParameters: {
    threadCount: 18,
    threadWidth: 0.82,
    colorVariation: 0.5,
  },
  parameterSchema: [
    { key: 'threadCount', label: 'Threads', type: 'number', group: 'pattern', min: 6, max: 36, step: 1, semantic: 'density' },
    { key: 'threadWidth', label: 'Thread width', type: 'number', group: 'shape', min: 0.4, max: 0.98, step: 0.02, semantic: 'size' },
    { key: 'colorVariation', label: 'Color variation', type: 'number', group: 'color', min: 0, max: 1, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const threadCount = Math.round(Number(parameters.threadCount))
    const threadWidthRatio = Number(parameters.threadWidth)
    const colorVariation = Number(parameters.colorVariation)
    const palette = colors.length ? colors : ['#111111']

    const cell = WIDTH / threadCount
    const barWidth = cell * threadWidthRatio
    const inset = (cell - barWidth) / 2

    const warpColor = rng.pick(palette)
    const weftColor = rng.pick(palette)

    const shapes: StyledShape[] = []
    for (let row = 0; row < threadCount; row++) {
      for (let col = 0; col < threadCount; col++) {
        const overOnTop = (row + col) % 2 === 0
        const warpSeg: StyledShape = {
          shape: { kind: 'rect', x: col * cell + inset, y: row * cell, w: barWidth, h: cell },
          fill: colorVariation > 0 && rng.bool(colorVariation) ? rng.pick(palette) : warpColor,
          opacity: 0.95,
        }
        const weftSeg: StyledShape = {
          shape: { kind: 'rect', x: col * cell, y: row * cell + inset, w: cell, h: barWidth },
          fill: colorVariation > 0 && rng.bool(colorVariation) ? rng.pick(palette) : weftColor,
          opacity: 0.95,
        }
        if (overOnTop) {
          shapes.push(warpSeg, weftSeg)
        } else {
          shapes.push(weftSeg, warpSeg)
        }
      }
    }

    return {
      id: `weaving-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'weave', name: 'Weave', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'weaving', generatorName: 'Weaving', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
