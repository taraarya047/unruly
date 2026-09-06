import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { sampleGrid, marchingSquaresFromGrid, segmentsToPathD } from '@/engine/math/marchingSquares'

const WIDTH = 800
const HEIGHT = 800
const RESOLUTION = 100

/**
 * A fast, well-known approximation of Turing/reaction-diffusion patterns: sum several plane waves that
 * all share one characteristic wavelength but random orientations and phases. Constraining every mode to
 * the same wavelength (rather than the many-octave noise other texture generators use) is what produces
 * the regular spot/stripe/labyrinth spacing real reaction-diffusion systems settle into — a genuine
 * reaction-diffusion PDE simulation (iterative, much more expensive) is reserved for a later Reaction
 * Diffusion generator; this is a deliberately different, one-shot spectral technique.
 */
function buildField(rng: ReturnType<typeof createRng>, modeCount: number, wavelength: number, alignment: number) {
  const baseAngle = rng.range(0, Math.PI)
  const modes = Array.from({ length: modeCount }, () => {
    const angle = baseAngle + rng.range(-1, 1) * (1 - alignment) * Math.PI
    return { kx: Math.cos(angle) / wavelength, ky: Math.sin(angle) / wavelength, phase: rng.range(0, Math.PI * 2) }
  })
  return (x: number, y: number) => modes.reduce((sum, m) => sum + Math.cos(x * m.kx * Math.PI * 2 + y * m.ky * Math.PI * 2 + m.phase), 0) / modeCount
}

export const turingPatternsGenerator: GeneratorDefinition = {
  id: 'turing-patterns',
  name: 'Turing Patterns',
  category: 'mathematical',
  description: 'Spots, stripes, or a labyrinth — the regular spacing that falls out of summing several waves at one shared wavelength, the same spacing real reaction-diffusion systems settle into.',
  tags: ['mathematical', 'organic', 'texture', 'emergent'],
  defaultParameters: {
    wavelength: 60,
    alignment: 0.15,
    modeCount: 6,
    threshold: 0,
    thickness: 1.5,
  },
  parameterSchema: [
    { key: 'wavelength', label: 'Scale', type: 'number', group: 'shape', min: 25, max: 120, step: 1, semantic: 'scale' },
    { key: 'alignment', label: 'Alignment (stripes ↔ spots)', type: 'number', group: 'shape', min: 0, max: 1, step: 0.02 },
    { key: 'modeCount', label: 'Complexity', type: 'number', group: 'variation', min: 2, max: 12, step: 1, semantic: 'complexity' },
    { key: 'threshold', label: 'Threshold', type: 'number', group: 'pattern', min: -0.6, max: 0.6, step: 0.02 },
    { key: 'thickness', label: 'Line thickness', type: 'number', group: 'color', min: 0.5, max: 4, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const wavelength = Number(parameters.wavelength)
    const alignment = Number(parameters.alignment)
    const modeCount = Math.round(Number(parameters.modeCount))
    const threshold = Number(parameters.threshold)
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']

    const field = buildField(rng, modeCount, wavelength, alignment)
    const grid = sampleGrid(field, WIDTH, HEIGHT, RESOLUTION)
    const segments = marchingSquaresFromGrid(grid, threshold)

    const shapes: StyledShape[] = [
      {
        shape: { kind: 'path', d: segmentsToPathD(segments) },
        stroke: rng.pick(palette),
        strokeWidth: thickness,
        fill: 'none',
        opacity: 0.9,
      },
    ]

    return {
      id: `turing-patterns-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'pattern', name: 'Turing Pattern', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'turing-patterns', generatorName: 'Turing Patterns', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
