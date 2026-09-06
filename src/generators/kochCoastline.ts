import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const MODE_OPTIONS = [
  { label: 'Snowflake', value: 'snowflake' },
  { label: 'Coastline', value: 'coastline' },
  { label: 'Border', value: 'border' },
  { label: 'Circular', value: 'circular' },
]

interface Pt {
  x: number
  y: number
}

/** Recursive Koch subdivision of one segment — the peak angle and a distortion amount are the only knobs. */
function subdivide(p1: Pt, p2: Pt, depth: number, angle: number, distortion: number, rng: Rng, out: Pt[]) {
  if (depth === 0) {
    out.push(p2)
    return
  }
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const a = { x: p1.x + dx / 3, y: p1.y + dy / 3 }
  const b = { x: p1.x + (dx * 2) / 3, y: p1.y + (dy * 2) / 3 }
  const segLen = Math.hypot(dx, dy) / 3
  const baseAngle = Math.atan2(dy, dx)
  const peakSign = distortion > 0 && rng.bool(distortion) ? -1 : 1
  const peakAngle = baseAngle - angle * peakSign + rng.range(-distortion, distortion) * 0.6
  const peakLen = segLen * (1 + rng.range(-distortion, distortion) * 0.3)
  const peak = { x: a.x + Math.cos(peakAngle) * peakLen, y: a.y + Math.sin(peakAngle) * peakLen }
  subdivide(p1, a, depth - 1, angle, distortion, rng, out)
  subdivide(a, peak, depth - 1, angle, distortion, rng, out)
  subdivide(peak, b, depth - 1, angle, distortion, rng, out)
  subdivide(b, p2, depth - 1, angle, distortion, rng, out)
}

function kochPath(points: Pt[], depth: number, angle: number, distortion: number, rng: Rng): Pt[] {
  const out: Pt[] = [points[0]]
  for (let i = 0; i < points.length - 1; i++) subdivide(points[i], points[i + 1], depth, angle, distortion, rng, out)
  return out
}

function toPathD(points: Pt[], close: boolean): string {
  const [first, ...rest] = points
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ` + rest.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)} `).join('') + (close ? 'Z' : '')
}

export const kochCoastlineGenerator: GeneratorDefinition = {
  id: 'koch-coastline',
  name: 'Koch Coastline',
  category: 'mathematical',
  description: 'Recursive Koch curves — the same self-similar subdivision rule that models real coastline roughness.',
  tags: ['fractal', 'mathematical', 'recursive', 'coastline'],
  defaultParameters: {
    mode: 'snowflake',
    iterations: 4,
    angle: 60,
    distortion: 0.1,
    scale: 1,
    sides: 8,
  },
  parameterSchema: [
    { key: 'mode', label: 'Mode', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'iterations', label: 'Iterations', type: 'number', group: 'variation', min: 1, max: 5, step: 1, semantic: 'complexity' },
    { key: 'angle', label: 'Peak sharpness', type: 'angle', group: 'shape', min: 20, max: 100, step: 1, semantic: 'rotation' },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 0.5, step: 0.01, semantic: 'jitter' },
    { key: 'scale', label: 'Scale', type: 'number', group: 'shape', min: 0.5, max: 1.3, step: 0.02, semantic: 'scale' },
    { key: 'sides', label: 'Sides (circular)', type: 'number', group: 'pattern', min: 5, max: 16, step: 1, semantic: 'density', advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const mode = String(parameters.mode)
    const depth = Math.round(Number(parameters.iterations))
    const angleDeg = Number(parameters.angle)
    const angle = (angleDeg * Math.PI) / 180
    const distortion = Number(parameters.distortion)
    const scale = Number(parameters.scale)
    const sides = Math.round(Number(parameters.sides))
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2

    let basePoints: Pt[]
    let close = false
    if (mode === 'snowflake' || mode === 'circular') {
      const n = mode === 'snowflake' ? 3 : sides
      const r = (WIDTH * 0.35 * scale) / (n <= 4 ? 1 : n / 6)
      basePoints = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
      })
      basePoints.push(basePoints[0])
      close = true
    } else if (mode === 'border') {
      const r = WIDTH * 0.38 * scale
      basePoints = [
        { x: cx - r, y: cy - r },
        { x: cx + r, y: cy - r },
        { x: cx + r, y: cy + r },
        { x: cx - r, y: cy + r },
        { x: cx - r, y: cy - r },
      ]
      close = true
    } else {
      basePoints = [
        { x: WIDTH * 0.08, y: HEIGHT * 0.55 },
        { x: WIDTH * 0.92, y: HEIGHT * 0.55 * scale + HEIGHT * (1 - scale) * 0.5 },
      ]
      close = false
    }

    const curve = kochPath(basePoints, depth, angle, distortion, rng)

    const shapes: StyledShape[] = [
      {
        shape: { kind: 'path', d: toPathD(curve, close) },
        stroke: rng.pick(palette),
        strokeWidth: 1.4,
        fill: close && mode !== 'border' ? rng.pick(palette) : 'none',
        opacity: close && mode !== 'border' ? 0.18 : 0.9,
      },
    ]

    return {
      id: `koch-coastline-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'curve', name: 'Koch Curve', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'koch-coastline', generatorName: 'Koch Coastline', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
