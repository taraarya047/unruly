import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'
import { makeHeightField } from '@/engine/math/noise'
import { traceStreamline } from '@/engine/math/streamlines'

const WIDTH = 800
const HEIGHT = 800
const EPS = 4

export const riverNetworkGenerator: GeneratorDefinition = {
  id: 'river-network',
  name: 'River Network',
  category: 'organic',
  description: 'Rivers traced by steepest descent down a procedural terrain — the same gradient-following rule real water obeys, not a hand-drawn branching pattern.',
  tags: ['organic', 'terrain', 'flow', 'network'],
  defaultParameters: {
    riverCount: 10,
    terrainComplexity: 3,
    meandering: 0.4,
    width: 2,
  },
  parameterSchema: [
    { key: 'riverCount', label: 'River count', type: 'number', group: 'pattern', min: 3, max: 24, step: 1, semantic: 'density' },
    { key: 'terrainComplexity', label: 'Terrain complexity', type: 'number', group: 'shape', min: 1, max: 6, step: 1, semantic: 'complexity' },
    { key: 'meandering', label: 'Meandering', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'width', label: 'River width', type: 'number', group: 'color', min: 0.5, max: 4, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const riverCount = Math.round(Number(parameters.riverCount))
    const terrainComplexity = Math.round(Number(parameters.terrainComplexity))
    const meandering = Number(parameters.meandering)
    const baseWidth = Number(parameters.width)
    const palette = colors.length ? colors : ['#2a6f97']

    const heightField = makeHeightField(rng.fork(1), terrainComplexity)
    const field = (x: number, y: number) => heightField(x / WIDTH, y / HEIGHT)

    // Flow downhill: velocity is the negative gradient of elevation, found by finite differences —
    // this is what makes the traced path a real steepest-descent river rather than an arbitrary curve.
    // The raw gradient's magnitude is tiny (a finite difference over a field normalized to the whole
    // canvas), so it's normalized to a unit direction before blending in meander jitter — otherwise the
    // jitter term dwarfs the true downhill signal and the "river" degenerates into a jittery scribble
    // instead of following the terrain.
    const velocity = (x: number, y: number) => {
      const dHdx = (field(x + EPS, y) - field(x - EPS, y)) / (2 * EPS)
      const dHdy = (field(x, y + EPS) - field(x, y - EPS)) / (2 * EPS)
      const gradLen = Math.hypot(dHdx, dHdy) || 1e-6
      const gx = -dHdx / gradLen
      const gy = -dHdy / gradLen
      const jx = rng.range(-meandering, meandering) * 0.5
      const jy = rng.range(-meandering, meandering) * 0.5
      return { vx: gx + jx, vy: gy + jy }
    }

    // Start each river near a local high point — sample many candidates and keep the highest ones, so
    // rivers begin in the "mountains" the height field actually describes rather than anywhere at all.
    const candidates = Array.from({ length: riverCount * 12 }, () => {
      const p = { x: rng.range(20, WIDTH - 20), y: rng.range(20, HEIGHT - 20) }
      return { ...p, h: field(p.x, p.y) }
    }).sort((a, b) => b.h - a.h)

    const shapes: StyledShape[] = []
    for (let i = 0; i < riverCount; i++) {
      const start = candidates[i % candidates.length]
      const points = traceStreamline(start, velocity, 140, 6, { width: WIDTH, height: HEIGHT })
      if (points.length < 4) continue
      // Rivers widen as they flow and gather volume — the opposite taper direction from a lightning
      // bolt or tree branch.
      const segments = points.length - 1
      for (let s = 0; s < segments; s++) {
        const t = s / segments
        shapes.push({
          shape: { kind: 'line', x1: points[s].x, y1: points[s].y, x2: points[s + 1].x, y2: points[s + 1].y },
          stroke: rng.pick(palette),
          strokeWidth: baseWidth * (0.4 + t * 1.6),
          opacity: 0.7 + t * 0.3,
        })
      }
    }

    return {
      id: `river-network-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'rivers', name: 'Rivers', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'river-network', generatorName: 'River Network', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
