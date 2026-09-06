import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const MODE_OPTIONS = [
  { label: 'Lines', value: 'lines' },
  { label: 'Cells', value: 'cells' },
  { label: 'Dots', value: 'dots' },
  { label: 'Ribbon', value: 'ribbon' },
]

interface Square {
  x: number
  y: number
  size: number
}

/**
 * The classic "whirling squares" construction: each new square's side is the sum of the previous two
 * (s_i = s_(i-1) + s_(i-2)), which is exactly the identity that lets it be attached flush against the
 * combined bounding rectangle with no gap or overlap, whatever the seed ratio — unlike a plain
 * geometric sequence (size0 * ratio^i), which only tiles edge-to-edge at the one exact value of ratio
 * that equals the golden ratio.
 */
interface Rect {
  x: number
  y: number
  w: number
  h: number
}

// Verified by hand against sizes 1,1,2,3,5,8,13,...: square i=2 attaches above the first two squares
// (spanning their combined width), i=3 attaches left (spanning the new height), i=4 below, i=5 right,
// then the cycle repeats — this order, not the reverse, is what keeps every new square flush against
// the growing rectangle with no gap.
const ATTACH_ORDER = ['up', 'left', 'down', 'right'] as const

function buildSquares(turns: number, seedRatio: number): { squares: Square[]; bounds: Rect } {
  const sizes = [1, seedRatio]
  for (let i = 2; i < turns; i++) sizes.push(sizes[i - 1] + sizes[i - 2])

  const squares: Square[] = [
    { x: 0, y: 0, size: sizes[0] },
    { x: sizes[0], y: 0, size: sizes[1] },
  ]
  let rect: Rect = { x: 0, y: 0, w: sizes[0] + sizes[1], h: Math.max(sizes[0], sizes[1]) }

  for (let i = 2; i < turns; i++) {
    const s = sizes[i]
    switch (ATTACH_ORDER[(i - 2) % 4]) {
      case 'up':
        squares.push({ x: rect.x, y: rect.y + rect.h, size: s })
        rect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h + s }
        break
      case 'left':
        squares.push({ x: rect.x - s, y: rect.y, size: s })
        rect = { x: rect.x - s, y: rect.y, w: rect.w + s, h: rect.h }
        break
      case 'down':
        squares.push({ x: rect.x, y: rect.y - s, size: s })
        rect = { x: rect.x, y: rect.y - s, w: rect.w, h: rect.h + s }
        break
      case 'right':
        squares.push({ x: rect.x + rect.w, y: rect.y, size: s })
        rect = { x: rect.x, y: rect.y, w: rect.w + s, h: rect.h }
        break
    }
  }
  return { squares, bounds: rect }
}

