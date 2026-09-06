import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

const MODE_OPTIONS = [
  { label: 'Wireframe', value: 'wireframe' },
  { label: 'Radial mesh', value: 'radial' },
  { label: 'Contour', value: 'contour' },
]

/**
 * A real orthographic projection of a lat/long sphere onto the 2D canvas — every point is computed from
 * actual spherical coordinates (longitude, latitude) rotated and projected, which is what makes lines
 * near the visible edge compress correctly (the hallmark of looking at a sphere) rather than just being
 * drawn as an ellipse.
 */
function project(lon: number, lat: number, rotation: number, radius: number): { x: number; y: number; visible: boolean } {
  const theta = lon + rotation
  const x3 = Math.cos(lat) * Math.sin(theta)
  const y3 = Math.sin(lat)
  const z3 = Math.cos(lat) * Math.cos(theta)
  return { x: WIDTH / 2 + x3 * radius, y: HEIGHT / 2 - y3 * radius, visible: z3 > -0.05 }
}

export const sphericalProjectionGenerator: GeneratorDefinition = {
  id: 'spherical-projection',
  name: 'Spherical Projection',
  category: 'optical',
  description: 'A latitude/longitude mesh projected onto a sphere — real 3D-to-2D projection math, so the far side genuinely disappears around the visible edge.',
  tags: ['optical', 'geometric', '3d', 'projection'],
  defaultParameters: {
    mode: 'wireframe',
    meridians: 16,
    parallels: 10,
    rotation: 30,
    curvature: 1,
  },
  parameterSchema: [
    { key: 'mode', label: 'Mode', type: 'select', group: 'shape', options: MODE_OPTIONS },
    { key: 'meridians', label: 'Meridians', type: 'number', group: 'pattern', min: 6, max: 32, step: 1, semantic: 'density' },
    { key: 'parallels', label: 'Parallels', type: 'number', group: 'pattern', min: 4, max: 20, step: 1, semantic: 'density' },
    { key: 'rotation', label: 'Rotation', type: 'angle', group: 'composition', min: 0, max: 360, step: 1, semantic: 'rotation' },
    { key: 'curvature', label: 'Curvature', type: 'number', group: 'shape', min: 0.5, max: 1.3, step: 0.02, semantic: 'scale' },
  ],
  capabilities: { supportsColor: true, supportsRotation: true, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const mode = String(parameters.mode)
    const meridians = Math.round(Number(parameters.meridians))
    const parallels = Math.round(Number(parameters.parallels))
    const rotationRad = (Number(parameters.rotation) * Math.PI) / 180
    const curvature = Number(parameters.curvature)
    const palette = colors.length ? colors : ['#111111']
    const radius = WIDTH * 0.42 * curvature

    const shapes: StyledShape[] = []
    const buildLine = (points: { x: number; y: number; visible: boolean }[], color: string) => {
      let current: string[] = []
      const flush = () => {
        if (current.length > 1) shapes.push({ shape: { kind: 'path', d: `M ${current.join(' L ')}` }, stroke: color, strokeWidth: 1, fill: 'none', opacity: 0.8 })
        current = []
      }
      for (const p of points) {
        if (!p.visible) {
          flush()
          continue
        }
        current.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      }
      flush()
    }

    if (mode === 'wireframe' || mode === 'contour') {
      for (let m = 0; m < meridians; m++) {
        const lon = (m / meridians) * Math.PI * 2
        const points = Array.from({ length: 65 }, (_, i) => project(lon, -Math.PI / 2 + (i / 64) * Math.PI, rotationRad, radius))
        buildLine(points, rng.pick(palette))
      }
      for (let p = 1; p < parallels; p++) {
        const lat = -Math.PI / 2 + (p / parallels) * Math.PI
        const points = Array.from({ length: 129 }, (_, i) => project((i / 128) * Math.PI * 2, lat, rotationRad, radius))
        buildLine(points, rng.pick(palette))
      }
    } else {
      // Radial mesh: concentric latitude rings plus a fan of meridian spokes only from the pole, giving
      // a distinctly different reading of the same projection (a globe's polar aspect).
      for (let p = 1; p <= parallels; p++) {
        const lat = Math.PI / 2 - (p / parallels) * Math.PI * 0.9
        const points = Array.from({ length: 97 }, (_, i) => project((i / 96) * Math.PI * 2, lat, rotationRad, radius))
        buildLine(points, rng.pick(palette))
      }
      for (let m = 0; m < meridians; m++) {
        const lon = (m / meridians) * Math.PI * 2
        const points = Array.from({ length: 33 }, (_, i) => project(lon, Math.PI / 2 - (i / 32) * Math.PI * 0.9, rotationRad, radius))
        buildLine(points, rng.pick(palette))
      }
    }

    return {
      id: `spherical-projection-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'mesh', name: 'Spherical Mesh', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'spherical-projection', generatorName: 'Spherical Projection', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
