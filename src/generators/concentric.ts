import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

export const concentricGenerator: GeneratorDefinition = {
  id: 'concentric',
  name: 'Concentric Lines',
  category: 'lines',
  description: 'Rings radiating from a center point, with distortion.',
  defaultParameters: {
    count: 18,
    spacing: 22,
    distortion: 0.08,
    thickness: 2,
    centerX: 0.5,
    centerY: 0.5,
  },
  parameterSchema: [
    { key: 'count', label: 'Count', type: 'number', group: 'pattern', min: 3, max: 50, step: 1, semantic: 'density' },
    { key: 'spacing', label: 'Spacing', type: 'number', group: 'pattern', min: 6, max: 60, step: 1 },
    { key: 'thickness', label: 'Thickness', type: 'number', group: 'shape', min: 0.5, max: 10, step: 0.5 },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'centerX', label: 'Center X', type: 'number', group: 'composition', min: 0, max: 1, step: 0.02, advanced: true },
    { key: 'centerY', label: 'Center Y', type: 'number', group: 'composition', min: 0, max: 1, step: 0.02, advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const count = Number(parameters.count)
    const spacing = Number(parameters.spacing)
    const distortion = Number(parameters.distortion)
    const thickness = Number(parameters.thickness)
    const cx = Number(parameters.centerX) * WIDTH
    const cy = Number(parameters.centerY) * HEIGHT
    const palette = colors.length ? colors : ['#111111']
    const samples = 64

    const shapes = []
    for (let i = 1; i <= count; i++) {
      const baseR = i * spacing
      const seedOffset = rng.int(0, 2 ** 31)
      const ringRng = createRng(seedOffset)
      let d = ''
      for (let s = 0; s <= samples; s++) {
        const a = (s / samples) * Math.PI * 2
        const wobble = 1 + Math.sin(a * ringRng.range(2, 6) + ringRng.range(0, 10)) * distortion
        const x = cx + Math.cos(a) * baseR * wobble
        const y = cy + Math.sin(a) * baseR * wobble
        d += `${s === 0 ? 'M' : 'L'} ${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100} `
      }
      shapes.push({
        shape: { kind: 'path' as const, d: `${d.trim()} Z` },
        stroke: rng.pick(palette),
        strokeWidth: thickness,
        fill: 'none',
        opacity: rng.range(0.6, 1),
      })
    }

    return {
      id: `concentric-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'rings', name: 'Rings', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'concentric', generatorName: 'Concentric Lines', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
