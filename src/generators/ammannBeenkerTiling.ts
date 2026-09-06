import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { deBruijnMultigrid } from '@/engine/math/multigrid'

const WIDTH = 800
const HEIGHT = 800
const SYMMETRY = 4
const OFFSETS = [0.12, 0.37, 0.21, 0.46]
const MAX_SHAPES = 4000

const MODE_OPTIONS = [
  { label: 'Mixed', value: 'mixed' },
  { label: 'Squares only', value: 'squares' },
  { label: 'Rhombi only', value: 'rhombi' },
]

function polygonD(points: { x: number; y: number }[]): string {
  return `M ${points.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')} Z`
}

export const ammannBeenkerTilingGenerator: GeneratorDefinition = {
  id: 'ammann-beenker-tiling',
  name: 'Ammann–Beenker Tiling',
  category: 'tessellation',
  description: 'An eight-fold aperiodic tiling of squares and rhombi — the same grid-dualization method as Penrose, tuned to four line-families instead of five.',
  tags: ['tessellation', 'mathematical', 'aperiodic', 'quasicrystal'],
  defaultParameters: {
    mode: 'mixed',
    detail: 6,
    tileSize: 48,
    rotation: 0,
    gap: 0.04,
  },
  parameterSchema: [
    { key: 'mode', label: 'Mode', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'detail', label: 'Detail', type: 'number', group: 'pattern', min: 3, max: 9, step: 1, semantic: 'complexity' },
    { key: 'tileSize', label: 'Tile size', type: 'number', group: 'shape', min: 20, max: 90, step: 1, semantic: 'scale' },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 90, step: 1, semantic: 'rotation' },
    { key: 'gap', label: 'Gap', type: 'number', group: 'pattern', min: 0, max: 0.15, step: 0.005 },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const mode = String(parameters.mode)
    const detail = Math.round(Number(parameters.detail))
    const tileSize = Number(parameters.tileSize)
    const rotationRad = (Number(parameters.rotation) * Math.PI) / 180
    const gap = Number(parameters.gap)
    const palette = colors.length ? colors : ['#111111', '#2c7fb8']

    const rhombs = deBruijnMultigrid(SYMMETRY, OFFSETS, detail)
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const cosR = Math.cos(rotationRad)
    const sinR = Math.sin(rotationRad)

    const shapes: StyledShape[] = []
    for (const rhomb of rhombs) {
      if (shapes.length > MAX_SHAPES) break
      const diff = Math.abs(rhomb.families[0] - rhomb.families[1])
      const isSquare = Math.min(diff, SYMMETRY - diff) === 2
      if (mode === 'squares' && !isSquare) continue
      if (mode === 'rhombi' && isSquare) continue

      const centerX = rhomb.vertices.reduce((s, p) => s + p.x, 0) / 4
      const centerY = rhomb.vertices.reduce((s, p) => s + p.y, 0) / 4
      const shrunk = rhomb.vertices.map((p) => ({ x: p.x + (centerX - p.x) * gap, y: p.y + (centerY - p.y) * gap }))
      const screen = shrunk.map((p) => {
        const sx = p.x * tileSize
        const sy = p.y * tileSize
        return { x: cx + sx * cosR - sy * sinR, y: cy + sx * sinR + sy * cosR }
      })
      if (screen.every((p) => p.x < -40 || p.x > WIDTH + 40 || p.y < -40 || p.y > HEIGHT + 40)) continue

      shapes.push({
        shape: { kind: 'path', d: polygonD(screen) },
        fill: isSquare ? palette[0] : (palette[1] ?? palette[0]),
        stroke: 'none',
        opacity: rng.range(0.85, 1),
      })
    }

    return {
      id: `ammann-beenker-tiling-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'tiles', name: 'Ammann–Beenker Tiles', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'ammann-beenker-tiling', generatorName: 'Ammann–Beenker Tiling', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
