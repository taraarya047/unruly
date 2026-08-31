import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const orbitalSystemGenerator: GeneratorDefinition = {
  id: 'orbital-system',
  name: 'Orbital System',
  category: 'mathematical',
  description: 'Rings of particles orbiting invisible centers, like a planetary diagram.',
  tags: ['orbits', 'circles', 'diagram', 'space'],
  defaultParameters: {
    orbits: 6,
    particlesPerOrbit: 5,
    eccentricity: 0.15,
    variation: 0.2,
  },
  parameterSchema: [
    { key: 'orbits', label: 'Orbits', type: 'number', group: 'pattern', min: 1, max: 14, step: 1, semantic: 'density' },
    { key: 'particlesPerOrbit', label: 'Particles per orbit', type: 'number', group: 'shape', min: 1, max: 12, step: 1, semantic: 'complexity' },
    { key: 'eccentricity', label: 'Eccentricity', type: 'number', group: 'shape', min: 0, max: 0.8, step: 0.02 },
    { key: 'variation', label: 'Variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const orbits = Math.round(Number(parameters.orbits))
    const particlesPerOrbit = Math.round(Number(parameters.particlesPerOrbit))
    const eccentricity = Number(parameters.eccentricity)
    const variation = Number(parameters.variation)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxR = Math.min(WIDTH, HEIGHT) * 0.44

    const ringShapes = []
    const particleShapes = []
    for (let o = 0; o < orbits; o++) {
      const rBase = ((o + 1) / orbits) * maxR
      const rx = rBase
      const ry = rBase * (1 - eccentricity)
      const tilt = rng.range(0, Math.PI)
      const samples = 72
      let d = ''
      for (let s = 0; s <= samples; s++) {
        const a = (s / samples) * Math.PI * 2
        const ex = Math.cos(a) * rx
        const ey = Math.sin(a) * ry
        const x = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt)
        const y = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)
        d += `${s === 0 ? 'M' : 'L'} ${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10} `
      }
      ringShapes.push({ shape: { kind: 'path' as const, d: d.trim() }, stroke: '#8884', strokeWidth: 1, fill: 'none', opacity: 0.5 })

      const orbitColor = rng.pick(palette)
      const phaseOffset = rng.range(0, Math.PI * 2)
      for (let p = 0; p < particlesPerOrbit; p++) {
        const a = phaseOffset + (p / particlesPerOrbit) * Math.PI * 2
        const ex = Math.cos(a) * rx
        const ey = Math.sin(a) * ry
        const x = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt)
        const y = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)
        const r = Math.max(1.5, 6 * (1 + rng.range(-variation, variation)))
        particleShapes.push({ shape: { kind: 'circle' as const, cx: x, cy: y, r }, fill: orbitColor, opacity: rng.range(0.85, 1) })
      }
    }

    particleShapes.push({ shape: { kind: 'circle' as const, cx, cy, r: 14 }, fill: rng.pick(palette), opacity: 1 })

    return {
      id: `orbital-system-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [
        { id: 'orbits', name: 'Orbits', visible: true, locked: false, opacity: 1, shapes: ringShapes },
        { id: 'particles', name: 'Particles', visible: true, locked: false, opacity: 1, shapes: particleShapes },
      ],
      metadata: { generatorId: 'orbital-system', generatorName: 'Orbital System', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
