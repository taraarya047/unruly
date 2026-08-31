import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeNoiseField } from '@/engine/math/noise'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const liquidSwirlGenerator: GeneratorDefinition = {
  id: 'liquid-swirl',
  name: 'Liquid Swirl',
  category: 'organic',
  description: 'Thick fluid ribbons swirling around invisible vortices.',
  tags: ['fluid', 'organic', 'flow', 'ribbons'],
  defaultParameters: {
    ribbonCount: 26,
    vortexCount: 2,
    turbulence: 0.35,
    thickness: 10,
  },
  parameterSchema: [
    { key: 'ribbonCount', label: 'Ribbons', type: 'number', group: 'pattern', min: 6, max: 60, step: 1, semantic: 'density' },
    { key: 'vortexCount', label: 'Vortices', type: 'number', group: 'composition', min: 1, max: 5, step: 1, advanced: true },
    { key: 'turbulence', label: 'Turbulence', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'thickness', label: 'Thickness', type: 'number', group: 'shape', min: 2, max: 24, step: 1, semantic: 'size' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const ribbonCount = Math.round(Number(parameters.ribbonCount))
    const vortexCount = Math.round(Number(parameters.vortexCount))
    const turbulence = Number(parameters.turbulence)
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']
    const field = makeNoiseField(rng, 3)

    const vortices = Array.from({ length: vortexCount }, () => ({
      x: rng.range(WIDTH * 0.25, WIDTH * 0.75),
      y: rng.range(HEIGHT * 0.25, HEIGHT * 0.75),
      spin: rng.sign(),
    }))

    const shapes = []
    const steps = 70
    for (let i = 0; i < ribbonCount; i++) {
      let x = rng.range(0, WIDTH)
      let y = rng.range(0, HEIGHT)
      let d = `M ${round(x)} ${round(y)} `
      for (let s = 0; s < steps; s++) {
        const nearest = vortices.reduce((best, v) => {
          const dist = Math.hypot(v.x - x, v.y - y)
          return dist < best.dist ? { v, dist } : best
        }, { v: vortices[0], dist: Infinity })
        const dx = nearest.v.x - x
        const dy = nearest.v.y - y
        const dist = Math.max(30, nearest.dist)
        const tangentAngle = Math.atan2(dy, dx) + (Math.PI / 2) * nearest.v.spin
        const pull = Math.min(0.6, 4000 / (dist * dist))
        const noiseAngle = field(x, y) * Math.PI * turbulence
        const angle = tangentAngle + noiseAngle
        const step = 9
        x += Math.cos(angle) * step * (1 - pull * 0.3)
        y += Math.sin(angle) * step * (1 - pull * 0.3)
        d += `L ${round(x)} ${round(y)} `
        if (x < -50 || x > WIDTH + 50 || y < -50 || y > HEIGHT + 50) break
      }
      shapes.push({
        shape: { kind: 'path' as const, d: d.trim() },
        stroke: rng.pick(palette),
        strokeWidth: thickness * rng.range(0.5, 1.3),
        fill: 'none',
        opacity: rng.range(0.4, 0.85),
      })
    }

    return {
      id: `liquid-swirl-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'ribbons', name: 'Ribbons', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'liquid-swirl', generatorName: 'Liquid Swirl', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
