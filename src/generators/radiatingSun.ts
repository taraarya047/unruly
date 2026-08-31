import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const radiatingSunGenerator: GeneratorDefinition = {
  id: 'radiating-sun',
  name: 'Radiating Sun',
  category: 'mathematical',
  description: 'A sunburst of curved, alternating rays — more sophisticated than a basic starburst.',
  tags: ['sun', 'rays', 'radial', 'symmetry'],
  defaultParameters: {
    rayCount: 32,
    curvature: 0.25,
    variation: 0.3,
    alternating: true,
  },
  parameterSchema: [
    { key: 'rayCount', label: 'Rays', type: 'number', group: 'pattern', min: 6, max: 80, step: 1, semantic: 'density' },
    { key: 'curvature', label: 'Curvature', type: 'number', group: 'shape', min: 0, max: 0.6, step: 0.02 },
    { key: 'variation', label: 'Length variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'alternating', label: 'Alternating', type: 'boolean', group: 'composition' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const rayCount = Math.round(Number(parameters.rayCount))
    const curvature = Number(parameters.curvature)
    const variation = Number(parameters.variation)
    const alternating = Boolean(parameters.alternating)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxLen = Math.min(WIDTH, HEIGHT) * 0.44
    const baseR = 30

    const shapes: StyledShape[] = []
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2
      const shortRay = alternating && i % 2 === 1
      const length = maxLen * (shortRay ? 0.55 : 1) * (1 + rng.range(-variation, variation) * 0.3)
      const width = ((Math.PI * 2) / rayCount) * baseR * 1.6
      const perp = angle + Math.PI / 2

      const base1 = { x: cx + Math.cos(angle) * baseR + Math.cos(perp) * width * 0.5, y: cy + Math.sin(angle) * baseR + Math.sin(perp) * width * 0.5 }
      const base2 = { x: cx + Math.cos(angle) * baseR - Math.cos(perp) * width * 0.5, y: cy + Math.sin(angle) * baseR - Math.sin(perp) * width * 0.5 }
      const tip = { x: cx + Math.cos(angle) * (baseR + length), y: cy + Math.sin(angle) * (baseR + length) }
      const bend = curvature * length
      const control = { x: cx + Math.cos(angle) * (baseR + length * 0.5) + Math.cos(perp) * bend, y: cy + Math.sin(angle) * (baseR + length * 0.5) + Math.sin(perp) * bend }

      const d = `M ${round(base1.x)} ${round(base1.y)} Q ${round(control.x)} ${round(control.y)} ${round(tip.x)} ${round(tip.y)} Q ${round(control.x)} ${round(control.y)} ${round(base2.x)} ${round(base2.y)} Z`
      shapes.push({ shape: { kind: 'path', d }, fill: rng.pick(palette), opacity: rng.range(0.75, 1) })
    }
    shapes.push({ shape: { kind: 'circle', cx, cy, r: baseR }, fill: rng.pick(palette), opacity: 1 })

    return {
      id: `radiating-sun-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'sun', name: 'Sun', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'radiating-sun', generatorName: 'Radiating Sun', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
