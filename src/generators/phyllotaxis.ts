import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800
const GOLDEN_ANGLE = 137.50776

const FORM_OPTIONS = [
  { label: 'Sunflower', value: 'sunflower' },
  { label: 'Pinecone', value: 'pinecone' },
  { label: 'Galaxy', value: 'galaxy' },
  { label: 'Shell', value: 'shell' },
  { label: 'Abstract bloom', value: 'bloom' },
]

// Each form is Vogel's model (angle = i * divergence, radius = c * sqrt(i)) with a different divergence
// angle and radius law — real botanical math: the divergence angle alone determines how many spiral
// "arms" appear to the eye, which is why these look so different despite sharing one formula.
const FORM_DIVERGENCE: Record<string, number> = {
  sunflower: GOLDEN_ANGLE,
  pinecone: 99.5,
  galaxy: GOLDEN_ANGLE,
  shell: 137.3,
  bloom: 151.15,
}

export const phyllotaxisGenerator: GeneratorDefinition = {
  id: 'phyllotaxis',
  name: 'Phyllotaxis',
  category: 'mathematical',
  description: 'Sunflower-seed spirals from Vogel’s model — one angle, repeated, produces the same packing pattern seen throughout nature.',
  tags: ['mathematical', 'organic', 'spiral', 'nature'],
  defaultParameters: {
    form: 'sunflower',
    points: 500,
    radiusScale: 1,
    jitter: 0,
    dotSize: 6,
    scaleVariation: 0.15,
  },
  parameterSchema: [
    { key: 'form', label: 'Form', type: 'select', group: 'shape', options: FORM_OPTIONS },
    { key: 'points', label: 'Point count', type: 'number', group: 'pattern', min: 60, max: 1600, step: 10, semantic: 'density' },
    { key: 'radiusScale', label: 'Scale', type: 'number', group: 'shape', min: 0.5, max: 1.6, step: 0.02, semantic: 'scale' },
    { key: 'jitter', label: 'Jitter', type: 'number', group: 'variation', min: 0, max: 0.4, step: 0.01, semantic: 'jitter' },
    { key: 'dotSize', label: 'Dot size', type: 'number', group: 'shape', min: 2, max: 14, step: 0.5, semantic: 'size' },
    { key: 'scaleVariation', label: 'Size variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const form = String(parameters.form)
    const pointCount = Math.round(Number(parameters.points))
    const radiusScale = Number(parameters.radiusScale)
    const jitter = Number(parameters.jitter)
    const dotSize = Number(parameters.dotSize)
    const scaleVariation = Number(parameters.scaleVariation)
    const palette = colors.length ? colors : ['#e8c547']

    const divergence = (FORM_DIVERGENCE[form] ?? GOLDEN_ANGLE) * (Math.PI / 180)
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxRadius = WIDTH * 0.46 * radiusScale
    const c = maxRadius / Math.sqrt(pointCount)

    const shapes: StyledShape[] = []
    for (let i = 0; i < pointCount; i++) {
      const t = i / pointCount
      const angle = i * divergence
      let radius: number
      if (form === 'shell') {
        // Logarithmic growth (nautilus-like tightening) instead of Vogel's sqrt growth.
        radius = maxRadius * Math.pow(t, 0.85)
      } else {
        radius = c * Math.sqrt(i)
      }
      const wobble = form === 'bloom' ? 1 + Math.sin(angle * 5) * 0.15 : 1
      const jx = rng.range(-jitter, jitter) * c
      const jy = rng.range(-jitter, jitter) * c
      const x = cx + Math.cos(angle) * radius * wobble + jx
      const y = cy + Math.sin(angle) * radius * wobble + jy
      const r = Math.max(0.6, dotSize * (form === 'galaxy' ? 1 - t * 0.7 : 1) * (1 + rng.range(-scaleVariation, scaleVariation)))
      const opacity = form === 'galaxy' ? 0.9 - t * 0.5 : rng.range(0.75, 1)

      shapes.push({ shape: { kind: 'circle', cx: x, cy: y, r }, fill: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette), opacity })
    }

    return {
      id: `phyllotaxis-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'seeds', name: 'Phyllotaxis Points', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'phyllotaxis', generatorName: 'Phyllotaxis', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
