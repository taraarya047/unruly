import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { sampleGrid, marchingSquaresFromGrid, segmentsToPathD, gridValueRange } from '@/engine/math/marchingSquares'

const WIDTH = 800
const HEIGHT = 800
// A real grid simulation is inherently slower than every other generator here (each iteration touches
// every cell), and Gray-Scott patterns genuinely need thousands of steps to fill much of the domain —
// 60 keeps that many iterations within a few hundred milliseconds instead of approaching a full second.
const GRID = 60
// The classic Gray-Scott diffusion rates (Pearson 1993) — not the more commonly *quoted* Du=1, Dv=0.5,
// which is unstable at dt=1 with a 5-point discrete Laplacian (the stability limit for this scheme is
// roughly D*dt < 0.25) and blows up to NaN within a few dozen steps rather than settling into a pattern.
const DU = 0.16
const DV = 0.08

const PRESET_OPTIONS = [
  { label: 'Coral', value: 'coral' },
  { label: 'Spots', value: 'spots' },
  { label: 'Fingerprints', value: 'fingerprints' },
  { label: 'Cells', value: 'cells' },
]

// Real, named Gray-Scott feed/kill pairs — each is a genuinely different point in parameter space, not
// a cosmetic label swap.
const PRESETS: Record<string, { feed: number; kill: number }> = {
  coral: { feed: 0.035, kill: 0.065 },
  spots: { feed: 0.055, kill: 0.062 },
  fingerprints: { feed: 0.029, kill: 0.057 },
  cells: { feed: 0.026, kill: 0.051 },
}

/**
 * A genuine Gray-Scott reaction-diffusion simulation, run forward on a grid — not the one-shot spectral
 * approximation Turing Patterns uses. Two chemical concentrations (U, V) diffuse and react every step;
 * the pattern that emerges after enough iterations is the actual numerical outcome of that process, the
 * same PDE real reaction-diffusion chemistry follows.
 */
function simulate(iterations: number, feed: number, kill: number, rng: ReturnType<typeof createRng>): number[][] {
  let u: number[][] = Array.from({ length: GRID }, () => new Array(GRID).fill(1))
  let v: number[][] = Array.from({ length: GRID }, () => new Array(GRID).fill(0))

  const seedBlobs = 3 + Math.floor(rng.range(0, 3))
  for (let b = 0; b < seedBlobs; b++) {
    const cx = Math.floor(rng.range(GRID * 0.3, GRID * 0.7))
    const cy = Math.floor(rng.range(GRID * 0.3, GRID * 0.7))
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = (cx + dx + GRID) % GRID
        const y = (cy + dy + GRID) % GRID
        if (dx * dx + dy * dy <= 9) {
          u[y][x] = 0.5
          v[y][x] = 0.25
        }
      }
    }
  }
  // A little V noise across the whole grid, not just the seed blobs, roughly doubles how much of the
  // domain develops pattern within a fixed step budget — real Gray-Scott coral/spot growth is slow to
  // spread from a few isolated points alone.
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) v[y][x] += rng.range(0, 0.02)
  }

  for (let step = 0; step < iterations; step++) {
    const nu: number[][] = Array.from({ length: GRID }, () => new Array(GRID))
    const nv: number[][] = Array.from({ length: GRID }, () => new Array(GRID))
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const xl = (x - 1 + GRID) % GRID
        const xr = (x + 1) % GRID
        const yu = (y - 1 + GRID) % GRID
        const yd = (y + 1) % GRID
        const lapU = u[y][xl] + u[y][xr] + u[yu][x] + u[yd][x] - 4 * u[y][x]
        const lapV = v[y][xl] + v[y][xr] + v[yu][x] + v[yd][x] - 4 * v[y][x]
        const uv2 = u[y][x] * v[y][x] * v[y][x]
        nu[y][x] = u[y][x] + (DU * lapU - uv2 + feed * (1 - u[y][x])) * 1.0
        nv[y][x] = v[y][x] + (DV * lapV + uv2 - (feed + kill) * v[y][x]) * 1.0
      }
    }
    u = nu
    v = nv
  }
  return v
}

export const reactionDiffusionGenerator: GeneratorDefinition = {
  id: 'reaction-diffusion',
  name: 'Reaction Diffusion',
  category: 'organic',
  description: 'A real Gray-Scott simulation run forward on a grid — coral, spots, or fingerprints are the actual numerical outcome, not an approximation.',
  tags: ['organic', 'simulation', 'mathematical', 'emergent'],
  defaultParameters: {
    preset: 'coral',
    iterations: 4000,
    thickness: 1.2,
  },
  parameterSchema: [
    { key: 'preset', label: 'Preset', type: 'select', group: 'shape', options: PRESET_OPTIONS },
    { key: 'iterations', label: 'Simulation steps', type: 'number', group: 'variation', min: 1500, max: 6000, step: 100, semantic: 'complexity' },
    { key: 'thickness', label: 'Line thickness', type: 'number', group: 'color', min: 0.5, max: 3, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const presetName = String(parameters.preset)
    const iterations = Math.round(Number(parameters.iterations))
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']
    const { feed, kill } = PRESETS[presetName] ?? PRESETS.coral

    const v = simulate(iterations, feed, kill, rng)
    const cellSize = WIDTH / GRID
    const field = (x: number, y: number) => {
      const gx = Math.min(GRID - 1, Math.max(0, Math.floor(x / cellSize)))
      const gy = Math.min(GRID - 1, Math.max(0, Math.floor(y / cellSize)))
      return v[gy][gx]
    }
    const grid = sampleGrid(field, WIDTH, HEIGHT, GRID)
    // Different feed/kill presets settle at very different characteristic V concentrations — a fixed
    // threshold that works for "coral" can sit entirely above or below another preset's actual range,
    // rendering blank. Threshold at the field's own midpoint instead (same fix as Mandelbrot/Julia).
    const { min: vMin, max: vMax } = gridValueRange(grid)
    const threshold = vMin + (vMax - vMin) * 0.35
    const segments = marchingSquaresFromGrid(grid, threshold)

    const shapes: StyledShape[] = [
      { shape: { kind: 'path', d: segmentsToPathD(segments) }, stroke: rng.pick(palette), strokeWidth: thickness, fill: 'none', opacity: 0.9 },
    ]

    return {
      id: `reaction-diffusion-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'pattern', name: 'Reaction-Diffusion Pattern', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'reaction-diffusion', generatorName: 'Reaction Diffusion', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
