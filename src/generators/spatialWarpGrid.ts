import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const WARP_OPTIONS = [
  { label: 'Pinch', value: 'pinch' },
  { label: 'Bulge', value: 'bulge' },
  { label: 'Twist', value: 'twist' },
  { label: 'Barrel', value: 'barrel' },
  { label: 'Fisheye', value: 'fisheye' },
  { label: 'Vortex', value: 'vortex' },
  { label: 'Wave', value: 'wave' },
]

interface Pt {
  x: number
  y: number
}

function warpPoint(p: Pt, center: Pt, type: string, strength: number, radius: number, frequency: number): Pt {
  const dx = p.x - center.x
  const dy = p.y - center.y
  const dist = Math.hypot(dx, dy)
  const t = Math.min(1, dist / radius)
  const angle = Math.atan2(dy, dx)

  switch (type) {
    case 'pinch': {
      const r = dist * Math.pow(t, strength * 2)
      return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r }
    }
    case 'bulge': {
      const r = dist * (1 + (1 - t) * strength)
      return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r }
    }
    case 'twist': {
      const a = angle + (1 - t) * strength * Math.PI
      return { x: center.x + Math.cos(a) * dist, y: center.y + Math.sin(a) * dist }
    }
    case 'barrel': {
      const k = strength * 0.6
      const r = dist * (1 + k * t * t)
      return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r }
    }
    case 'fisheye': {
      const r = radius * Math.pow(t, 1 / (1 + strength * 3))
      return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r }
    }
    case 'vortex': {
      const a = angle + strength * 4 * Math.exp(-t * 3)
      return { x: center.x + Math.cos(a) * dist, y: center.y + Math.sin(a) * dist }
    }
    case 'wave':
      return { x: p.x + Math.sin((p.y / WIDTH) * Math.PI * 2 * frequency) * strength * 30, y: p.y + Math.cos((p.x / HEIGHT) * Math.PI * 2 * frequency) * strength * 30 }
    default:
      return p
  }
}

export const spatialWarpGridGenerator: GeneratorDefinition = {
  id: 'spatial-warp-grid',
  name: 'Spatial Warp Grid',
  category: 'optical',
  description: 'A plain graph-paper grid, pushed through a single deformation field — the grid lines themselves become the instrument that reveals the warp.',
  tags: ['optical', 'field', 'distortion', 'grid'],
  defaultParameters: {
    warpType: 'vortex',
    density: 20,
    strength: 0.6,
    radius: 300,
    frequency: 2,
  },
  parameterSchema: [
    { key: 'warpType', label: 'Warp', type: 'select', group: 'shape', options: WARP_OPTIONS },
    { key: 'density', label: 'Grid density', type: 'number', group: 'pattern', min: 8, max: 40, step: 1, semantic: 'density' },
    { key: 'strength', label: 'Strength', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'complexity' },
    { key: 'radius', label: 'Radius', type: 'number', group: 'shape', min: 100, max: 500, step: 10, semantic: 'scale' },
    { key: 'frequency', label: 'Frequency (wave)', type: 'number', group: 'pattern', min: 1, max: 8, step: 0.5, advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const warpType = String(parameters.warpType)
    const density = Math.round(Number(parameters.density))
    const strength = Number(parameters.strength)
    const radius = Number(parameters.radius)
    const frequency = Number(parameters.frequency)
    const palette = colors.length ? colors : ['#111111']
    const center = { x: WIDTH / 2, y: HEIGHT / 2 }

    const cell = WIDTH / density
    const shapes: StyledShape[] = []

    const warpAndSegment = (points: Pt[]) => points.map((p) => warpPoint(p, center, warpType, strength, radius, frequency))

    for (let i = 0; i <= density; i++) {
      const raw: Pt[] = []
      for (let j = 0; j <= density; j++) raw.push({ x: i * cell, y: j * cell })
      const warped = warpAndSegment(raw)
      shapes.push({
        shape: { kind: 'path', d: `M ${warped.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}` },
        stroke: rng.pick(palette),
        strokeWidth: 1,
        fill: 'none',
        opacity: 0.75,
      })
    }
    for (let j = 0; j <= density; j++) {
      const raw: Pt[] = []
      for (let i = 0; i <= density; i++) raw.push({ x: i * cell, y: j * cell })
      const warped = warpAndSegment(raw)
      shapes.push({
        shape: { kind: 'path', d: `M ${warped.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}` },
        stroke: rng.pick(palette),
        strokeWidth: 1,
        fill: 'none',
        opacity: 0.75,
      })
    }

    return {
      id: `spatial-warp-grid-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'grid', name: 'Warped Grid', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'spatial-warp-grid', generatorName: 'Spatial Warp Grid', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
