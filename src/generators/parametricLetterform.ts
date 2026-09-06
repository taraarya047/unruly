import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { buildGlyph, placeGlyph } from '@/engine/math/glyphs'

const WIDTH = 800
const HEIGHT = 800

export const parametricLetterformGenerator: GeneratorDefinition = {
  id: 'parametric-letterform',
  name: 'Parametric Letterform',
  category: 'illustrative',
  description: 'One large abstract character built from strokes, bars, and bowls — a real typographic grammar with no actual font behind it.',
  tags: ['typography', 'illustrative', 'abstract', 'geometric'],
  defaultParameters: {
    complexity: 0.5,
    strokeWidth: 22,
    curvature: 0.5,
    distortion: 0.1,
    symmetry: false,
  },
  parameterSchema: [
    { key: 'complexity', label: 'Glyph complexity', type: 'number', group: 'shape', min: 0.1, max: 1, step: 0.02, semantic: 'complexity' },
    { key: 'strokeWidth', label: 'Stroke thickness', type: 'number', group: 'shape', min: 8, max: 45, step: 1, semantic: 'size' },
    { key: 'curvature', label: 'Curvature bias', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02 },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 0.3, step: 0.01, semantic: 'jitter' },
    { key: 'symmetry', label: 'Mirror', type: 'boolean', group: 'composition' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const complexity = Number(parameters.complexity)
    const strokeWidth = Number(parameters.strokeWidth)
    const distortion = Number(parameters.distortion)
    const symmetry = Boolean(parameters.symmetry)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const scale = WIDTH * 0.32

    const glyph = buildGlyph(rng, complexity)
    const jitter = rng.range(-distortion, distortion)
    const buildStrokes = (mirror: boolean): StyledShape[] =>
      placeGlyph(glyph, cx, cy, scale, jitter, mirror).map((d) => ({
        shape: { kind: 'path', d },
        stroke: rng.pick(palette),
        strokeWidth,
        fill: 'none',
        opacity: 0.95,
      }))

    const shapes = symmetry ? [...buildStrokes(false), ...buildStrokes(true)] : buildStrokes(false)

    return {
      id: `parametric-letterform-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'glyph', name: 'Letterform', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'parametric-letterform', generatorName: 'Parametric Letterform', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
