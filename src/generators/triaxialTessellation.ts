import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeNoiseField } from '@/engine/math/noise'

const WIDTH = 800
const HEIGHT = 800

function triPoint(x: number, y: number): { x: number; y: number } {
  return { x, y }
}

export const triaxialTessellationGenerator: GeneratorDefinition = {
  id: 'triaxial-tessellation',
  name: 'Triaxial Tessellation',
  category: 'tessellation',
  description: 'A triangular grid where every tile scales, rotates, and shifts according to where it sits — position drives the deformation, not chance.',
  tags: ['tessellation', 'geometric', 'field', 'gradient'],
  defaultParameters: {
    size: 40,
    distortion: 0.3,
    gradientStrength: 0.6,
    rotationAmount: 0.3,
    gap: 0.06,
  },
  parameterSchema: [
    { key: 'size', label: 'Cell size', type: 'number', group: 'pattern', min: 20, max: 70, step: 1, semantic: 'density' },
    { key: 'distortion', label: 'Distortion', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'gradientStrength', label: 'Gradient scale', type: 'number', group: 'composition', min: 0, max: 1, step: 0.02 },
    { key: 'rotationAmount', label: 'Local rotation', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'rotation' },
    { key: 'gap', label: 'Gap', type: 'number', group: 'pattern', min: 0, max: 0.3, step: 0.01 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const size = Number(parameters.size)
    const distortion = Number(parameters.distortion)
    const gradientStrength = Number(parameters.gradientStrength)
    const rotationAmount = Number(parameters.rotationAmount)
    const gap = Number(parameters.gap)
    const palette = colors.length ? colors : ['#111111']

    const jitterField = makeNoiseField(rng.fork(1), 3)
    const rotationField = makeNoiseField(rng.fork(2), 2)
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const maxDist = Math.hypot(cx, cy)

    const rowHeight = (size * Math.sqrt(3)) / 2
    const rows = Math.ceil(HEIGHT / rowHeight) + 2
    const cols = Math.ceil(WIDTH / size) + 2

    const shapes: StyledShape[] = []
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const baseX = col * size + (row % 2 !== 0 ? size / 2 : 0)
        const baseY = row * rowHeight
        // Two triangles (pointing up and down) share each grid cell, forming the triangular tiling.
        for (const up of [true, false]) {
          const p1 = triPoint(baseX, baseY + (up ? 0 : rowHeight))
          const p2 = triPoint(baseX + size, baseY + (up ? 0 : rowHeight))
          const p3 = triPoint(baseX + size / 2, baseY + (up ? rowHeight : 0))
          const centroidX = (p1.x + p2.x + p3.x) / 3
          const centroidY = (p1.y + p2.y + p3.y) / 3
          if (centroidX < -size || centroidX > WIDTH + size || centroidY < -size || centroidY > HEIGHT + size) continue

          // Position drives the deformation: distance from center sets scale (the "gradient"), while
          // two noise fields sampled at the centroid set jitter and rotation — every tile's transform is
          // a function of where it is, not an independent dice roll.
          const distT = Math.hypot(centroidX - cx, centroidY - cy) / maxDist
          const scale = 1 - distT * gradientStrength * 0.6
          const localRotation = rotationField(centroidX, centroidY) * rotationAmount * 0.6

          const cosR = Math.cos(localRotation)
          const sinR = Math.sin(localRotation)
          const points = [p1, p2, p3].map((p) => {
            const jx = jitterField(p.x, p.y) * distortion * size * 0.25
            const jy = jitterField(p.y, p.x) * distortion * size * 0.25
            const shrunk = { x: centroidX + (p.x + jx - centroidX) * (1 - gap) * scale, y: centroidY + (p.y + jy - centroidY) * (1 - gap) * scale }
            const dx = shrunk.x - centroidX
            const dy = shrunk.y - centroidY
            return { x: centroidX + dx * cosR - dy * sinR, y: centroidY + dx * sinR + dy * cosR }
          })

          shapes.push({
            shape: { kind: 'path', d: `M ${points.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')} Z` },
            fill: palette[Math.floor(distT * (palette.length - 0.001))] ?? rng.pick(palette),
            opacity: rng.range(0.8, 1),
          })
        }
      }
    }

    return {
      id: `triaxial-tessellation-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'triangles', name: 'Triangles', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'triaxial-tessellation', generatorName: 'Triaxial Tessellation', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
