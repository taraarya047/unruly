import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeNoiseField } from '@/engine/math/noise'

const WIDTH = 800
const HEIGHT = 800

const BASE_OPTIONS = [
  { label: 'Grid', value: 'grid' },
  { label: 'Circles', value: 'circles' },
  { label: 'Lines', value: 'lines' },
  { label: 'Polygons', value: 'polygons' },
]

const DISPLACEMENT_OPTIONS = [
  { label: 'Radial', value: 'radial' },
  { label: 'Noise', value: 'noise' },
  { label: 'Wave', value: 'wave' },
  { label: 'Vortex', value: 'vortex' },
  { label: 'Checker', value: 'checker' },
]

/** Every displacement mode returns a 2D offset for a given point — the base pattern never needs to know
 *  which one is active, so adding a new displacement mode never touches the base-pattern code. */
function displacementAt(x: number, y: number, mode: string, strength: number, noise: (x: number, y: number) => number): { dx: number; dy: number } {
  const cx = WIDTH / 2
  const cy = HEIGHT / 2
  const dx0 = x - cx
  const dy0 = y - cy
  const dist = Math.hypot(dx0, dy0) || 1
  switch (mode) {
    case 'radial':
      return { dx: (dx0 / dist) * strength * Math.sin(dist * 0.02), dy: (dy0 / dist) * strength * Math.sin(dist * 0.02) }
    case 'noise':
      return { dx: noise(x, y) * strength, dy: noise(y, x) * strength }
    case 'wave':
      return { dx: Math.sin(y * 0.03) * strength, dy: Math.cos(x * 0.03) * strength }
    case 'vortex': {
      const angle = Math.atan2(dy0, dx0) + strength * 0.01 * (400 / (dist + 40))
      const r = dist
      return { dx: Math.cos(angle) * r - dx0, dy: Math.sin(angle) * r - dy0 }
    }
    case 'checker': {
      const cell = 60
      const on = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0
      return { dx: on ? strength : -strength, dy: on ? -strength : strength }
    }
    default:
      return { dx: 0, dy: 0 }
  }
}

export const displacementMapGenerator: GeneratorDefinition = {
  id: 'displacement-map',
  name: 'Displacement Map',
  category: 'experimental',
  description: 'A plain base pattern pushed through a swappable displacement field — the same grid, circles, or lines read completely differently depending on what distorts them.',
  tags: ['field', 'distortion', 'hybrid', 'experimental'],
  defaultParameters: {
    base: 'grid',
    displacement: 'vortex',
    density: 16,
    strength: 0.6,
  },
  parameterSchema: [
    { key: 'base', label: 'Base pattern', type: 'select', group: 'shape', options: BASE_OPTIONS },
    { key: 'displacement', label: 'Displacement', type: 'select', group: 'shape', options: DISPLACEMENT_OPTIONS },
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 6, max: 30, step: 1, semantic: 'density' },
    { key: 'strength', label: 'Strength', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'complexity' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const base = String(parameters.base)
    const displacement = String(parameters.displacement)
    const density = Math.round(Number(parameters.density))
    const strength = Number(parameters.strength) * 40
    const palette = colors.length ? colors : ['#111111']
    const noise = makeNoiseField(rng.fork(1), 3)

    const cell = WIDTH / density
    const shapes: StyledShape[] = []

    const displace = (x: number, y: number) => {
      const { dx, dy } = displacementAt(x, y, displacement, strength, noise)
      return { x: x + dx, y: y + dy }
    }

    if (base === 'lines') {
      for (let i = 0; i <= density; i++) {
        const points: string[] = []
        for (let j = 0; j <= density * 2; j++) {
          const p = displace((j / (density * 2)) * WIDTH, i * cell)
          points.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        }
        shapes.push({ shape: { kind: 'path', d: `M ${points.join(' L ')}` }, stroke: rng.pick(palette), strokeWidth: 1.2, fill: 'none', opacity: 0.8 })
      }
    } else {
      for (let row = 0; row <= density; row++) {
        for (let col = 0; col <= density; col++) {
          const x0 = col * cell
          const y0 = row * cell
          const p = displace(x0, y0)
          const t = row / density
          const color = palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette)
          if (base === 'grid') {
            shapes.push({ shape: { kind: 'circle', cx: p.x, cy: p.y, r: 2 }, fill: color, opacity: 0.85 })
          } else if (base === 'circles') {
            shapes.push({ shape: { kind: 'circle', cx: p.x, cy: p.y, r: cell * 0.32 }, fill: 'none', stroke: color, strokeWidth: 1.2, opacity: 0.85 })
          } else {
            shapes.push({ shape: { kind: 'polygon', cx: p.x, cy: p.y, r: cell * 0.35, sides: 5 }, fill: color, opacity: 0.75 })
          }
        }
      }
    }

    return {
      id: `displacement-map-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'pattern', name: 'Displaced Pattern', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'displacement-map', generatorName: 'Displacement Map', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
