import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { escapeIterations } from '@/engine/math/complexEscape'
import { sampleGrid, marchingSquaresFromGrid, segmentsToPathD, gridValueRange } from '@/engine/math/marchingSquares'

const WIDTH = 800
const HEIGHT = 800
const RESOLUTION = 110
const SPAN = 3.2 // Julia sets always live within |z| < 2, so a fixed view window works for every constant.

// Named "universes" — real Julia constants known to produce visually distinct connected/disconnected sets.
const UNIVERSES: Record<string, { re: number; im: number }> = {
  spiral: { re: -0.4, im: 0.6 },
  dendrite: { re: 0, im: 0.8 },
  rabbit: { re: -0.123, im: 0.745 },
  'san-marco': { re: -0.75, im: 0 },
  'siegel-disk': { re: -0.391, im: -0.587 },
}

const UNIVERSE_OPTIONS = [
  { label: 'Spiral', value: 'spiral' },
  { label: 'Dendrite', value: 'dendrite' },
  { label: 'Rabbit', value: 'rabbit' },
  { label: 'San Marco', value: 'san-marco' },
  { label: 'Siegel Disk', value: 'siegel-disk' },
  { label: 'Custom', value: 'custom' },
]

export const juliaOrbitsGenerator: GeneratorDefinition = {
  id: 'julia-orbits',
  name: 'Julia Orbits',
  category: 'mathematical',
  description: 'Escape-time contours from a Julia set — pick a named universe, or dial in your own complex constant.',
  tags: ['fractal', 'mathematical', 'recursive', 'complex-plane'],
  defaultParameters: {
    universe: 'spiral',
    real: -0.4,
    imaginary: 0.6,
    iterations: 40,
    density: 12,
    scale: 1,
  },
  parameterSchema: [
    { key: 'universe', label: 'Universe', type: 'select', group: 'shape', options: UNIVERSE_OPTIONS },
    { key: 'real', label: 'Real part', type: 'number', group: 'shape', min: -1.5, max: 1.5, step: 0.001, advanced: true },
    { key: 'imaginary', label: 'Imaginary part', type: 'number', group: 'shape', min: -1.5, max: 1.5, step: 0.001, advanced: true },
    { key: 'iterations', label: 'Complexity', type: 'number', group: 'variation', min: 15, max: 80, step: 1, semantic: 'complexity' },
    { key: 'density', label: 'Orbit density', type: 'number', group: 'pattern', min: 3, max: 26, step: 1, semantic: 'density' },
    { key: 'scale', label: 'Scale', type: 'number', group: 'shape', min: 0.5, max: 4, step: 0.05, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const universeKey = String(parameters.universe)
    const universe = universeKey === 'custom' ? { re: Number(parameters.real), im: Number(parameters.imaginary) } : UNIVERSES[universeKey]
    const iterations = Math.round(Number(parameters.iterations))
    const density = Math.round(Number(parameters.density))
    const scale = Number(parameters.scale)
    const palette = colors.length ? colors : ['#111111']

    const span = SPAN / scale
    const field = (px: number, py: number) => {
      const zx = (px / WIDTH - 0.5) * span
      const zy = (py / HEIGHT - 0.5) * span
      return escapeIterations(universe.re, universe.im, zx, zy, iterations)
    }
    const grid = sampleGrid(field, WIDTH, HEIGHT, RESOLUTION)
    // Threshold strictly within the field's observed range — a fixed [1, iterations-2] guess can miss
    // the field entirely at extreme zoom/iteration combinations, rendering nothing.
    const { min: rangeMin, max: rangeMax } = gridValueRange(grid)
    const lo = rangeMin + (rangeMax - rangeMin) * 0.06
    const hi = rangeMax - (rangeMax - rangeMin) * 0.06

    const shapes: StyledShape[] = []
    for (let i = 0; i < density; i++) {
      const threshold = lo + (i / Math.max(1, density - 1)) * (hi - lo)
      const segments = marchingSquaresFromGrid(grid, threshold)
      if (segments.length === 0) continue
      const t = i / Math.max(1, density - 1)
      shapes.push({
        shape: { kind: 'path', d: segmentsToPathD(segments) },
        stroke: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette),
        strokeWidth: 0.5 + (1 - t) * 1.2,
        fill: 'none',
        opacity: 0.35 + t * 0.55,
      })
    }

    return {
      id: `julia-orbits-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'orbits', name: 'Orbit Contours', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'julia-orbits', generatorName: 'Julia Orbits', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
