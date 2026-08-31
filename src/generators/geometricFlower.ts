import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

function petalPath(cx: number, cy: number, angle: number, innerR: number, outerR: number, width: number): string {
  const rotate = (lx: number, ly: number) => ({ x: cx + lx * Math.cos(angle) - ly * Math.sin(angle), y: cy + lx * Math.sin(angle) + ly * Math.cos(angle) })
  const base = rotate(0, innerR)
  const tip = rotate(0, outerR)
  const midY = (innerR + outerR) / 2
  const left = rotate(-width, midY)
  const right = rotate(width, midY)
  return `M ${round(base.x)} ${round(base.y)} Q ${round(left.x)} ${round(left.y)} ${round(tip.x)} ${round(tip.y)} Q ${round(right.x)} ${round(right.y)} ${round(base.x)} ${round(base.y)} Z`
}

export const geometricFlowerGenerator: GeneratorDefinition = {
  id: 'geometric-flower',
  name: 'Geometric Flower',
  category: 'mathematical',
  description: 'Flowers built from pure radial math — petals, layers, and a center.',
  tags: ['flower', 'radial', 'symmetry', 'geometric'],
  defaultParameters: {
    petals: 8,
    petalWidth: 0.35,
    layers: 2,
    innerRadius: 40,
  },
  parameterSchema: [
    { key: 'petals', label: 'Petals', type: 'number', group: 'pattern', min: 3, max: 20, step: 1, semantic: 'density' },
    { key: 'petalWidth', label: 'Petal width', type: 'number', group: 'shape', min: 0.1, max: 0.7, step: 0.02 },
    { key: 'layers', label: 'Flower layers', type: 'number', group: 'composition', min: 1, max: 4, step: 1, semantic: 'complexity' },
    { key: 'innerRadius', label: 'Inner radius', type: 'number', group: 'shape', min: 10, max: 100, step: 5, semantic: 'size' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const petals = Math.round(Number(parameters.petals))
    const petalWidthRatio = Number(parameters.petalWidth)
    const layerCount = Math.round(Number(parameters.layers))
    const innerRadius = Number(parameters.innerRadius)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxOuter = Math.min(WIDTH, HEIGHT) * 0.42

    const shapes: StyledShape[] = []
    for (let l = 0; l < layerCount; l++) {
      const outerR = maxOuter * ((l + 1) / layerCount)
      const innerR = innerRadius * (0.4 + l * 0.2)
      const petalWidth = (outerR - innerR) * petalWidthRatio
      const rotationOffset = (l / layerCount) * (Math.PI / petals) + rng.range(-0.05, 0.05)
      const color = rng.pick(palette)
      for (let p = 0; p < petals; p++) {
        const angle = (p / petals) * Math.PI * 2 + rotationOffset
        shapes.push({
          shape: { kind: 'path', d: petalPath(cx, cy, angle, innerR, outerR, petalWidth) },
          fill: color,
          opacity: 0.55 + 0.4 * (l / layerCount),
        })
      }
    }
    shapes.push({ shape: { kind: 'circle', cx, cy, r: innerRadius * 0.35 }, fill: rng.pick(palette), opacity: 1 })

    return {
      id: `geometric-flower-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'flower', name: 'Flower', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'geometric-flower', generatorName: 'Geometric Flower', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
