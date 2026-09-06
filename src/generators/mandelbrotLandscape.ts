import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { escapeIterations } from '@/engine/math/complexEscape'
import { sampleGrid, marchingSquaresFromGrid, segmentsToPathD, gridValueRange } from '@/engine/math/marchingSquares'

const WIDTH = 800
const HEIGHT = 800
const RESOLUTION = 110

// Center + span (width of the sampled region in the complex plane) for each named region — real
// Mandelbrot-set coordinates, not approximations. "Custom" hands the same two numbers to the user.
const REGIONS: Record<string, { cx: number; cy: number; span: number }> = {
  classic: { cx: -0.5, cy: 0, span: 3.0 },
  'seahorse-valley': { cx: -0.75, cy: 0.1, span: 0.5 },
  'elephant-valley': { cx: 0.3, cy: 0, span: 0.3 },
  'spiral-storm': { cx: -0.16, cy: 1.0405, span: 0.06 },
}

const REGION_OPTIONS = [
  { label: 'Classic', value: 'classic' },
  { label: 'Seahorse Valley', value: 'seahorse-valley' },
  { label: 'Elephant Valley', value: 'elephant-valley' },
  { label: 'Spiral Storm', value: 'spiral-storm' },
]

const MODE_OPTIONS = [
  { label: 'Contours', value: 'contours' },
  { label: 'Boundary', value: 'boundary' },
  { label: 'Nested', value: 'nested' },
]

export const mandelbrotLandscapeGenerator: GeneratorDefinition = {
  id: 'mandelbrot-landscape',
  name: 'Mandelbrot Landscape',
  category: 'mathematical',
  description: 'Contour lines traced through the Mandelbrot set’s escape-time field — a real fractal, not a raster image.',
  tags: ['fractal', 'mathematical', 'recursive', 'complex-plane'],
  defaultParameters: {
    region: 'classic',
    zoom: 1,
    iterations: 45,
    contours: 14,
    thickness: 1.1,
    mode: 'contours',
  },
  parameterSchema: [
    { key: 'region', label: 'Region', type: 'select', group: 'shape', options: REGION_OPTIONS },
    { key: 'mode', label: 'Mode', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'zoom', label: 'Zoom', type: 'number', group: 'shape', min: 0.5, max: 30, step: 0.1, semantic: 'scale' },
    { key: 'iterations', label: 'Depth', type: 'number', group: 'variation', min: 15, max: 80, step: 1, semantic: 'complexity' },
    { key: 'contours', label: 'Contour count', type: 'number', group: 'pattern', min: 4, max: 26, step: 1, semantic: 'density' },
    { key: 'thickness', label: 'Line thickness', type: 'number', group: 'color', min: 0.4, max: 3, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const region = REGIONS[String(parameters.region)] ?? REGIONS.classic
    const zoom = Number(parameters.zoom)
    const iterations = Math.round(Number(parameters.iterations))
    const contours = Math.round(Number(parameters.contours))
    const thickness = Number(parameters.thickness)
    const mode = String(parameters.mode)
    const palette = colors.length ? colors : ['#111111']

    const span = region.span / zoom
    const field = (px: number, py: number) => {
      const cx = region.cx + (px / WIDTH - 0.5) * span
      const cy = region.cy + (py / HEIGHT - 0.5) * span
      return escapeIterations(cx, cy, 0, 0, iterations)
    }
    // Sample once, reuse for every threshold below (see topographic-map.ts for why this matters).
    const grid = sampleGrid(field, WIDTH, HEIGHT, RESOLUTION)
    // Threshold strictly within the field's observed range — a fixed [1, iterations-2] guess can miss
    // the field entirely at extreme zoom/region/iteration combinations, rendering nothing.
    const { min: rangeMin, max: rangeMax } = gridValueRange(grid)
    const lo = rangeMin + (rangeMax - rangeMin) * 0.04
    const hi = rangeMax - (rangeMax - rangeMin) * 0.04

    const shapes: StyledShape[] = []
    const thresholds = mode === 'boundary' ? [hi] : Array.from({ length: contours }, (_, i) => lo + (i / Math.max(1, contours - 1)) * (hi - lo))

    thresholds.forEach((threshold, i) => {
      const segments = marchingSquaresFromGrid(grid, threshold)
      if (segments.length === 0) return
      const depthT = i / Math.max(1, thresholds.length - 1)
      shapes.push({
        shape: { kind: 'path', d: segmentsToPathD(segments) },
        stroke: palette[Math.floor(depthT * (palette.length - 0.001))] ?? rng.pick(palette),
        strokeWidth: mode === 'nested' ? thickness * (0.5 + depthT) : thickness,
        fill: 'none',
        opacity: mode === 'boundary' ? 0.9 : 0.4 + depthT * 0.5,
      })
    })

    return {
      id: `mandelbrot-landscape-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'contours', name: 'Contour Lines', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'mandelbrot-landscape', generatorName: 'Mandelbrot Landscape', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
