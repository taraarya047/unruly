import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const gravityWellGenerator: GeneratorDefinition = {
  id: 'gravity-well',
  name: 'Gravity Well',
  category: 'fields',
  description: 'Particles spiraling inward toward gravitational wells — tiny galaxies and whirlpools.',
  tags: ['spiral', 'particles', 'cosmic', 'space'],
  defaultParameters: {
    particleCount: 90,
    wells: 1,
    gravity: 0.6,
    spiralForce: 3,
  },
  parameterSchema: [
    { key: 'particleCount', label: 'Particles', type: 'number', group: 'pattern', min: 15, max: 200, step: 1, semantic: 'density' },
    { key: 'wells', label: 'Wells', type: 'number', group: 'composition', min: 1, max: 4, step: 1, advanced: true },
    { key: 'gravity', label: 'Gravity', type: 'number', group: 'shape', min: 0.1, max: 1, step: 0.02 },
    { key: 'spiralForce', label: 'Spiral force', type: 'number', group: 'variation', min: 0.5, max: 8, step: 0.1, semantic: 'complexity' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const particleCount = Math.round(Number(parameters.particleCount))
    const wellCount = Math.round(Number(parameters.wells))
    const gravity = Number(parameters.gravity)
    const spiralForce = Number(parameters.spiralForce)
    const palette = colors.length ? colors : ['#111111']

    const wells = Array.from({ length: wellCount }, () => ({
      x: wellCount === 1 ? WIDTH / 2 : rng.range(WIDTH * 0.25, WIDTH * 0.75),
      y: wellCount === 1 ? HEIGHT / 2 : rng.range(HEIGHT * 0.25, HEIGHT * 0.75),
    }))

    const shapes = []
    const samples = 40
    for (let i = 0; i < particleCount; i++) {
      const well = rng.pick(wells)
      const r0 = rng.range(40, Math.min(WIDTH, HEIGHT) * 0.46)
      const a0 = rng.range(0, Math.PI * 2)
      const direction = rng.sign()
      let d = ''
      for (let s = 0; s <= samples; s++) {
        const t = s / samples
        const r = r0 * Math.pow(1 - t, 0.4 + gravity)
        const a = a0 + direction * t * spiralForce
        const x = well.x + Math.cos(a) * r
        const y = well.y + Math.sin(a) * r
        d += `${s === 0 ? 'M' : 'L'} ${round(x)} ${round(y)} `
      }
      shapes.push({
        shape: { kind: 'path' as const, d: d.trim() },
        stroke: rng.pick(palette),
        strokeWidth: rng.range(0.75, 2),
        fill: 'none',
        opacity: rng.range(0.3, 0.75),
      })
    }

    for (const well of wells) shapes.push({ shape: { kind: 'circle' as const, cx: well.x, cy: well.y, r: 6 }, fill: rng.pick(palette), opacity: 1 })

    return {
      id: `gravity-well-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'spirals', name: 'Spirals', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'gravity-well', generatorName: 'Gravity Well', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
