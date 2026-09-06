import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { buildGlyph, placeGlyph } from '@/engine/math/glyphs'

const WIDTH = 800
const HEIGHT = 800

/**
 * The master spec describes this as building a monogram from user-typed initials — the app's parameter
 * system only has number/angle/select/boolean controls, with no free-text input anywhere, so literal
 * character input isn't available without a larger parameter-type change. This delivers the same visual
 * idea (1-3 abstract, stroke-based letterforms overlapped into one mark, no real font involved) using
 * the seed to pick which abstract "characters" appear, rather than user-typed text.
 */
export const generativeMonogramGenerator: GeneratorDefinition = {
  id: 'generative-monogram',
  name: 'Generative Monogram',
  category: 'illustrative',
  description: 'Two or three abstract stroke-built letterforms overlapped into a single mark — a monogram with no real font or text input behind it.',
  tags: ['typography', 'illustrative', 'monogram', 'abstract'],
  defaultParameters: {
    characterCount: 2,
    overlap: 0.4,
    strokeWidth: 20,
    symmetry: 0.5,
    distortion: 0.05,
  },
  parameterSchema: [
    { key: 'characterCount', label: 'Characters', type: 'number', group: 'composition', min: 1, max: 3, step: 1 },
    { key: 'overlap', label: 'Overlap', type: 'number', group: 'composition', min: 0, max: 0.7, step: 0.02 },
    { key: 'strokeWidth', label: 'Stroke weight', type: 'number', group: 'shape', min: 8, max: 40, step: 1, semantic: 'size' },
    { key: 'symmetry', label: 'Rotational spread', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 0.3, step: 0.01, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const characterCount = Math.round(Number(parameters.characterCount))
    const overlap = Number(parameters.overlap)
    const strokeWidth = Number(parameters.strokeWidth)
    const symmetry = Number(parameters.symmetry)
    const distortion = Number(parameters.distortion)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const scale = WIDTH * 0.3

    const shapes: StyledShape[] = []
    for (let i = 0; i < characterCount; i++) {
      const glyph = buildGlyph(rng, 0.5)
      // Characters fan out rotationally as `symmetry` increases, and shrink toward the shared center as
      // `overlap` increases — the two controls together span everything from three separated glyphs to
      // one fully-merged mark.
      const angle = characterCount > 1 ? ((i - (characterCount - 1) / 2) / characterCount) * Math.PI * symmetry : 0
      const offset = (1 - overlap) * scale * 0.5 * (characterCount > 1 ? 1 : 0)
      const px = cx + Math.sin(angle) * offset
      const py = cy - Math.cos(angle) * offset * 0.3
      const color = palette[i % palette.length] ?? rng.pick(palette)
      for (const d of placeGlyph(glyph, px, py, scale * (1 - overlap * 0.25), angle * 0.4 + rng.range(-distortion, distortion))) {
        shapes.push({ shape: { kind: 'path', d }, stroke: color, strokeWidth, fill: 'none', opacity: 0.85 })
      }
    }

    return {
      id: `generative-monogram-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'monogram', name: 'Monogram', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'generative-monogram', generatorName: 'Generative Monogram', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
