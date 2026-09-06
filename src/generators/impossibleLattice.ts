import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

/**
 * Named "Impossible Lattice" (not "Penrose-like") to avoid confusion with the actual Penrose Tiling
 * generator — this is an original tiled field of impossible tribar-style junctions, each independently
 * shaded with contradictory perspective. It's deliberately a *field* of many small ambiguous-depth
 * units rather than the one large closed loop Impossible Stairs already covers, so the two don't overlap.
 */
function tribar(cx: number, cy: number, size: number, rotation: number, palette: string[], rng: ReturnType<typeof createRng>): StyledShape[] {
  const shapes: StyledShape[] = []
  const armWidth = size * 0.32
  // Three arms at 120° apart, each shaded a different tone — the contradictory shading (each arm reads
  // as if lit from a different direction) is what makes the junction look impossible.
  for (let arm = 0; arm < 3; arm++) {
    const a = rotation + (arm * Math.PI * 2) / 3
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    const inner1 = { x: cx - sa * (armWidth / 2), y: cy + ca * (armWidth / 2) }
    const inner2 = { x: cx + sa * (armWidth / 2), y: cy - ca * (armWidth / 2) }
    const outer1 = { x: inner1.x + ca * size, y: inner1.y + sa * size }
    const outer2 = { x: inner2.x + ca * size, y: inner2.y + sa * size }
    const d = `M ${inner1.x.toFixed(1)} ${inner1.y.toFixed(1)} L ${outer1.x.toFixed(1)} ${outer1.y.toFixed(1)} L ${outer2.x.toFixed(1)} ${outer2.y.toFixed(1)} L ${inner2.x.toFixed(1)} ${inner2.y.toFixed(1)} Z`
    shapes.push({ shape: { kind: 'path', d }, fill: palette[arm % palette.length] ?? rng.pick(palette), stroke: '#111111', strokeWidth: 0.6, opacity: 0.4 + arm * 0.2 })
  }
  return shapes
}

export const impossibleLatticeGenerator: GeneratorDefinition = {
  id: 'impossible-lattice',
  name: 'Impossible Lattice',
  category: 'optical',
  description: 'A tiled field of impossible tribar-style junctions, each shaded with contradictory perspective — an original composition, not a specific reproduced illusion.',
  tags: ['optical', 'illusion', 'geometric', 'perspective'],
  defaultParameters: {
    density: 5,
    complexity: 0.5,
    repetition: 0.6,
  },
  parameterSchema: [
    { key: 'density', label: 'Grid density', type: 'number', group: 'pattern', min: 3, max: 8, step: 1, semantic: 'density' },
    { key: 'complexity', label: 'Rotation variety', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'complexity' },
    { key: 'repetition', label: 'Size', type: 'number', group: 'shape', min: 0.3, max: 0.9, step: 0.02, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const density = Math.round(Number(parameters.density))
    const complexity = Number(parameters.complexity)
    const sizeFactor = Number(parameters.repetition)
    const palette = colors.length ? colors : ['#111111', '#666666', '#cccccc']

    const cell = WIDTH / density
    const size = cell * sizeFactor * 0.5
    const shapes: StyledShape[] = []
    for (let row = 0; row < density; row++) {
      for (let col = 0; col < density; col++) {
        const cx = col * cell + cell / 2
        const cy = row * cell + cell / 2
        const rotation = rng.range(0, Math.PI * 2) * complexity + ((row + col) % 2) * Math.PI
        shapes.push(...tribar(cx, cy, size, rotation, palette, rng))
      }
    }

    return {
      id: `impossible-lattice-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'lattice', name: 'Impossible Lattice', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'impossible-lattice', generatorName: 'Impossible Lattice', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
