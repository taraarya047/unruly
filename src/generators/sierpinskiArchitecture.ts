import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800
const MAX_SHAPES = 6000

const MODE_OPTIONS = [
  { label: 'Triangle', value: 'triangle' },
  { label: 'Carpet', value: 'carpet' },
  { label: 'Cross', value: 'cross' },
  { label: 'Hybrid', value: 'hybrid' },
]

interface Pt {
  x: number
  y: number
}

function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function inset(p1: Pt, p2: Pt, p3: Pt, gap: number): Pt[] {
  const cx = (p1.x + p2.x + p3.x) / 3
  const cy = (p1.y + p2.y + p3.y) / 3
  const shrink = (p: Pt) => ({ x: p.x + (cx - p.x) * gap, y: p.y + (cy - p.y) * gap })
  return [shrink(p1), shrink(p2), shrink(p3)]
}

function triangle(p1: Pt, p2: Pt, p3: Pt, depth: number, invert: boolean, gap: number, out: Pt[][]) {
  if (out.length > MAX_SHAPES) return
  if (depth === 0) {
    out.push(invert ? [p1, p2, p3] : inset(p1, p2, p3, gap))
    return
  }
  const m12 = mid(p1, p2)
  const m23 = mid(p2, p3)
  const m31 = mid(p3, p1)
  if (invert) {
    // Keep only the center — the "inversion" of the classic rule, which keeps the three corners.
    triangle(m12, m23, m31, depth - 1, invert, gap, out)
  } else {
    triangle(p1, m12, m31, depth - 1, invert, gap, out)
    triangle(m12, p2, m23, depth - 1, invert, gap, out)
    triangle(m31, m23, p3, depth - 1, invert, gap, out)
  }
}

/** Square subdivision into a 3x3 grid; `keep` decides which of the 9 cells survive each level. */
function squareGrid(x: number, y: number, size: number, depth: number, gap: number, keep: (row: number, col: number) => boolean, out: { x: number; y: number; size: number }[]) {
  if (out.length > MAX_SHAPES) return
  if (depth === 0) {
    const g = (size * gap) / 2
    out.push({ x: x + g, y: y + g, size: size - g * 2 })
    return
  }
  const s = size / 3
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (!keep(row, col)) continue
      squareGrid(x + col * s, y + row * s, s, depth - 1, gap, keep, out)
    }
  }
}

function polygonD(points: Pt[]): string {
  return `M ${points.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')} Z`
}

export const sierpinskiArchitectureGenerator: GeneratorDefinition = {
  id: 'sierpinski-architecture',
  name: 'Sierpinski Architecture',
  category: 'mathematical',
  description: 'Recursive triangle and square subdivisions, self-similar at every scale — a structural fractal, not a decorative pattern.',
  tags: ['fractal', 'mathematical', 'recursive', 'tessellation'],
  defaultParameters: {
    mode: 'triangle',
    depth: 5,
    gap: 0.05,
    rotation: 0,
    inversion: false,
  },
  parameterSchema: [
    { key: 'mode', label: 'Mode', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'depth', label: 'Recursion', type: 'number', group: 'variation', min: 1, max: 7, step: 1, semantic: 'complexity' },
    { key: 'gap', label: 'Gap', type: 'number', group: 'pattern', min: 0, max: 0.3, step: 0.01 },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 360, step: 1, semantic: 'rotation' },
    { key: 'inversion', label: 'Invert', type: 'boolean', group: 'variation' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng: Rng = createRng(seed)
    const mode = String(parameters.mode)
    const depth = Math.min(mode === 'triangle' || mode === 'hybrid' ? 7 : 4, Math.round(Number(parameters.depth)))
    const gap = Number(parameters.gap)
    const rotationDeg = Number(parameters.rotation)
    const invert = Boolean(parameters.inversion)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2

    const rotationRad = (rotationDeg * Math.PI) / 180
    const rotateAroundCenter = (p: Pt): Pt => {
      const dx = p.x - cx
      const dy = p.y - cy
      return { x: cx + dx * Math.cos(rotationRad) - dy * Math.sin(rotationRad), y: cy + dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad) }
    }

    const shapes: StyledShape[] = []
    const colorFor = (t: number) => palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette)

    if (mode === 'triangle') {
      const r = WIDTH * 0.42
      // Rotating the three seed vertices rotates the entire recursive structure correctly, since
      // every subdivided triangle is derived from them.
      const p1 = rotateAroundCenter({ x: cx, y: cy - r })
      const p2 = rotateAroundCenter({ x: cx + (r * Math.sqrt(3)) / 2, y: cy + r / 2 })
      const p3 = rotateAroundCenter({ x: cx - (r * Math.sqrt(3)) / 2, y: cy + r / 2 })
      const triangles: Pt[][] = []
      triangle(p1, p2, p3, depth, invert, gap, triangles)
      triangles.forEach((tri, i) => shapes.push({ shape: { kind: 'path', d: polygonD(tri) }, fill: colorFor(i / triangles.length), opacity: rng.range(0.8, 1) }))
    } else {
      // stepsFromRoot is optional so this is assignable to squareGrid's plain (row, col) predicate —
      // carpet/cross ignore it, hybrid (called through its own recurse below) uses it for parity.
      const keep: (row: number, col: number, stepsFromRoot?: number) => boolean =
        mode === 'carpet'
          ? (row, col) => !(row === 1 && col === 1)
          : mode === 'cross'
            ? (row, col) => !((row === 0 || row === 2) && (col === 0 || col === 2))
            : (row, col, stepsFromRoot = 0) => (stepsFromRoot % 2 === 0 ? !(row === 1 && col === 1) : row === 1 || col === 1)
      const size = WIDTH * 0.76
      const origin = { x: cx - size / 2, y: cy - size / 2 }
      const cells: { x: number; y: number; size: number }[] = []
      if (mode === 'hybrid') {
        // Hybrid alternates its keep-rule by depth parity, so it needs the depth threaded through — a
        // thin local recursion rather than reusing squareGrid's fixed predicate signature.
        const recurse = (x: number, y: number, s: number, d: number) => {
          if (cells.length > MAX_SHAPES) return
          if (d === 0) {
            const g = (s * gap) / 2
            cells.push({ x: x + g, y: y + g, size: s - g * 2 })
            return
          }
          const cellSize = s / 3
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
              if (!keep(row, col, depth - d)) continue
              recurse(x + col * cellSize, y + row * cellSize, cellSize, d - 1)
            }
          }
        }
        recurse(origin.x, origin.y, size, depth)
      } else {
        squareGrid(origin.x, origin.y, size, depth, gap, keep, cells)
      }
      cells.forEach((c, i) => {
        const color = colorFor(i / cells.length)
        const opacity = rng.range(0.8, 1)
        if (rotationDeg === 0) {
          shapes.push({ shape: { kind: 'rect', x: c.x, y: c.y, w: c.size, h: c.size }, fill: color, opacity })
        } else {
          // Rotating an axis-aligned rect around the canvas center (rather than its own center) turns
          // it into an arbitrary quadrilateral, so emit it as a path once the composition is rotated.
          const corners = [
            { x: c.x, y: c.y },
            { x: c.x + c.size, y: c.y },
            { x: c.x + c.size, y: c.y + c.size },
            { x: c.x, y: c.y + c.size },
          ].map(rotateAroundCenter)
          shapes.push({ shape: { kind: 'path', d: polygonD(corners) }, fill: color, opacity })
        }
      })
    }

    return {
      id: `sierpinski-architecture-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'fractal', name: 'Fractal Structure', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'sierpinski-architecture', generatorName: 'Sierpinski Architecture', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
