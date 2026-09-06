import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const SHAPE_OPTIONS = [
  { label: 'Square', value: 'square' },
  { label: 'Circle', value: 'circle' },
  { label: 'Triangle', value: 'triangle' },
]

/**
 * Pascal's triangle mod m, built row-by-row via the addition recurrence rather than raw binomial
 * coefficients — this stays numerically exact for any row count (factorials would overflow long
 * before row 60), and modulo-2 famously reproduces the Sierpinski triangle exactly.
 */
function pascalModRows(rows: number, modulo: number): number[][] {
  const table: number[][] = []
  let prev: number[] = [1]
  table.push(prev)
  for (let n = 1; n < rows; n++) {
    const row = new Array(n + 1)
    row[0] = 1
    row[n] = 1
    for (let k = 1; k < n; k++) row[k] = (prev[k - 1] + prev[k]) % modulo
    table.push(row)
    prev = row
  }
  return table
}

export const pascalMosaicGenerator: GeneratorDefinition = {
  id: 'pascal-mosaic',
  name: 'Pascal Mosaic',
  category: 'mathematical',
  description: 'Pascal’s triangle reduced modulo a small number — a number-theory table that turns out to be a striking visual pattern.',
  tags: ['mathematical', 'number-theory', 'tessellation', 'grid'],
  defaultParameters: {
    rows: 64,
    modulo: 3,
    shape: 'triangle',
    symmetry: false,
    cellGap: 0.08,
  },
  parameterSchema: [
    { key: 'rows', label: 'Rows', type: 'number', group: 'pattern', min: 8, max: 120, step: 1, semantic: 'density' },
    { key: 'modulo', label: 'Modulo', type: 'number', group: 'shape', min: 2, max: 11, step: 1 },
    { key: 'shape', label: 'Cell shape', type: 'select', group: 'shape', options: SHAPE_OPTIONS },
    { key: 'symmetry', label: 'Centered triangle', type: 'boolean', group: 'composition' },
    { key: 'cellGap', label: 'Gap', type: 'number', group: 'pattern', min: 0, max: 0.3, step: 0.01 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const rows = Math.round(Number(parameters.rows))
    const modulo = Math.round(Number(parameters.modulo))
    const shape = String(parameters.shape)
    const symmetry = Boolean(parameters.symmetry)
    const gap = Number(parameters.cellGap)
    const palette = colors.length ? colors : ['#111111']

    const table = pascalModRows(rows, modulo)
    const cell = WIDTH / rows
    // Centered mode aligns every row on the triangle's axis of symmetry; left-aligned mode keeps every
    // row flush left, producing a staircase instead of a triangle — same data, a different silhouette.
    const leftMargin = WIDTH * 0.06

    const shapes: StyledShape[] = []
    for (let row = 0; row < table.length; row++) {
      const values = table[row]
      const rowWidth = values.length * cell
      const rowStartX = symmetry ? WIDTH / 2 - rowWidth / 2 : leftMargin
      const y = row * cell + cell / 2

      for (let col = 0; col < values.length; col++) {
        if (values[col] === 0) continue
        const x = rowStartX + col * cell + cell / 2
        const color = palette[values[col] % palette.length]
        const size = cell * (1 - gap)
        const shapePrimitive =
          shape === 'circle'
            ? ({ kind: 'circle' as const, cx: x, cy: y, r: size / 2 })
            : shape === 'triangle'
              ? ({ kind: 'polygon' as const, cx: x, cy: y, r: size / 1.6, sides: 3 })
              : ({ kind: 'rect' as const, x: x - size / 2, y: y - size / 2, w: size, h: size })
        shapes.push({ shape: shapePrimitive, fill: color, opacity: rng.range(0.85, 1) })
      }
    }

    return {
      id: `pascal-mosaic-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'mosaic', name: 'Pascal Mosaic', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'pascal-mosaic', generatorName: 'Pascal Mosaic', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
