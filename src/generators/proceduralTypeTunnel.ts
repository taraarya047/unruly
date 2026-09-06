import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { buildGlyph, placeGlyph, type GlyphStroke } from '@/engine/math/glyphs'

const WIDTH = 800
const HEIGHT = 800

export const proceduralTypeTunnelGenerator: GeneratorDefinition = {
  id: 'procedural-type-tunnel',
  name: 'Procedural Type Tunnel',
  category: 'illustrative',
  description: 'The same handful of abstract glyphs, repeated in shrinking, rotating rings toward a vanishing point — typography traveling through a generative tunnel.',
  tags: ['typography', 'illustrative', 'perspective', 'pattern'],
  defaultParameters: {
    depth: 12,
    repetition: 8,
    rotationPerRing: 12,
    curvature: 0.3,
  },
  parameterSchema: [
    { key: 'depth', label: 'Depth', type: 'number', group: 'pattern', min: 6, max: 20, step: 1, semantic: 'complexity' },
    { key: 'repetition', label: 'Glyphs per ring', type: 'number', group: 'pattern', min: 4, max: 14, step: 1, semantic: 'density' },
    { key: 'rotationPerRing', label: 'Twist per ring', type: 'angle', group: 'variation', min: 0, max: 40, step: 1, semantic: 'rotation' },
    { key: 'curvature', label: 'Curvature', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const depth = Math.round(Number(parameters.depth))
    const repetition = Math.round(Number(parameters.repetition))
    const twistPerRingRad = (Number(parameters.rotationPerRing) * Math.PI) / 180
    const curvature = Number(parameters.curvature)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2

    const vocabulary: GlyphStroke[][] = Array.from({ length: 3 + Math.floor(rng.range(0, 3)) }, () => buildGlyph(rng, 0.4))

    const shapes: StyledShape[] = []
    for (let ring = 0; ring < depth; ring++) {
      const t = ring / (depth - 1 || 1)
      // Perspective: rings shrink and fade with depth; curvature bends the tunnel's central axis away
      // from a straight line, so it reads as receding through a curved passage rather than a flat funnel.
      const radius = WIDTH * 0.44 * (1 - t * 0.92)
      const ringTwist = ring * twistPerRingRad
      const axisBend = Math.sin(t * Math.PI * 1.3) * curvature * WIDTH * 0.18
      const ringCx = cx + axisBend
      const glyphScale = radius * 0.32 + 4

      for (let g = 0; g < repetition; g++) {
        const angle = (g / repetition) * Math.PI * 2 + ringTwist
        const px = ringCx + Math.cos(angle) * radius
        const py = cy + Math.sin(angle) * radius * 0.62
        const glyph = rng.pick(vocabulary)
        const color = palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette)
        for (const d of placeGlyph(glyph, px, py, glyphScale, angle + Math.PI / 2)) {
          shapes.push({ shape: { kind: 'path', d }, stroke: color, strokeWidth: Math.max(0.6, 3 * (1 - t)), fill: 'none', opacity: 0.4 + (1 - t) * 0.6 })
        }
      }
    }

    return {
      id: `procedural-type-tunnel-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'tunnel', name: 'Type Tunnel', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'procedural-type-tunnel', generatorName: 'Procedural Type Tunnel', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
