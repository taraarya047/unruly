import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { jitteredGridPoints } from '@/engine/math/points'
import { voronoiCells } from '@/engine/math/voronoi'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const stainedGlassGenerator: GeneratorDefinition = {
  id: 'stained-glass',
  name: 'Stained Glass',
  category: 'illustrative',
  description: 'Bold leaded panes of color, like light through a window.',
  tags: ['cells', 'panes', 'bold', 'window'],
  defaultParameters: {
    paneCount: 16,
    leadWidth: 5,
    distortion: 0.3,
    colorVariation: 0.5,
  },
  parameterSchema: [
    { key: 'paneCount', label: 'Panes', type: 'number', group: 'pattern', min: 5, max: 40, step: 1, semantic: 'density' },
    { key: 'leadWidth', label: 'Lead width', type: 'number', group: 'shape', min: 1, max: 12, step: 0.5 },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'colorVariation', label: 'Color variation', type: 'number', group: 'color', min: 0, max: 1, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const paneCount = Math.round(Number(parameters.paneCount))
    const leadWidth = Number(parameters.leadWidth)
    const distortion = Number(parameters.distortion)
    const colorVariation = Number(parameters.colorVariation)
    const palette = colors.length ? colors : ['#111111']

    const points = jitteredGridPoints(rng, paneCount, WIDTH, HEIGHT, 0.5)
    const cells = voronoiCells(points, WIDTH, HEIGHT)

    const shapes = cells.map((cell) => {
      const pts = cell.polygon.map((p) => ({ x: p.x + rng.range(-distortion, distortion) * 20, y: p.y + rng.range(-distortion, distortion) * 20 }))
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${round(p.x)} ${round(p.y)} `).join('') + 'Z'
      const baseColor = rng.pick(palette)
      const useAlt = rng.bool(colorVariation)
      return {
        shape: { kind: 'path' as const, d },
        fill: useAlt ? rng.pick(palette) : baseColor,
        stroke: '#1a1a1acc',
        strokeWidth: leadWidth,
        opacity: rng.range(0.88, 1),
      }
    })

    return {
      id: `stained-glass-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'panes', name: 'Panes', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'stained-glass', generatorName: 'Stained Glass', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