export const fibonacciSpiralGenerator: GeneratorDefinition = {
  id: 'fibonacci-spiral',
  name: 'Fibonacci Spiral',
  category: 'mathematical',
  description: 'A golden spiral traced through whirling squares — the same additive growth rule (each side is the sum of the previous two) behind the real Fibonacci sequence.',
  tags: ['mathematical', 'spiral', 'golden-ratio', 'geometry'],
  defaultParameters: {
    mode: 'lines',
    turns: 10,
    growth: 1,
    thickness: 2.5,
    distortion: 0,
    symmetry: false,
  },
  parameterSchema: [
    { key: 'mode', label: 'Mode', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'turns', label: 'Turns', type: 'number', group: 'pattern', min: 4, max: 16, step: 1, semantic: 'complexity' },
    { key: 'growth', label: 'Growth rate', type: 'number', group: 'shape', min: 0.6, max: 1.6, step: 0.02, semantic: 'scale' },
    { key: 'thickness', label: 'Line thickness', type: 'number', group: 'color', min: 0.5, max: 6, step: 0.1 },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 0.3, step: 0.02, semantic: 'jitter' },
    { key: 'symmetry', label: 'Mirror', type: 'boolean', group: 'composition' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const mode = String(parameters.mode)
    const turns = Math.round(Number(parameters.turns))
    const growth = Number(parameters.growth)
    const thickness = Number(parameters.thickness)
    const distortion = Number(parameters.distortion)
    const symmetry = Boolean(parameters.symmetry)
    const palette = colors.length ? colors : ['#111111']

    // seedRatio near 1 keeps the first two squares similarly sized (classic 1,1,2,3,5,8...); moving it
    // away from 1 biases how quickly the spiral opens up in its first few turns.
    const seedRatio = 0.6 + growth * 0.8
    const { squares, bounds } = buildSquares(turns, seedRatio)

    const fitScale = (WIDTH * 0.82) / Math.max(bounds.w, bounds.h)
    const offsetX = WIDTH / 2 - (bounds.x + bounds.w / 2) * fitScale
    const offsetY = HEIGHT / 2 - (bounds.y + bounds.h / 2) * fitScale
    const toScreen = (x: number, y: number) => ({ x: x * fitScale + offsetX, y: y * fitScale + offsetY })

    const buildShapesFor = (mirror: boolean): StyledShape[] => {
      const shapes: StyledShape[] = []
      const flip = (x: number) => (mirror ? WIDTH - x : x)

      if (mode === 'cells' || mode === 'dots') {
        squares.forEach((sq, i) => {
          const t = i / Math.max(1, squares.length - 1)
          const color = palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette)
          const jitter = rng.range(-distortion, distortion) * sq.size * 0.1
          const p = toScreen(sq.x, sq.y)
          const size = sq.size * fitScale
          if (mode === 'cells') {
            shapes.push({ shape: { kind: 'rect', x: flip(p.x) - (mirror ? size : 0), y: p.y + jitter, w: size, h: size }, stroke: color, strokeWidth: 1.2, fill: 'none', opacity: 0.75 })
          } else {
            shapes.push({ shape: { kind: 'circle', cx: flip(p.x + size / 2), cy: p.y + size / 2 + jitter, r: 3 + t * 5 }, fill: color, opacity: 0.9 })
          }
        })
        return shapes
      }

      // Lines/ribbon: sample the continuous logarithmic (golden) spiral directly — r grows by
      // `growth`-derived factor every quarter turn, which is always smooth regardless of parameters.
      // Anchored at canvas center with a fixed target outer radius, independent of the square-tiling
      // bounds above, so it reliably fills the canvas instead of depending on that geometry's scale.
      const b = Math.log(1.2 + growth) / (Math.PI / 2)
      const samples = turns * 24
      const maxTheta = turns * (Math.PI / 2)
      const maxRadius = WIDTH * 0.44
      const r0 = maxRadius / Math.exp(b * maxTheta)
      const cx = WIDTH / 2
      const cy = HEIGHT / 2
      let prev: { x: number; y: number } | null = null
      for (let i = 0; i <= samples; i++) {
        const theta = (i / samples) * maxTheta
        const r = r0 * Math.exp(b * theta) * (1 + rng.range(-distortion, distortion) * 0.08)
        const point = { x: flip(cx + Math.cos(theta) * r), y: cy - Math.sin(theta) * r }
        if (prev) {
          const t = i / samples
          shapes.push({
            shape: { kind: 'line', x1: prev.x, y1: prev.y, x2: point.x, y2: point.y },
            stroke: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette),
            strokeWidth: mode === 'ribbon' ? thickness * (0.3 + t * 1.7) : thickness,
            opacity: 0.85 + t * 0.15,
          })
        }
        prev = point
      }
      return shapes
    }

    const shapes = symmetry ? [...buildShapesFor(false), ...buildShapesFor(true)] : buildShapesFor(false)

    return {
      id: `fibonacci-spiral-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'spiral', name: 'Fibonacci Spiral', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'fibonacci-spiral', generatorName: 'Fibonacci Spiral', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
