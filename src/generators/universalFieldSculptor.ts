import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'
import { makeNoiseField } from '@/engine/math/noise'
import { jitteredGridPoints } from '@/engine/math/points'

const WIDTH = 800
const HEIGHT = 800

const FIELD_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Radial', value: 'radial' },
  { label: 'Vortex', value: 'vortex' },
  { label: 'Noise', value: 'noise' },
  { label: 'Wave', value: 'wave' },
  { label: 'Spiral', value: 'spiral' },
]

const PRESET_OPTIONS = [
  { label: 'Galaxy', value: 'galaxy' },
  { label: 'Storm', value: 'storm' },
  { label: 'Whirlpool', value: 'whirlpool' },
  { label: 'Magnetic', value: 'magnetic' },
  { label: 'Bloom', value: 'bloom' },
  { label: 'Solar', value: 'solar' },
  { label: 'Tornado', value: 'tornado' },
  { label: 'Organic', value: 'organic' },
  { label: 'Chaos', value: 'chaos' },
  { label: 'Custom', value: 'custom' },
]

const PRESETS: Record<string, { field1: string; field2: string; strength1: number; strength2: number }> = {
  galaxy: { field1: 'spiral', field2: 'noise', strength1: 0.8, strength2: 0.2 },
  storm: { field1: 'vortex', field2: 'noise', strength1: 0.7, strength2: 0.5 },
  whirlpool: { field1: 'vortex', field2: 'radial', strength1: 0.8, strength2: -0.4 },
  magnetic: { field1: 'vortex', field2: 'radial', strength1: 0.5, strength2: 0.3 },
  bloom: { field1: 'radial', field2: 'wave', strength1: 0.6, strength2: 0.2 },
  solar: { field1: 'radial', field2: 'spiral', strength1: 0.5, strength2: 0.4 },
  tornado: { field1: 'vortex', field2: 'wave', strength1: 0.9, strength2: 0.3 },
  organic: { field1: 'noise', field2: 'wave', strength1: 0.6, strength2: 0.3 },
  chaos: { field1: 'noise', field2: 'vortex', strength1: 0.7, strength2: 0.7 },
}

interface FieldContext {
  cx: number
  cy: number
  noise: (x: number, y: number) => number
}

/** Every field type returns a displacement vector at (x,y) — combining several is just summing these,
 *  which is the whole trick behind treating "which fields are active" as a stack rather than a single
 *  hard-coded formula. */
function fieldVector(type: string, x: number, y: number, strength: number, scale: number, ctx: FieldContext): { dx: number; dy: number } {
  if (type === 'none' || strength === 0) return { dx: 0, dy: 0 }
  const dx0 = x - ctx.cx
  const dy0 = y - ctx.cy
  const dist = Math.hypot(dx0, dy0) || 1
  switch (type) {
    case 'radial':
      return { dx: (dx0 / dist) * strength * scale, dy: (dy0 / dist) * strength * scale }
    case 'vortex':
      return { dx: (-dy0 / dist) * strength * scale, dy: (dx0 / dist) * strength * scale }
    case 'spiral':
      return {
        dx: ((dx0 - dy0) / dist / Math.SQRT2) * strength * scale,
        dy: ((dy0 + dx0) / dist / Math.SQRT2) * strength * scale,
      }
    case 'wave':
      return { dx: Math.sin((y / HEIGHT) * Math.PI * 4) * strength * scale, dy: Math.cos((x / WIDTH) * Math.PI * 4) * strength * scale }
    case 'noise': {
      const n = ctx.noise(x, y)
      return { dx: Math.cos(n * Math.PI * 2) * strength * scale, dy: Math.sin(n * Math.PI * 2) * strength * scale }
    }
    default:
      return { dx: 0, dy: 0 }
  }
}

function scatterShapes(rng: Rng, count: number, field1: string, s1: number, field2: string, s2: number, palette: string[]): StyledShape[] {
  const ctx: FieldContext = { cx: WIDTH / 2, cy: HEIGHT / 2, noise: makeNoiseField(rng.fork(1), 3) }
  const points = jitteredGridPoints(rng, count, WIDTH, HEIGHT, 0.6)
  const scale = 26

  const shapes: StyledShape[] = []
  for (const p of points) {
    const v1 = fieldVector(field1, p.x, p.y, s1, scale, ctx)
    const v2 = fieldVector(field2, p.x, p.y, s2, scale, ctx)
    const dx = v1.dx + v2.dx
    const dy = v1.dy + v2.dy
    const magnitude = Math.min(1, Math.hypot(dx, dy) / (scale * 1.4))

    // The combined field's magnitude and direction drive position, size, rotation, and opacity together
    // — a "field sculptor" in the sense that one underlying force reshapes several visual properties at
    // once, not just displacing points.
    const x = p.x + dx
    const y = p.y + dy
    const size = 3 + magnitude * 10
    const rotation = Math.atan2(dy, dx)
    const opacity = 0.4 + magnitude * 0.6
    const color = palette[Math.floor(magnitude * (palette.length - 0.001))] ?? rng.pick(palette)

    shapes.push({
      shape: { kind: 'rect', x: x - size / 2, y: y - size / 6, w: size, h: size / 3, rotation: (rotation * 180) / Math.PI },
      fill: color,
      opacity,
    })
  }
  return shapes
}

export const universalFieldSculptorGenerator: GeneratorDefinition = {
  id: 'universal-field-sculptor',
  name: 'Universal Field Sculptor',
  category: 'fields',
  description: 'Two combinable named fields sculpt a whole scatter of shapes at once — their combined direction and strength drive position, rotation, size, and color together.',
  tags: ['field', 'flagship', 'composite', 'flow'],
  defaultParameters: {
    preset: 'galaxy',
    field1: 'spiral',
    strength1: 0.8,
    field2: 'noise',
    strength2: 0.2,
    density: 30,
  },
  parameterSchema: [
    { key: 'preset', label: 'Preset', type: 'select', group: 'shape', options: PRESET_OPTIONS },
    { key: 'field1', label: 'Field 1', type: 'select', group: 'shape', options: FIELD_OPTIONS, advanced: true },
    { key: 'strength1', label: 'Field 1 strength', type: 'number', group: 'variation', min: -1, max: 1, step: 0.02, advanced: true },
    { key: 'field2', label: 'Field 2', type: 'select', group: 'shape', options: FIELD_OPTIONS, advanced: true },
    { key: 'strength2', label: 'Field 2 strength', type: 'number', group: 'variation', min: -1, max: 1, step: 0.02, advanced: true },
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 10, max: 80, step: 1, semantic: 'density' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const presetName = String(parameters.preset)
    const preset = PRESETS[presetName]
    const field1 = preset ? preset.field1 : String(parameters.field1)
    const field2 = preset ? preset.field2 : String(parameters.field2)
    const strength1 = preset ? preset.strength1 : Number(parameters.strength1)
    const strength2 = preset ? preset.strength2 : Number(parameters.strength2)
    const density = Math.round(Number(parameters.density))
    const palette = colors.length ? colors : ['#111111']

    const shapes = scatterShapes(rng, density * density, field1, strength1, field2, strength2, palette)

    return {
      id: `universal-field-sculptor-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'field', name: 'Sculpted Field', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'universal-field-sculptor', generatorName: 'Universal Field Sculptor', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
