import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

const MODE_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Opposing', value: 'opposing' },
  { label: 'Orbital', value: 'orbital' },
  { label: 'Random', value: 'random' },
]

interface Magnet {
  x: number
  y: number
  sign: number
}

function buildMagnets(mode: string, count: number, rng: ReturnType<typeof createRng>): Magnet[] {
  const cx = WIDTH / 2
  const cy = HEIGHT / 2
  if (mode === 'single') return [{ x: cx, y: cy, sign: 1 }]
  if (mode === 'opposing')
    return [
      { x: cx - 140, y: cy, sign: 1 },
      { x: cx + 140, y: cy, sign: -1 },
    ]
  if (mode === 'orbital') {
    const r = 200
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, sign: i % 2 === 0 ? 1 : -1 }
    })
  }
  return Array.from({ length: count }, () => ({ x: rng.range(100, WIDTH - 100), y: rng.range(100, HEIGHT - 100), sign: rng.sign() }))
}

export const magneticLinesGenerator: GeneratorDefinition = {
  id: 'magnetic-lines',
  name: 'Magnetic Lines',
  category: 'fields',
  description: 'Lines bending around invisible magnets, like filings on a field diagram.',
  tags: ['field', 'lines', 'magnetic', 'curves'],
  defaultParameters: {
    lineCount: 60,
    magnetCount: 3,
    attraction: 0.5,
    curvature: 0.5,
    magnetMode: 'opposing',
  },
  parameterSchema: [
    { key: 'lineCount', label: 'Lines', type: 'number', group: 'pattern', min: 10, max: 140, step: 1, semantic: 'density' },
    { key: 'magnetCount', label: 'Magnets', type: 'number', group: 'shape', min: 1, max: 8, step: 1, advanced: true },
    { key: 'attraction', label: 'Attraction', type: 'number', group: 'shape', min: 0.1, max: 1, step: 0.02 },
    { key: 'curvature', label: 'Curvature', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'magnetMode', label: 'Arrangement', type: 'select', group: 'composition', options: MODE_OPTIONS },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const lineCount = Math.round(Number(parameters.lineCount))
    const magnetCount = Math.round(Number(parameters.magnetCount))
    const attraction = Number(parameters.attraction)
    const curvature = Number(parameters.curvature)
    const magnetMode = String(parameters.magnetMode)
    const palette = colors.length ? colors : ['#111111']

    const magnets = buildMagnets(magnetMode, magnetCount, rng)
    const steps = 60
    const stepSize = 8

    const shapes = []
    for (let i = 0; i < lineCount; i++) {
      let x = rng.range(0, WIDTH)
      let y = rng.range(0, HEIGHT)
      let angle = rng.range(0, Math.PI * 2)
      let d = `M ${round(x)} ${round(y)} `
      for (let s = 0; s < steps; s++) {
        let fx = 0
        let fy = 0
        for (const m of magnets) {
          const dx = m.x - x
          const dy = m.y - y
          const distSq = Math.max(400, dx * dx + dy * dy)
          const weight = (m.sign * attraction) / distSq
          fx += dx * weight
          fy += dy * weight
        }
        const targetAngle = Math.atan2(fy, fx)
        let diff = targetAngle - angle
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        angle += diff * curvature * 0.3 + rng.range(-0.05, 0.05)
        x += Math.cos(angle) * stepSize
        y += Math.sin(angle) * stepSize
        d += `L ${round(x)} ${round(y)} `
        if (x < -40 || x > WIDTH + 40 || y < -40 || y > HEIGHT + 40) break
      }
      shapes.push({
        shape: { kind: 'path' as const, d: d.trim() },
        stroke: rng.pick(palette),
        strokeWidth: 1,
        fill: 'none',
        opacity: rng.range(0.4, 0.85),
      })
    }

    return {
      id: `magnetic-lines-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'lines', name: 'Lines', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'magnetic-lines', generatorName: 'Magnetic Lines', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
