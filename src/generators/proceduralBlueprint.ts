import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

/**
 * Distinct from Abstract Floorplan's recursively subdivided rooms: this is built from technical-drawing
 * vocabulary specifically — a fine grid, a handful of structural rectangles, dimension lines with tick
 * marks at each end, and small bolt-hole circles — the visual language of an engineering drawing, not a
 * floorplan of rooms.
 */
export const proceduralBlueprintGenerator: GeneratorDefinition = {
  id: 'procedural-blueprint',
  name: 'Procedural Blueprint',
  category: 'architectural',
  description: 'Grid lines, structural outlines, dimension marks, and bolt holes — the visual vocabulary of a technical drawing, with no text at all.',
  tags: ['architectural', 'technical', 'blueprint', 'geometric'],
  defaultParameters: {
    density: 24,
    structureCount: 6,
    precision: 0.6,
    detail: 0.6,
  },
  parameterSchema: [
    { key: 'density', label: 'Grid density', type: 'number', group: 'pattern', min: 10, max: 40, step: 1, semantic: 'density' },
    { key: 'structureCount', label: 'Structures', type: 'number', group: 'composition', min: 2, max: 12, step: 1 },
    { key: 'precision', label: 'Alignment', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02 },
    { key: 'detail', label: 'Detail', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'complexity' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const density = Math.round(Number(parameters.density))
    const structureCount = Math.round(Number(parameters.structureCount))
    const precision = Number(parameters.precision)
    const detail = Number(parameters.detail)
    const palette = colors.length ? colors : ['#7fd6ff']

    const cell = WIDTH / density
    const snap = (v: number) => (precision > 0.5 ? Math.round(v / cell) * cell : v)

    const shapes: StyledShape[] = []
    for (let i = 0; i <= density; i++) {
      shapes.push({ shape: { kind: 'line', x1: i * cell, y1: 0, x2: i * cell, y2: HEIGHT }, stroke: rng.pick(palette), strokeWidth: 0.4, opacity: 0.25 })
      shapes.push({ shape: { kind: 'line', x1: 0, y1: i * cell, x2: WIDTH, y2: i * cell }, stroke: rng.pick(palette), strokeWidth: 0.4, opacity: 0.25 })
    }

    for (let s = 0; s < structureCount; s++) {
      const w = snap(rng.range(WIDTH * 0.1, WIDTH * 0.32))
      const h = snap(rng.range(HEIGHT * 0.1, HEIGHT * 0.32))
      const x = snap(rng.range(20, WIDTH - w - 20))
      const y = snap(rng.range(20, HEIGHT - h - 20))
      const color = rng.pick(palette)
      shapes.push({ shape: { kind: 'rect', x, y, w, h }, stroke: color, strokeWidth: 1.5, fill: 'none', opacity: 0.9 })

      // Bolt holes at the corners — a small technical-drawing flourish, not structural.
      if (rng.bool(detail)) {
        for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
          shapes.push({ shape: { kind: 'circle', cx, cy, r: 3 }, stroke: color, strokeWidth: 1, fill: 'none', opacity: 0.8 })
        }
      }

      // A dimension line below the structure, with perpendicular tick marks at each end.
      if (rng.bool(detail)) {
        const dimY = y + h + 14
        shapes.push({ shape: { kind: 'line', x1: x, y1: dimY, x2: x + w, y2: dimY }, stroke: color, strokeWidth: 0.8, opacity: 0.7 })
        shapes.push({ shape: { kind: 'line', x1: x, y1: dimY - 4, x2: x, y2: dimY + 4 }, stroke: color, strokeWidth: 0.8, opacity: 0.7 })
        shapes.push({ shape: { kind: 'line', x1: x + w, y1: dimY - 4, x2: x + w, y2: dimY + 4 }, stroke: color, strokeWidth: 0.8, opacity: 0.7 })
      }
    }

    return {
      id: `procedural-blueprint-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'blueprint', name: 'Blueprint', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'procedural-blueprint', generatorName: 'Procedural Blueprint', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
