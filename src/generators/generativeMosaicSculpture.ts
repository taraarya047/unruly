import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800
const MAX_TILES = 400

interface Tile {
  x: number
  y: number
  w: number
  h: number
  depth: number
}

/** Recursively splits a rectangle, stopping tiles at varying depths (weighted by `hierarchy`) rather
 *  than a single fixed depth — the size variety this produces is what makes the result read as one
 *  sculptural composition instead of a uniform repeating grid (unlike Tile Morpher or Pixel Mosaic). */
function subdivide(rect: Tile, hierarchy: number, rng: Rng, out: Tile[]) {
  if (out.length >= MAX_TILES) {
    out.push(rect)
    return
  }
  const tooSmall = rect.w < 40 || rect.h < 40
  const stopHere = tooSmall || (rect.depth > 1 && rng.bool(1 - hierarchy))
  if (stopHere) {
    out.push(rect)
    return
  }
  const vertical = rect.w > rect.h ? rng.bool(0.7) : rng.bool(0.3)
  const ratio = rng.range(0.35, 0.65)
  if (vertical) {
    const w1 = rect.w * ratio
    subdivide({ x: rect.x, y: rect.y, w: w1, h: rect.h, depth: rect.depth + 1 }, hierarchy, rng, out)
    subdivide({ x: rect.x + w1, y: rect.y, w: rect.w - w1, h: rect.h, depth: rect.depth + 1 }, hierarchy, rng, out)
  } else {
    const h1 = rect.h * ratio
    subdivide({ x: rect.x, y: rect.y, w: rect.w, h: h1, depth: rect.depth + 1 }, hierarchy, rng, out)
    subdivide({ x: rect.x, y: rect.y + h1, w: rect.w, h: rect.h - h1, depth: rect.depth + 1 }, hierarchy, rng, out)
  }
}

export const generativeMosaicSculptureGenerator: GeneratorDefinition = {
  id: 'generative-mosaic-sculpture',
  name: 'Generative Mosaic Sculpture',
  category: 'tessellation',
  description: 'A single composition built from many differently sized and internally varied tiles — closer to a sculptural object than a repeating pattern.',
  tags: ['tessellation', 'composition', 'geometric', 'mosaic'],
  defaultParameters: {
    hierarchy: 0.65,
    variation: 0.6,
    gap: 0.05,
    paletteDiversity: 0.6,
  },
  parameterSchema: [
    { key: 'hierarchy', label: 'Hierarchy depth', type: 'number', group: 'pattern', min: 0.3, max: 0.9, step: 0.02, semantic: 'complexity' },
    { key: 'variation', label: 'Internal pattern variety', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'gap', label: 'Gap', type: 'number', group: 'pattern', min: 0, max: 0.15, step: 0.005 },
    { key: 'paletteDiversity', label: 'Palette diversity', type: 'number', group: 'color', min: 0.2, max: 1, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const hierarchy = Number(parameters.hierarchy)
    const variation = Number(parameters.variation)
    const gap = Number(parameters.gap)
    const paletteDiversity = Number(parameters.paletteDiversity)
    const palette = colors.length ? colors : ['#111111']

    const tiles: Tile[] = []
    subdivide({ x: WIDTH * 0.06, y: HEIGHT * 0.06, w: WIDTH * 0.88, h: HEIGHT * 0.88, depth: 0 }, hierarchy, rng, tiles)

    const shapes: StyledShape[] = []
    for (const tile of tiles) {
      const g = Math.min(tile.w, tile.h) * gap
      const x = tile.x + g
      const y = tile.y + g
      const w = tile.w - g * 2
      const h = tile.h - g * 2
      const baseColor = rng.bool(paletteDiversity) ? rng.pick(palette) : palette[0]
      shapes.push({ shape: { kind: 'rect', x, y, w, h }, fill: baseColor, opacity: rng.range(0.85, 1) })

      // Internal micro-content — what makes each tile feel individually crafted rather than a flat
      // color swatch. Only some tiles get one, controlled by `variation`.
      if (rng.bool(variation)) {
        const cx = x + w / 2
        const cy = y + h / 2
        const accent = rng.pick(palette)
        const kind = rng.pick(['circle', 'lines', 'diamond'] as const)
        if (kind === 'circle') {
          shapes.push({ shape: { kind: 'circle', cx, cy, r: Math.min(w, h) * 0.28 }, fill: accent, opacity: 0.8 })
        } else if (kind === 'diamond') {
          shapes.push({ shape: { kind: 'polygon', cx, cy, r: Math.min(w, h) * 0.32, sides: 4, rotation: Math.PI / 4 }, fill: accent, opacity: 0.8 })
        } else {
          const lineCount = 3
          for (let i = 1; i <= lineCount; i++) {
            const ly = y + (h * i) / (lineCount + 1)
            shapes.push({ shape: { kind: 'line', x1: x + w * 0.15, y1: ly, x2: x + w * 0.85, y2: ly }, stroke: accent, strokeWidth: 1.5, opacity: 0.7 })
          }
        }
      }
    }

    return {
      id: `generative-mosaic-sculpture-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'mosaic', name: 'Mosaic Sculpture', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'generative-mosaic-sculpture', generatorName: 'Generative Mosaic Sculpture', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
