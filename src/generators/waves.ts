import type { GeneratorDefinition } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { round } from '@/engine/shapes'

const WIDTH = 800
const HEIGHT = 800

export const wavesGenerator: GeneratorDefinition = {
  id: 'waves',
  name: 'Waves',
  category: 'lines',
  description: 'Layered sine-wave lines with adjustable amplitude and frequency.',
  defaultParameters: {
    amplitude: 30,
    frequency: 4,
    thickness: 3,
    spacing: 32,
    phase: 0,
    distortion: 0.15,
  },
  parameterSchema: [
    { key: 'amplitude', label: 'Amplitude', type: 'number', group: 'shape', min: 2, max: 100, step: 1 },
    { key: 'frequency', label: 'Frequency', type: 'number', group: 'pattern', min: 0.5, max: 16, step: 0.5, semantic: 'density' },
    { key: 'thickness', label: 'Thickness', type: 'number', group: 'shape', min: 1, max: 16, step: 0.5 },
    { key: 'spacing', label: 'Spacing', type: 'number', group: 'pattern', min: 8, max: 80, step: 1 },
    { key: 'phase', label: 'Phase', type: 'angle', group: 'composition', min: 0, max: 360, step: 1, advanced: true },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const amplitude = Number(parameters.amplitude)
    const frequency = Number(parameters.frequency)
    const thickness = Number(parameters.thickness)
    const spacing = Number(parameters.spacing)
    const phase = (Number(parameters.phase) * Math.PI) / 180
    const distortion = Number(parameters.distortion)
    const palette = colors.length ? colors : ['#111111']

    const lineCount = Math.ceil(HEIGHT / spacing) + 2
    const shapes = []
    const samples = 48

    for (let i = 0; i < lineCount; i++) {
      const baseY = i * spacing - spacing
      const linePhase = phase + rng.range(-distortion, distortion) * Math.PI
      const ampJitter = amplitude * (1 + rng.range(-distortion, distortion))
      let d = ''
      for (let s = 0; s <= samples; s++) {
        const x = (s / samples) * WIDTH
        const y = baseY + Math.sin((x / WIDTH) * Math.PI * 2 * frequency + linePhase) * ampJitter
        d += `${s === 0 ? 'M' : 'L'} ${round(x)} ${round(y)} `
      }
      shapes.push({
        shape: { kind: 'path' as const, d: d.trim() },
        stroke: rng.pick(palette),
        strokeWidth: thickness,
        fill: 'none',
        opacity: rng.range(0.7, 1),
      })
    }

    return {
      id: `waves-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'waves', name: 'Waves', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'waves', generatorName: 'Waves', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
