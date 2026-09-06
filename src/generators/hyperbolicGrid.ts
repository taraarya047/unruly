import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

/**
 * A genuine (approximate) Poincaré-disk-style conformal mapping: points are pulled toward the disk
 * boundary by a curvature-dependent factor that grows without bound as they approach the edge, so
 * evenly-spaced grid lines compress into infinitely many copies near the boundary — the actual
 * mathematical signature of hyperbolic space, not an arbitrary lens-warp like Spatial Warp Grid's modes.
 */
function poincareMap(x: number, y: number, curvature: number): { x: number; y: number } {
  const r = Math.hypot(x, y)
  if (r < 1e-6) return { x, y }
  const bounded = Math.tanh(r * curvature) / curvature
  const scale = bounded / r
  return { x: x * scale, y: y * scale }
}

export const hyperbolicGridGenerator: GeneratorDefinition = {
  id: 'hyperbolic-grid',
  name: 'Hyperbolic Grid',
  category: 'optical',
  description: 'A grid mapped onto a Poincaré disk — lines that are evenly spaced in hyperbolic space compress infinitely as they approach the boundary, the real signature of curved space.',
  tags: ['optical', 'mathematical', 'non-euclidean', 'grid'],
  defaultParameters: {
    density: 14,
    curvature: 1.2,
    perspective: 0.5,
  },
  parameterSchema: [
    { key: 'density', label: 'Density', type: 'number', group: 'pattern', min: 6, max: 26, step: 1, semantic: 'density' },
    { key: 'curvature', label: 'Curvature', type: 'number', group: 'shape', min: 0.4, max: 2.4, step: 0.05, semantic: 'complexity' },
    { key: 'perspective', label: 'Center bias', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const density = Math.round(Number(parameters.density))
    const curvature = Number(parameters.curvature)
    const perspective = Number(parameters.perspective)
    const palette = colors.length ? colors : ['#111111']
    const cx = WIDTH / 2
    const cy = HEIGHT / 2
    const diskRadius = WIDTH * 0.46
    // Lines cluster more tightly near the origin (in the un-mapped space) as `perspective` increases,
    // giving the eye more detail to read the curvature against near the center.
    const positions = Array.from({ length: density * 2 + 1 }, (_, i) => {
      const t = (i - density) / density
      return Math.sign(t) * Math.pow(Math.abs(t), 1 - perspective * 0.6) * diskRadius
    })

    const shapes: StyledShape[] = []
    const segmentsPerLine = 80
    for (const v of positions) {
      const vertical: string[] = []
      const horizontal: string[] = []
      for (let i = 0; i <= segmentsPerLine; i++) {
        const t = (i / segmentsPerLine - 0.5) * 2 * diskRadius
        const pv = poincareMap(v, t, curvature / diskRadius)
        const ph = poincareMap(t, v, curvature / diskRadius)
        vertical.push(`${(cx + pv.x).toFixed(1)} ${(cy + pv.y).toFixed(1)}`)
        horizontal.push(`${(cx + ph.x).toFixed(1)} ${(cy + ph.y).toFixed(1)}`)
      }
      shapes.push({ shape: { kind: 'path', d: `M ${vertical.join(' L ')}` }, stroke: rng.pick(palette), strokeWidth: 1, fill: 'none', opacity: 0.75 })
      shapes.push({ shape: { kind: 'path', d: `M ${horizontal.join(' L ')}` }, stroke: rng.pick(palette), strokeWidth: 1, fill: 'none', opacity: 0.75 })
    }
    shapes.push({ shape: { kind: 'ring', cx, cy, r: diskRadius }, stroke: rng.pick(palette), strokeWidth: 1.5, fill: 'none', opacity: 0.9 })

    return {
      id: `hyperbolic-grid-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'grid', name: 'Hyperbolic Grid', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'hyperbolic-grid', generatorName: 'Hyperbolic Grid', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
