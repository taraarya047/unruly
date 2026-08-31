import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const ribbonSculptureGenerator: GeneratorDefinition = {
  id: 'ribbon-sculpture',
  name: 'Ribbon Sculpture',
  category: 'illustrative',
  description: 'Flowing ribbon paths, twisting across the canvas — great for hero graphics.',
  tags: ['ribbon', 'flow', 'hero', 'sculptural'],
  defaultParameters: {
    ribbonCount: 5,
    curvature: 0.6,
    thickness: 46,
    twist: 0.5,
  },
  parameterSchema: [
    { key: 'ribbonCount', label: 'Ribbons', type: 'number', group: 'pattern', min: 1, max: 10, step: 1, semantic: 'density' },
    { key: 'curvature', label: 'Curvature', type: 'number', group: 'shape', min: 0.1, max: 1, step: 0.02 },
    { key: 'thickness', label: 'Thickness', type: 'number', group: 'shape', min: 10, max: 90, step: 2, semantic: 'size' },
    { key: 'twist', label: 'Twist', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const ribbonCount = Math.round(Number(parameters.ribbonCount))
    const curvature = Number(parameters.curvature)
    const baseThickness = Number(parameters.thickness)
    const twist = Number(parameters.twist)
    const palette = colors.length ? colors : ['#111111']

    const shapes = []
    for (let i = 0; i < ribbonCount; i++) {
      const startY = rng.range(HEIGHT * 0.1, HEIGHT * 0.9)
      const cp1 = { x: WIDTH * rng.range(0.15, 0.4), y: startY + rng.range(-1, 1) * HEIGHT * curvature }
      const cp2 = { x: WIDTH * rng.range(0.6, 0.85), y: startY + rng.range(-1, 1) * HEIGHT * curvature }
      const endY = rng.range(HEIGHT * 0.1, HEIGHT * 0.9)
      const samples = 60
      const points: { x: number; y: number }[] = []
      for (let s = 0; s <= samples; s++) {
        const t = s / samples
        const mt = 1 - t
        const x = mt * mt * mt * -40 + 3 * mt * mt * t * cp1.x + 3 * mt * t * t * cp2.x + t * t * t * (WIDTH + 40)
        const y = mt * mt * mt * startY + 3 * mt * mt * t * cp1.y + 3 * mt * t * t * cp2.y + t * t * t * endY
        points.push({ x, y })
      }
      const thickness = baseThickness * rng.range(0.7, 1.2)
      let top = 'M '
      let bottom = ''
      for (let s = 0; s < points.length; s++) {
        const p = points[s]
        const next = points[Math.min(points.length - 1, s + 1)]
        const angle = Math.atan2(next.y - p.y, next.x - p.x) + Math.PI / 2
        const wobble = Math.sin(s * 0.3 + i) * twist * thickness * 0.3
        const w = thickness / 2 + wobble
        const tx = p.x + Math.cos(angle) * w
        const ty = p.y + Math.sin(angle) * w
        const bx = p.x - Math.cos(angle) * w
        const by = p.y - Math.sin(angle) * w
        top += `${s === 0 ? '' : 'L '}${round(tx)} ${round(ty)} `
        bottom = `L ${round(bx)} ${round(by)} ` + bottom
      }
      const d = top + bottom + 'Z'
      shapes.push({ shape: { kind: 'path' as const, d }, fill: rng.pick(palette), opacity: rng.range(0.75, 0.95) })
    }

    return {
      id: `ribbon-sculpture-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'ribbons', name: 'Ribbons', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'ribbon-sculpture', generatorName: 'Ribbon Sculpture', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
