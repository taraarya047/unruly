import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

function growOrganism(x: number, groundY: number, growth: number, randomness: number, scale: number, rng: Rng, palette: string[]): StyledShape[] {
  const shapes: StyledShape[] = []
  const height = growth * rng.range(0.7, 1.3) * scale
  const segments = Math.max(3, Math.round(growth / 18))
  const sway = rng.range(-0.3, 0.3) * randomness
  const stemColor = rng.pick(palette)

  let x0 = x
  let y0 = groundY
  let d = `M ${round(x0)} ${round(y0)} `
  for (let i = 1; i <= segments; i++) {
    const t = i / segments
    const x1 = x + Math.sin(t * Math.PI * sway) * height * 0.25
    const y1 = groundY - t * height
    d += `L ${round(x1)} ${round(y1)} `
    if (rng.bool(0.55)) {
      const side = rng.sign()
      const leafR = scale * rng.range(6, 16)
      shapes.push({
        shape: { kind: 'blob', cx: x1 + side * leafR * 0.8, cy: y1, r: leafR, points: 6, irregularity: 0.3, seed: rng.int(0, 2 ** 31) },
        fill: rng.pick(palette),
        opacity: rng.range(0.8, 1),
      })
    }
    x0 = x1
    y0 = y1
  }
  shapes.push({ shape: { kind: 'path', d: d.trim() }, stroke: stemColor, strokeWidth: scale * rng.range(1.5, 3), fill: 'none', opacity: 0.9 })

  // Flower head at the top.
  const headPetals = rng.int(3, 6)
  const headR = scale * rng.range(8, 16)
  const headColor = rng.pick(palette)
  for (let p = 0; p < headPetals; p++) {
    const a = (p / headPetals) * Math.PI * 2
    shapes.push({
      shape: { kind: 'circle', cx: x0 + Math.cos(a) * headR, cy: y0 + Math.sin(a) * headR, r: headR * 0.65 },
      fill: headColor,
      opacity: 0.95,
    })
  }
  shapes.push({ shape: { kind: 'circle', cx: x0, cy: y0, r: headR * 0.5 }, fill: rng.pick(palette), opacity: 1 })

  return shapes
}

export const chaosGardenGenerator: GeneratorDefinition = {
  id: 'chaos-garden',
  name: 'Chaos Garden',
  category: 'playful',
  description: 'A tiny procedural ecosystem — stems, leaves, and flowers growing wild.',
  tags: ['whimsical', 'organic', 'garden', 'playful'],
  defaultParameters: {
    organisms: 22,
    growth: 130,
    randomness: 0.5,
    scale: 1,
  },
  parameterSchema: [
    { key: 'organisms', label: 'Organisms', type: 'number', group: 'pattern', min: 4, max: 45, step: 1, semantic: 'density' },
    { key: 'growth', label: 'Growth', type: 'number', group: 'shape', min: 40, max: 260, step: 5, semantic: 'size' },
    { key: 'randomness', label: 'Wildness', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'scale', label: 'Scale', type: 'number', group: 'shape', min: 0.5, max: 1.8, step: 0.05, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const organisms = Math.round(Number(parameters.organisms))
    const growth = Number(parameters.growth)
    const randomness = Number(parameters.randomness)
    const scale = Number(parameters.scale)
    const palette = colors.length ? colors : ['#111111']

    const shapes: StyledShape[] = []
    for (let i = 0; i < organisms; i++) {
      const x = rng.range(20, WIDTH - 20)
      const groundY = rng.range(HEIGHT * 0.4, HEIGHT - 20)
      shapes.push(...growOrganism(x, groundY, growth * rng.range(0.5, 1), randomness, scale, rng, palette))
    }

    return {
      id: `chaos-garden-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'garden', name: 'Garden', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'chaos-garden', generatorName: 'Chaos Garden', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
