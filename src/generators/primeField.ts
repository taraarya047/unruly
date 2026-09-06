import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const REPRESENTATION_OPTIONS = [
  { label: 'Ulam spiral', value: 'spiral' },
  { label: 'Grid', value: 'grid' },
  { label: 'Rings', value: 'rings' },
  { label: 'Gaps', value: 'gaps' },
]

/** Sieve of Eratosthenes — O(n log log n), trivial for the ranges this generator allows. */
function sieve(limit: number): boolean[] {
  const isPrime = new Array(limit + 1).fill(true)
  isPrime[0] = isPrime[1] = false
  for (let p = 2; p * p <= limit; p++) {
    if (!isPrime[p]) continue
    for (let m = p * p; m <= limit; m += p) isPrime[m] = false
  }
  return isPrime
}

/** Classic Ulam spiral walk: integers laid out along an outward square spiral, starting at the center. */
function ulamPositions(n: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = new Array(n + 1)
  let x = 0
  let y = 0
  let dx = 1
  let dy = 0
  let stepLength = 1
  let stepsTaken = 0
  let legsCompleted = 0
  for (let i = 1; i <= n; i++) {
    positions[i] = { x, y }
    x += dx
    y += dy
    stepsTaken++
    if (stepsTaken === stepLength) {
      stepsTaken = 0
      ;[dx, dy] = [-dy, dx] // rotate 90 degrees
      legsCompleted++
      if (legsCompleted % 2 === 0) stepLength++
    }
  }
  return positions
}

export const primeFieldGenerator: GeneratorDefinition = {
  id: 'prime-field',
  name: 'Prime Field',
  category: 'mathematical',
  description: 'The distribution of prime numbers, made visible — an Ulam spiral, a heatmap grid, or the gaps between consecutive primes.',
  tags: ['mathematical', 'number-theory', 'spiral', 'grid'],
  defaultParameters: {
    representation: 'spiral',
    range: 6000,
    modulo: 6,
    dotSize: 3,
  },
  parameterSchema: [
    { key: 'representation', label: 'Representation', type: 'select', group: 'shape', options: REPRESENTATION_OPTIONS },
    { key: 'range', label: 'Range', type: 'number', group: 'pattern', min: 400, max: 16000, step: 100, semantic: 'density' },
    { key: 'modulo', label: 'Ring modulo', type: 'number', group: 'shape', min: 2, max: 24, step: 1, advanced: true },
    { key: 'dotSize', label: 'Point size', type: 'number', group: 'shape', min: 1, max: 6, step: 0.2, semantic: 'size' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const representation = String(parameters.representation)
    const range = Math.round(Number(parameters.range))
    const modulo = Math.round(Number(parameters.modulo))
    const dotSize = Number(parameters.dotSize)
    const palette = colors.length ? colors : ['#111111']

    const isPrime = sieve(range)
    const primes: number[] = []
    for (let i = 2; i <= range; i++) if (isPrime[i]) primes.push(i)

    const shapes: StyledShape[] = []
    const cx = WIDTH / 2
    const cy = HEIGHT / 2

    if (representation === 'spiral' || representation === 'gaps') {
      const positions = ulamPositions(range)
      const maxCoord = Math.ceil(Math.sqrt(range)) / 2 + 1
      const cellSize = (WIDTH * 0.9) / (maxCoord * 2)
      const toScreen = (gx: number, gy: number) => ({ x: cx + gx * cellSize, y: cy + gy * cellSize })

      if (representation === 'gaps') {
        let prevPoint: { x: number; y: number } | null = null
        primes.forEach((p, i) => {
          const point = toScreen(positions[p].x, positions[p].y)
          if (prevPoint) {
            shapes.push({ shape: { kind: 'line', x1: prevPoint.x, y1: prevPoint.y, x2: point.x, y2: point.y }, stroke: rng.pick(palette), strokeWidth: 0.6, opacity: 0.55 })
          }
          shapes.push({ shape: { kind: 'circle', cx: point.x, cy: point.y, r: dotSize * 0.6 }, fill: palette[i % palette.length], opacity: 0.9 })
          prevPoint = point
        })
      } else {
        primes.forEach((p, i) => {
          const point = toScreen(positions[p].x, positions[p].y)
          shapes.push({ shape: { kind: 'circle', cx: point.x, cy: point.y, r: dotSize }, fill: palette[i % palette.length], opacity: rng.range(0.7, 1) })
        })
      }
    } else if (representation === 'grid') {
      const cols = Math.ceil(Math.sqrt(range))
      const cell = WIDTH / cols
      for (let n = 2; n <= range; n++) {
        if (!isPrime[n]) continue
        const row = Math.floor((n - 1) / cols)
        const col = (n - 1) % cols
        shapes.push({
          shape: { kind: 'rect', x: col * cell, y: row * cell, w: cell * 0.85, h: cell * 0.85 },
          fill: palette[n % palette.length],
          opacity: rng.range(0.75, 1),
        })
      }
    } else {
      // Rings: primes bucketed by n mod `modulo`, one ring per residue class — visualizes how
      // primes (beyond the first few) cluster into only the residues coprime with the modulo.
      const maxRing = modulo
      const ringGap = (WIDTH * 0.44) / maxRing
      primes.forEach((p, i) => {
        const ring = p % modulo
        const radius = 30 + ring * ringGap
        const angle = (i / primes.length) * Math.PI * 2 * 6
        shapes.push({
          shape: { kind: 'circle', cx: cx + Math.cos(angle) * radius, cy: cy + Math.sin(angle) * radius, r: dotSize * 0.8 },
          fill: palette[ring % palette.length],
          opacity: rng.range(0.7, 1),
        })
      })
    }

    return {
      id: `prime-field-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'primes', name: 'Prime Field', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'prime-field', generatorName: 'Prime Field', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
