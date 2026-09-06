import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeNoiseField } from '@/engine/math/noise'

const WIDTH = 800
const HEIGHT = 800

/**
 * Deliberately more than the existing Hex Grid generator (a uniform tiling with per-cell scale jitter):
 * every hexagon's six vertices are individually displaced by a shared noise field (so neighbors warp
 * coherently, not independently), cell size follows a separate low-frequency "growth" field rather than
 * per-cell randomness, and cells can be missing entirely.
 */
export const hexagonalTessellationGenerator: GeneratorDefinition = {
  id: 'hexagonal-tessellation',
  name: 'Hexagonal Tessellation',
  category: 'tessellation',
  description: 'A hex grid pushed through a coherent warp field — cells stretch, grow, and drop out following the same underlying terrain, not independent per-cell noise.',
  tags: ['tessellation', 'geometric', 'organic', 'field'],
  defaultParameters: {
    size: 34,
    warp: 0.3,
    growth: 0.4,
    missing: 0.08,
    gap: 0.06,
  },
  parameterSchema: [
    { key: 'size', label: 'Cell size', type: 'number', group: 'pattern', min: 16, max: 60, step: 1, semantic: 'density' },
    { key: 'warp', label: 'Edge warp', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'growth', label: 'Growth variation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'scale' },
    { key: 'missing', label: 'Missing cells', type: 'number', group: 'pattern', min: 0, max: 0.4, step: 0.01 },
    { key: 'gap', label: 'Gap', type: 'number', group: 'pattern', min: 0, max: 0.3, step: 0.01 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const size = Number(parameters.size)
    const warp = Number(parameters.warp)
    const growthAmount = Number(parameters.growth)
    const missing = Number(parameters.missing)
    const gap = Number(parameters.gap)
    const palette = colors.length ? colors : ['#111111']

    const warpField = makeNoiseField(rng.fork(1), 3)
    const growthField = makeNoiseField(rng.fork(2), 2)
    const missingField = makeNoiseField(rng.fork(3), 4)

    const hexWidth = Math.sqrt(3) * size
    const vertSpacing = size * 1.5
    const cols = Math.ceil(WIDTH / hexWidth) + 2
    const rows = Math.ceil(HEIGHT / vertSpacing) + 2

    const shapes: StyledShape[] = []
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const cx = col * hexWidth + (row % 2 !== 0 ? hexWidth / 2 : 0)
        const cy = row * vertSpacing
        if (cx < -hexWidth || cx > WIDTH + hexWidth || cy < -size * 2 || cy > HEIGHT + size * 2) continue

        // Coherent per-cell fields, not independent randomness — neighboring cells drift together.
        if ((missingField(cx, cy) + 1) / 2 < missing) continue
        const growth = 1 + growthField(cx, cy) * growthAmount
        const cellSize = size * growth * (1 - gap)

        const points: string[] = []
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 180) * (60 * i - 30)
          const vx = cx + Math.cos(angle) * cellSize
          const vy = cy + Math.sin(angle) * cellSize
          // Sampling the SAME warp field at each vertex's own position (not the cell center) is what
          // makes adjacent hexagons' shared edges warp together, rather than tearing apart at seams.
          const wx = warpField(vx, vy) * warp * cellSize * 0.35
          const wy = warpField(vy, vx) * warp * cellSize * 0.35
          points.push(`${(vx + wx).toFixed(2)},${(vy + wy).toFixed(2)}`)
        }

        shapes.push({
          shape: { kind: 'path', d: `M ${points.join(' L ')} Z` },
          fill: rng.pick(palette),
          stroke: 'none',
          opacity: rng.range(0.8, 1),
        })
      }
    }

    return {
      id: `hexagonal-tessellation-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'cells', name: 'Hex Cells', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'hexagonal-tessellation', generatorName: 'Hexagonal Tessellation', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
