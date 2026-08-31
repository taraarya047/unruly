import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const spiralGenerator: GeneratorDefinition = {
  id: 'spiral',
  name: 'Spiral',
  category: 'lines',
  description: 'Multi-armed spirals radiating from the center.',
  defaultParameters: {
    arms: 3,
    turns: 5,
    spacing: 26,
    thickness: 2,
    jitter: 0.1,
  },
  parameterSchema: [
    { key: 'arms', label: 'Arms', type: 'number', group: 'shape', min: 1, max: 8, step: 1, semantic: 'complexity' },
    { key: 'turns', label: 'Turns', type: 'number', group: 'pattern', min: 1, max: 10, step: 0.5, semantic: 'density' },
    { key: 'spacing', label: 'Spacing', type: 'number', group: 'pattern', min: 8, max: 60, step: 1 },
    { key: 'thickness', label: 'Thickness', type: 'number', group: 'shape', min: 0.5, max: 10, step: 0.5 },
    { key: 'jitter', label: 'Jitter', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const arms = Math.round(Number(parameters.arms))
    const turns = Number(parameters.turns)
    const spacing = Number(parameters.spacing)
    const thickness = Number(parameters.thickness)
    const jitter = Number(parameters.jitter)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const samples = 240

    const shapes = []
    for (let a = 0; a < arms; a++) {
      const offset = (a / arms) * Math.PI * 2
      const armJitter = rng.range(-jitter, jitter) * 0.4
      let d = ''
      for (let s = 0; s <= samples; s++) {
        const t = s / samples
        const theta = t * turns * Math.PI * 2
        const r = spacing * t * turns * (1 + armJitter)
        const wobble = 1 + Math.sin(theta * 3 + a) * jitter * 0.08
        const x = cx + Math.cos(theta + offset) * r * wobble
        const y = cy + Math.sin(theta + offset) * r * wobble
        d += `${s === 0 ? 'M' : 'L'} ${round(x)} ${round(y)} `
      }
      shapes.push({
        shape: { kind: 'path' as const, d: d.trim() },
        stroke: rng.pick(palette),
        strokeWidth: thickness,
        fill: 'none',
        opacity: rng.range(0.75, 1),
      })
    }

    return {
      id: `spiral-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'spiral', name: 'Spiral', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'spiral', generatorName: 'Spiral', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
