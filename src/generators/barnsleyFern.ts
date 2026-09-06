import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

interface Affine {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
  p: number // selection probability, all four must sum to 1
}

// Classic Barnsley fern IFS (four affine maps, weighted-random selection each step). "Coral" and
// "abstract" reuse the exact same machinery with hand-tuned coefficients — real IFS attractors, not a
// cosmetic recolor of the fern.
const SYSTEMS: Record<string, Affine[]> = {
  fern: [
    { a: 0, b: 0, c: 0, d: 0.16, e: 0, f: 0, p: 0.01 },
    { a: 0.85, b: 0.04, c: -0.04, d: 0.85, e: 0, f: 1.6, p: 0.85 },
    { a: 0.2, b: -0.26, c: 0.23, d: 0.22, e: 0, f: 1.6, p: 0.07 },
    { a: -0.15, b: 0.28, c: 0.26, d: 0.24, e: 0, f: 0.44, p: 0.07 },
  ],
  coral: [
    { a: 0, b: 0, c: 0, d: 0.25, e: 0, f: 0, p: 0.02 },
    { a: 0.75, b: -0.15, c: 0.15, d: 0.78, e: 0.1, f: 1.4, p: 0.78 },
    { a: 0.28, b: 0.32, c: -0.28, d: 0.3, e: 0.1, f: 0.8, p: 0.1 },
    { a: -0.3, b: 0.3, c: 0.3, d: 0.28, e: -0.1, f: 0.7, p: 0.1 },
  ],
  'abstract-leaf': [
    { a: 0, b: 0, c: 0, d: 0.2, e: 0, f: 0, p: 0.03 },
    { a: 0.82, b: 0.1, c: -0.1, d: 0.82, e: 0, f: 1.2, p: 0.75 },
    { a: 0.15, b: -0.34, c: 0.34, d: 0.15, e: 0.05, f: 1.5, p: 0.11 },
    { a: -0.2, b: 0.34, c: 0.3, d: 0.2, e: -0.05, f: 0.6, p: 0.11 },
  ],
}

const MODE_OPTIONS = [
  { label: 'Fern', value: 'fern' },
  { label: 'Coral', value: 'coral' },
  { label: 'Abstract leaf', value: 'abstract-leaf' },
]

function pickTransform(system: Affine[], rng: Rng): Affine {
  const r = rng.next()
  let cumulative = 0
  for (const t of system) {
    cumulative += t.p
    if (r <= cumulative) return t
  }
  return system[system.length - 1]
}

export const barnsleyFernGenerator: GeneratorDefinition = {
  id: 'barnsley-fern',
  name: 'Barnsley Fern',
  category: 'organic',
  description: 'A procedural plant grown from an iterated function system — the same four-rule math botanists use to model real fern growth.',
  tags: ['fractal', 'organic', 'recursive', 'plant'],
  defaultParameters: {
    style: 'fern',
    points: 4500,
    scale: 1,
    jitter: 0.02,
    symmetry: false,
  },
  parameterSchema: [
    { key: 'style', label: 'Style', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'points', label: 'Density', type: 'number', group: 'pattern', min: 500, max: 6000, step: 100, semantic: 'density' },
    { key: 'scale', label: 'Scale', type: 'number', group: 'shape', min: 0.5, max: 1.6, step: 0.05, semantic: 'scale' },
    { key: 'jitter', label: 'Variation', type: 'number', group: 'variation', min: 0, max: 0.15, step: 0.005, semantic: 'jitter' },
    { key: 'symmetry', label: 'Mirror', type: 'boolean', group: 'composition' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const system = SYSTEMS[String(parameters.style)] ?? SYSTEMS.fern
    const pointCount = Math.round(Number(parameters.points))
    const scale = Number(parameters.scale)
    const jitter = Number(parameters.jitter)
    const symmetry = Boolean(parameters.symmetry)
    const palette = colors.length ? colors : ['#2d5a27']

    // Fern-space coordinates span roughly x in [-2.5, 2.5], y in [0, 10] — map bottom-anchored into canvas.
    const toScreen = (x: number, y: number, mirror: boolean) => ({
      x: WIDTH / 2 + (mirror ? -x : x) * (WIDTH / 6) * scale,
      y: HEIGHT - y * (HEIGHT / 11) * scale - HEIGHT * 0.03,
    })

    const shapes: StyledShape[] = []
    let x = 0
    let y = 0
    for (let i = 0; i < pointCount; i++) {
      const t = pickTransform(system, rng)
      const nx = t.a * x + t.b * y + t.e
      const ny = t.c * x + t.d * y + t.f
      x = nx
      y = ny
      if (i < 20) continue // discard the initial transient before the attractor settles
      const jx = x + rng.range(-jitter, jitter)
      const jy = y + rng.range(-jitter, jitter)
      const heightT = Math.min(1, y / 10)
      const p = toScreen(jx, jy, false)
      shapes.push({
        shape: { kind: 'circle', cx: p.x, cy: p.y, r: 0.9 + (1 - heightT) * 0.6 },
        fill: palette[Math.floor(heightT * (palette.length - 0.001))] ?? rng.pick(palette),
        opacity: rng.range(0.65, 0.95),
      })
      if (symmetry) {
        const pm = toScreen(jx, jy, true)
        shapes.push({
          shape: { kind: 'circle', cx: pm.x, cy: pm.y, r: 0.9 + (1 - heightT) * 0.6 },
          fill: palette[Math.floor(heightT * (palette.length - 0.001))] ?? rng.pick(palette),
          opacity: rng.range(0.65, 0.95),
        })
      }
    }

    return {
      id: `barnsley-fern-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'fern', name: 'Fern', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'barnsley-fern', generatorName: 'Barnsley Fern', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
