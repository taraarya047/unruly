import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const BASE_OPTIONS = [
  { label: 'Rings', value: 'rings' },
  { label: 'Spokes', value: 'spokes' },
  { label: 'Grid', value: 'grid' },
]

/**
 * Built natively in polar coordinates (radius, angle) rather than warping an existing Cartesian grid —
 * a radial wave adds a periodic ripple to the radius as a function of angle, an angular wave adds a
 * periodic wobble to the angle as a function of radius; combining both is what makes the concentric
 * rings/spokes read as "breathing" rather than simply wavy.
 */
export const polarDistortionGenerator: GeneratorDefinition = {
  id: 'polar-distortion',
  name: 'Polar Distortion',
  category: 'optical',
  description: 'Rings and spokes built directly in polar coordinates, then rippled by radial and angular waves — a native polar distortion, not a warped Cartesian grid.',
  tags: ['optical', 'field', 'geometric', 'radial'],
  defaultParameters: {
    base: 'rings',
    radialWaves: 6,
    radialAmount: 0.15,
    angularWaves: 8,
    angularAmount: 0.2,
    rings: 18,
  },
  parameterSchema: [
    { key: 'base', label: 'Base', type: 'select', group: 'shape', options: BASE_OPTIONS },
    { key: 'rings', label: 'Ring count', type: 'number', group: 'pattern', min: 6, max: 36, step: 1, semantic: 'density' },
    { key: 'radialWaves', label: 'Radial waves', type: 'number', group: 'variation', min: 0, max: 16, step: 1 },
    { key: 'radialAmount', label: 'Radial wave strength', type: 'number', group: 'variation', min: 0, max: 0.4, step: 0.01, semantic: 'jitter' },
    { key: 'angularWaves', label: 'Angular waves', type: 'number', group: 'variation', min: 0, max: 16, step: 1 },
    { key: 'angularAmount', label: 'Angular wave strength', type: 'number', group: 'variation', min: 0, max: 0.4, step: 0.01, semantic: 'complexity' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const base = String(parameters.base)
    const ringCount = Math.round(Number(parameters.rings))
    const radialWaves = Number(parameters.radialWaves)
    const radialAmount = Number(parameters.radialAmount)
    const angularWaves = Number(parameters.angularWaves)
    const angularAmount = Number(parameters.angularAmount)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxR = WIDTH * 0.46

    const distortedPoint = (radius: number, angle: number) => {
      const r = radius * (1 + radialAmount * Math.sin(angle * radialWaves))
      const a = angle + angularAmount * Math.sin((radius / maxR) * Math.PI * angularWaves)
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
    }

    const shapes: StyledShape[] = []
    if (base === 'rings') {
      for (let i = 1; i <= ringCount; i++) {
        const radius = (i / ringCount) * maxR
        const points: string[] = []
        for (let a = 0; a <= 128; a++) {
          const p = distortedPoint(radius, (a / 128) * Math.PI * 2)
          points.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        }
        shapes.push({ shape: { kind: 'path', d: `M ${points.join(' L ')} Z` }, stroke: rng.pick(palette), strokeWidth: 1.2, fill: 'none', opacity: 0.8 })
      }
    } else if (base === 'spokes') {
      const spokeCount = Math.max(6, ringCount)
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i / spokeCount) * Math.PI * 2
        const points: string[] = []
        for (let r = 0; r <= 40; r++) {
          const p = distortedPoint((r / 40) * maxR, angle)
          points.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        }
        shapes.push({ shape: { kind: 'path', d: `M ${points.join(' L ')}` }, stroke: rng.pick(palette), strokeWidth: 1.2, fill: 'none', opacity: 0.8 })
      }
    } else {
      for (let i = 1; i <= ringCount; i++) {
        const radius = (i / ringCount) * maxR
        const points: string[] = []
        for (let a = 0; a <= 128; a++) {
          const p = distortedPoint(radius, (a / 128) * Math.PI * 2)
          points.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        }
        shapes.push({ shape: { kind: 'path', d: `M ${points.join(' L ')} Z` }, stroke: rng.pick(palette), strokeWidth: 1, fill: 'none', opacity: 0.7 })
      }
      const spokeCount = Math.max(6, Math.round(ringCount * 0.7))
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i / spokeCount) * Math.PI * 2
        const points: string[] = []
        for (let r = 0; r <= 40; r++) {
          const p = distortedPoint((r / 40) * maxR, angle)
          points.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        }
        shapes.push({ shape: { kind: 'path', d: `M ${points.join(' L ')}` }, stroke: rng.pick(palette), strokeWidth: 1, fill: 'none', opacity: 0.7 })
      }
    }

    return {
      id: `polar-distortion-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'pattern', name: 'Polar Pattern', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'polar-distortion', generatorName: 'Polar Distortion', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
