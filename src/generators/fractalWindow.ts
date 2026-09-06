import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const MODE_OPTIONS = [
  { label: 'Square', value: 'square' },
  { label: 'Arch', value: 'arch' },
  { label: 'Circle', value: 'circle' },
  { label: 'Polygon', value: 'polygon' },
]

function frameShape(mode: string, cx: number, cy: number, w: number, h: number, sides: number): string {
  if (mode === 'circle') {
    const r = Math.min(w, h) / 2
    return `M ${(cx - r).toFixed(1)} ${cy.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 1 ${(cx + r).toFixed(1)} ${cy.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 1 ${(cx - r).toFixed(1)} ${cy.toFixed(1)} Z`
  }
  if (mode === 'polygon') {
    const r = Math.min(w, h) / 2
    const pts = Array.from({ length: sides }, (_, i) => {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2
      return `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`
    })
    return `M ${pts.join(' L ')} Z`
  }
  if (mode === 'arch') {
    const x = cx - w / 2
    const y = cy - h / 2
    const r = w / 2
    return `M ${x.toFixed(1)} ${(y + h).toFixed(1)} L ${x.toFixed(1)} ${(y + r).toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(x + w).toFixed(1)} ${(y + r).toFixed(1)} L ${(x + w).toFixed(1)} ${(y + h).toFixed(1)} Z`
  }
  const x = cx - w / 2
  const y = cy - h / 2
  return `M ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + w).toFixed(1)} ${y.toFixed(1)} L ${(x + w).toFixed(1)} ${(y + h).toFixed(1)} L ${x.toFixed(1)} ${(y + h).toFixed(1)} Z`
}

export const fractalWindowGenerator: GeneratorDefinition = {
  id: 'fractal-window',
  name: 'Fractal Window',
  category: 'architectural',
  description: 'Nested architectural window frames, each one recursively smaller and offset — a real recursive structure, useful as a poster centerpiece.',
  tags: ['architectural', 'recursive', 'geometric', 'poster'],
  defaultParameters: {
    mode: 'arch',
    recursion: 9,
    frameThickness: 6,
    variation: 0.15,
    depthShrink: 0.82,
  },
  parameterSchema: [
    { key: 'mode', label: 'Shape', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'recursion', label: 'Recursion', type: 'number', group: 'pattern', min: 3, max: 16, step: 1, semantic: 'complexity' },
    { key: 'frameThickness', label: 'Frame thickness', type: 'number', group: 'color', min: 1, max: 14, step: 0.5 },
    { key: 'variation', label: 'Offset variation', type: 'number', group: 'variation', min: 0, max: 0.4, step: 0.01, semantic: 'jitter' },
    { key: 'depthShrink', label: 'Depth shrink', type: 'number', group: 'shape', min: 0.7, max: 0.92, step: 0.01, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: false, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const mode = String(parameters.mode)
    const recursion = Math.round(Number(parameters.recursion))
    const frameThickness = Number(parameters.frameThickness)
    const variation = Number(parameters.variation)
    const depthShrink = Number(parameters.depthShrink)
    const palette = colors.length ? colors : ['#111111']

    let w = WIDTH * 0.82
    let h = HEIGHT * 0.82
    let cx = WIDTH / 2
    let cy = HEIGHT / 2
    const sides = 5 + Math.floor(rng.range(0, 4))

    const shapes: StyledShape[] = []
    for (let depth = 0; depth < recursion; depth++) {
      const t = depth / (recursion - 1 || 1)
      shapes.push({
        shape: { kind: 'path', d: frameShape(mode, cx, cy, w, h, sides) },
        stroke: palette[Math.floor(t * (palette.length - 0.001))] ?? rng.pick(palette),
        strokeWidth: Math.max(0.5, frameThickness * (1 - t * 0.6)),
        fill: 'none',
        opacity: 0.9,
      })
      cx += rng.range(-variation, variation) * w * 0.3
      cy += rng.range(-variation, variation) * h * 0.3
      w *= depthShrink
      h *= depthShrink
    }

    return {
      id: `fractal-window-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'frames', name: 'Nested Frames', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'fractal-window', generatorName: 'Fractal Window', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
