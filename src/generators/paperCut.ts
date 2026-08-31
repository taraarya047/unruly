import type { GeneratorDefinition, SVGLayer } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const paperCutGenerator: GeneratorDefinition = {
  id: 'paper-cut',
  name: 'Paper Cut',
  category: 'illustrative',
  description: 'Layered organic shapes stacked like hand-cut paper, each layer its own depth.',
  tags: ['layers', 'organic', 'craft', 'depth'],
  defaultParameters: {
    layerCount: 4,
    shapesPerLayer: 5,
    depthOffset: 18,
    complexity: 7,
  },
  parameterSchema: [
    { key: 'layerCount', label: 'Layers', type: 'number', group: 'pattern', min: 2, max: 6, step: 1, semantic: 'density' },
    { key: 'shapesPerLayer', label: 'Shapes per layer', type: 'number', group: 'shape', min: 2, max: 10, step: 1, semantic: 'complexity' },
    { key: 'depthOffset', label: 'Depth offset', type: 'number', group: 'composition', min: 0, max: 40, step: 1 },
    { key: 'complexity', label: 'Edge complexity', type: 'number', group: 'variation', min: 3, max: 16, step: 1, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: true },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const layerCount = Math.round(Number(parameters.layerCount))
    const shapesPerLayer = Math.round(Number(parameters.shapesPerLayer))
    const depthOffset = Number(parameters.depthOffset)
    const complexity = Math.round(Number(parameters.complexity))
    const palette = colors.length ? colors : ['#111111']

    const layers: SVGLayer[] = []
    for (let l = 0; l < layerCount; l++) {
      const depth = layerCount - l
      const layerColor = palette[l % palette.length]
      const shapes = Array.from({ length: shapesPerLayer }, () => {
        const cx = rng.range(WIDTH * 0.15, WIDTH * 0.85) + depth * rng.range(-depthOffset, depthOffset) * 0.3
        const cy = rng.range(HEIGHT * 0.15, HEIGHT * 0.85) + depth * rng.range(-depthOffset, depthOffset) * 0.3
        const r = rng.range(50, 140) * (0.7 + l * 0.08)
        return {
          shape: { kind: 'blob' as const, cx, cy, r, points: complexity, irregularity: rng.range(0.15, 0.4), seed: rng.int(0, 2 ** 31) },
          fill: layerColor,
          opacity: 0.92,
        }
      })
      layers.push({ id: `layer-${l}`, name: `Layer ${l + 1}`, visible: true, locked: false, opacity: 1, shapes })
    }

    return {
      id: `paper-cut-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers,
      metadata: { generatorId: 'paper-cut', generatorName: 'Paper Cut', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
