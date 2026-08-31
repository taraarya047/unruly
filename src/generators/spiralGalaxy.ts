import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const spiralGalaxyGenerator: GeneratorDefinition = {
  id: 'spiral-galaxy',
  name: 'Spiral Galaxy',
  category: 'particles',
  description: 'Dust and stars scattered along sweeping galactic arms.',
  tags: ['space', 'particles', 'spiral', 'cosmic'],
  defaultParameters: {
    arms: 3,
    twist: 3.5,
    density: 320,
    thickness: 0.35,
  },
  parameterSchema: [
    { key: 'arms', label: 'Arms', type: 'number', group: 'shape', min: 1, max: 6, step: 1, semantic: 'complexity' },
    { key: 'twist', label: 'Twist', type: 'number', group: 'shape', min: 0.5, max: 6, step: 0.1 },
    { key: 'density', label: 'Star density', type: 'number', group: 'pattern', min: 40, max: 600, step: 10, semantic: 'density' },
    { key: 'thickness', label: 'Arm thickness', type: 'number', group: 'variation', min: 0.05, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const arms = Math.round(Number(parameters.arms))
    const twist = Number(parameters.twist)
    const density = Math.round(Number(parameters.density))
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxR = Math.min(WIDTH, HEIGHT) * 0.46

    const shapes = []
    for (let i = 0; i < density; i++) {
      const armIndex = i % arms
      const t = rng.range(0, 1)
      const r = maxR * Math.sqrt(t)
      const baseAngle = (armIndex / arms) * Math.PI * 2 + t * twist * Math.PI
      const spread = thickness * (1 - t * 0.4) * 0.6
      const angle = baseAngle + rng.range(-spread, spread)
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      const size = Math.max(0.6, rng.range(0.8, 3) * (1 - t * 0.3))
      shapes.push({
        shape: { kind: 'circle' as const, cx: x, cy: y, r: size },
        fill: rng.pick(palette),
        opacity: rng.range(0.4, 1),
      })
    }

    shapes.push({ shape: { kind: 'circle' as const, cx, cy, r: 16 }, fill: rng.pick(palette), opacity: 0.95 })

    return {
      id: `spiral-galaxy-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'stars', name: 'Stars', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'spiral-galaxy', generatorName: 'Spiral Galaxy', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
