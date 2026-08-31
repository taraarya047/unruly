import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

const TYPE_OPTIONS = [
  { label: 'Logarithmic', value: 'logarithmic' },
  { label: 'Archimedean', value: 'archimedean' },
]

export const spiralShellGenerator: GeneratorDefinition = {
  id: 'spiral-shell',
  name: 'Spiral Shell',
  category: 'mathematical',
  description: 'A nautilus-shell spiral with chamber lines, nested and mirrored.',
  tags: ['spiral', 'shell', 'nature', 'geometric'],
  defaultParameters: {
    turns: 4,
    nestedCount: 2,
    chamberLines: 24,
    spiralType: 'logarithmic',
  },
  parameterSchema: [
    { key: 'turns', label: 'Turns', type: 'number', group: 'shape', min: 1, max: 7, step: 0.25, semantic: 'complexity' },
    { key: 'nestedCount', label: 'Nested copies', type: 'number', group: 'pattern', min: 1, max: 4, step: 1, semantic: 'density' },
    { key: 'chamberLines', label: 'Chamber lines', type: 'number', group: 'variation', min: 0, max: 48, step: 1 },
    { key: 'spiralType', label: 'Curve', type: 'select', group: 'composition', options: TYPE_OPTIONS, advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const turns = Number(parameters.turns)
    const nestedCount = Math.round(Number(parameters.nestedCount))
    const chamberLines = Math.round(Number(parameters.chamberLines))
    const spiralType = String(parameters.spiralType)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxR = Math.min(WIDTH, HEIGHT) * 0.42
    const samples = 200

    const radiusAt = (t: number) => (spiralType === 'archimedean' ? t : (Math.exp(t * 1.05) - 1) / (Math.exp(turns * 1.05) - 1))

    const shapes = []
    for (let n = 0; n < nestedCount; n++) {
      const rotationOffset = (n / nestedCount) * Math.PI * 2
      const color = rng.pick(palette)
      let d = ''
      const trace: { x: number; y: number }[] = []
      for (let s = 0; s <= samples; s++) {
        const t = (s / samples) * turns
        const r = radiusAt(t) * maxR
        const angle = t * Math.PI * 2 + rotationOffset
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        trace.push({ x, y })
        d += `${s === 0 ? 'M' : 'L'} ${round(x)} ${round(y)} `
      }
      shapes.push({ shape: { kind: 'path' as const, d: d.trim() }, stroke: color, strokeWidth: 2, fill: 'none', opacity: 0.9 })

      if (chamberLines > 0) {
        const step = Math.max(1, Math.floor(trace.length / chamberLines))
        for (let i = step; i < trace.length; i += step) {
          const p = trace[i]
          const prev = trace[i - 1]
          const tangentAngle = Math.atan2(p.y - prev.y, p.x - prev.x) + Math.PI / 2
          const dist = Math.hypot(p.x - cx, p.y - cy) * 0.18
          shapes.push({
            shape: {
              kind: 'line' as const,
              x1: round(p.x - Math.cos(tangentAngle) * dist),
              y1: round(p.y - Math.sin(tangentAngle) * dist),
              x2: round(p.x + Math.cos(tangentAngle) * dist),
              y2: round(p.y + Math.sin(tangentAngle) * dist),
            },
            stroke: color,
            strokeWidth: 1,
            fill: 'none',
            opacity: 0.4,
          })
        }
      }
    }

    return {
      id: `spiral-shell-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'shell', name: 'Shell', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'spiral-shell', generatorName: 'Spiral Shell', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
