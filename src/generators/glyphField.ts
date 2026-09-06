import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { buildGlyph, placeGlyph, type GlyphStroke } from '@/engine/math/glyphs'

const WIDTH = 800
const HEIGHT = 800

export const glyphFieldGenerator: GeneratorDefinition = {
  id: 'glyph-field',
  name: 'Glyph Field',
  category: 'illustrative',
  description: 'A field of small abstract glyphs, all drawn from the same underlying grammar — reads like a page of an alien alphabet.',
  tags: ['typography', 'illustrative', 'abstract', 'pattern'],
  defaultParameters: {
    vocabulary: 5,
    density: 12,
    glyphComplexity: 0.4,
    variation: 0.3,
  },
  parameterSchema: [
    { key: 'vocabulary', label: 'Vocabulary size', type: 'number', group: 'shape', min: 2, max: 10, step: 1, semantic: 'complexity' },
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 4, max: 22, step: 1, semantic: 'density' },
    { key: 'glyphComplexity', label: 'Glyph complexity', type: 'number', group: 'shape', min: 0.1, max: 1, step: 0.02 },
    { key: 'variation', label: 'Scale/rotation variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const vocabularySize = Math.round(Number(parameters.vocabulary))
    const density = Math.round(Number(parameters.density))
    const glyphComplexity = Number(parameters.glyphComplexity)
    const variation = Number(parameters.variation)
    const palette = colors.length ? colors : ['#111111']

    // A fixed vocabulary of glyphs, reused across the whole field — every cell picks one of these
    // rather than generating a brand new glyph, which is what makes the field read as one consistent
    // "alphabet" instead of unrelated noise at every position.
    const vocabulary: GlyphStroke[][] = Array.from({ length: vocabularySize }, () => buildGlyph(rng, glyphComplexity))

    const cell = WIDTH / density
    const shapes: StyledShape[] = []
    for (let row = 0; row < density; row++) {
      for (let col = 0; col < density; col++) {
        const glyph = rng.pick(vocabulary)
        const cx = col * cell + cell / 2 + rng.range(-variation, variation) * cell * 0.2
        const cy = row * cell + cell / 2 + rng.range(-variation, variation) * cell * 0.2
        const scale = (cell * 0.38) * (1 + rng.range(-variation, variation) * 0.5)
        const rotation = rng.range(-variation, variation) * Math.PI
        const color = rng.pick(palette)
        for (const d of placeGlyph(glyph, cx, cy, scale, rotation)) {
          shapes.push({ shape: { kind: 'path', d }, stroke: color, strokeWidth: Math.max(1, cell * 0.06), fill: 'none', opacity: 0.9 })
        }
      }
    }

    return {
      id: `glyph-field-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'glyphs', name: 'Glyph Field', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'glyph-field', generatorName: 'Glyph Field', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
