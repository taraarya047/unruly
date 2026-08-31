import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const MODE_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Multiple', value: 'multiple' },
  { label: 'Corner', value: 'corner' },
  { label: 'Border', value: 'border' },
]

function splashAt(shapes: StyledShape[], cx: number, cy: number, spread: number, dropletCount: number, size: number, rng: Rng, palette: string[]) {
  const color = rng.pick(palette)
  shapes.push({
    shape: { kind: 'blob', cx, cy, r: size, points: rng.int(7, 11), irregularity: rng.range(0.35, 0.55), seed: rng.int(0, 2 ** 31) },
    fill: color,
    opacity: rng.range(0.9, 1),
  })
  for (let i = 0; i < dropletCount; i++) {
    const a = rng.range(0, Math.PI * 2)
    const dist = rng.range(size * 0.6, spread)
    const dx = cx + Math.cos(a) * dist
    const dy = cy + Math.sin(a) * dist
    const dropSize = Math.max(1.5, size * 0.28 * (1 - dist / spread) * rng.range(0.5, 1.3))
    shapes.push({
      shape: { kind: 'blob', cx: dx, cy: dy, r: dropSize, points: rng.int(5, 8), irregularity: rng.range(0.2, 0.4), seed: rng.int(0, 2 ** 31) },
      fill: rng.bool(0.8) ? color : rng.pick(palette),
      opacity: rng.range(0.7, 1),
    })
  }
}

export const inkSplashGenerator: GeneratorDefinition = {
  id: 'ink-splash',
  name: 'Ink Splash',
  category: 'illustrative',
  description: 'Procedural ink splatters — droplets, flicks, and irregular blots.',
  tags: ['ink', 'splash', 'organic', 'expressive'],
  defaultParameters: {
    spread: 160,
    dropletCount: 18,
    size: 60,
    mode: 'single',
  },
  parameterSchema: [
    { key: 'spread', label: 'Spread', type: 'number', group: 'shape', min: 60, max: 300, step: 10, semantic: 'scale' },
    { key: 'dropletCount', label: 'Droplets', type: 'number', group: 'pattern', min: 4, max: 40, step: 1, semantic: 'density' },
    { key: 'size', label: 'Splash size', type: 'number', group: 'shape', min: 20, max: 120, step: 5, semantic: 'size' },
    { key: 'mode', label: 'Placement', type: 'select', group: 'composition', options: MODE_OPTIONS },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const spread = Number(parameters.spread)
    const dropletCount = Math.round(Number(parameters.dropletCount))
    const size = Number(parameters.size)
    const mode = String(parameters.mode)
    const palette = colors.length ? colors : ['#111111']

    const shapes: StyledShape[] = []
    if (mode === 'single') {
      splashAt(shapes, WIDTH / 2, HEIGHT / 2, spread, dropletCount, size, rng, palette)
    } else if (mode === 'multiple') {
      const count = rng.int(3, 5)
      for (let i = 0; i < count; i++) splashAt(shapes, rng.range(spread, WIDTH - spread), rng.range(spread, HEIGHT - spread), spread * 0.6, Math.round(dropletCount / count), size * rng.range(0.6, 1), rng, palette)
    } else if (mode === 'corner') {
      const corners = [
        { x: 0, y: 0 },
        { x: WIDTH, y: 0 },
        { x: 0, y: HEIGHT },
        { x: WIDTH, y: HEIGHT },
      ]
      const c = rng.pick(corners)
      splashAt(shapes, c.x, c.y, spread, dropletCount, size, rng, palette)
    } else {
      const edge = rng.int(0, 3)
      const along = rng.range(0.2, 0.8)
      const c = edge === 0 ? { x: along * WIDTH, y: 0 } : edge === 1 ? { x: along * WIDTH, y: HEIGHT } : edge === 2 ? { x: 0, y: along * HEIGHT } : { x: WIDTH, y: along * HEIGHT }
      splashAt(shapes, c.x, c.y, spread, dropletCount, size, rng, palette)
    }

    return {
      id: `ink-splash-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'splash', name: 'Splash', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'ink-splash', generatorName: 'Ink Splash', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
