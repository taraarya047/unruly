import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng, type Rng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800

interface Pt {
  x: number
  y: number
}

/** One jagged crack polyline via a biased random walk — direction drifts slowly rather than kinking
 *  sharply every step, which is what reads as a crack rather than a lightning bolt. */
function walkCrack(start: Pt, angle: number, length: number, irregularity: number, rng: Rng): Pt[] {
  const points: Pt[] = [start]
  let a = angle
  let { x, y } = start
  const segLen = 8
  const steps = Math.round(length / segLen)
  for (let i = 0; i < steps; i++) {
    a += rng.range(-irregularity, irregularity) * 0.5
    x += Math.cos(a) * segLen
    y += Math.sin(a) * segLen
    points.push({ x, y })
  }
  return points
}

function pathD(points: Pt[]): string {
  return `M ${points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`
}

export const crackedEarthGenerator: GeneratorDefinition = {
  id: 'cracked-earth',
  name: 'Cracked Earth',
  category: 'texture',
  description: 'Several independent crack lines that drift and branch — a network built from multiple sources, not one recursive root.',
  tags: ['texture', 'organic', 'network', 'branching'],
  defaultParameters: {
    crackCount: 6,
    branchProbability: 0.5,
    irregularity: 0.5,
    thickness: 1.4,
  },
  parameterSchema: [
    { key: 'crackCount', label: 'Primary cracks', type: 'number', group: 'pattern', min: 2, max: 14, step: 1, semantic: 'density' },
    { key: 'branchProbability', label: 'Branching', type: 'number', group: 'variation', min: 0.1, max: 0.9, step: 0.02, semantic: 'complexity' },
    { key: 'irregularity', label: 'Irregularity', type: 'number', group: 'variation', min: 0.1, max: 1, step: 0.02, semantic: 'jitter' },
    { key: 'thickness', label: 'Thickness', type: 'number', group: 'color', min: 0.5, max: 3, step: 0.1 },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const crackCount = Math.round(Number(parameters.crackCount))
    const branchProbability = Number(parameters.branchProbability)
    const irregularity = Number(parameters.irregularity)
    const thickness = Number(parameters.thickness)
    const palette = colors.length ? colors : ['#111111']

    const shapes: StyledShape[] = []
    for (let i = 0; i < crackCount; i++) {
      const start = { x: rng.range(0, WIDTH), y: rng.range(0, HEIGHT) }
      const angle = rng.range(0, Math.PI * 2)
      const length = rng.range(WIDTH * 0.3, WIDTH * 0.9)
      const primary = walkCrack(start, angle, length, irregularity, rng)
      shapes.push({ shape: { kind: 'path', d: pathD(primary) }, stroke: rng.pick(palette), strokeWidth: thickness, fill: 'none', opacity: 0.9 })

      // Secondary cracks branch off the primary at roughly perpendicular angles, at a handful of
      // points along it — distinct sources joining a shared network, rather than one tree growing out.
      for (let p = 4; p < primary.length - 4; p += 5) {
        if (!rng.bool(branchProbability * 0.5)) continue
        const origin = primary[p]
        const branchAngle = angle + Math.PI / 2 + rng.sign() * rng.range(-0.4, 0.4)
        const branchLength = length * rng.range(0.15, 0.4)
        const secondary = walkCrack(origin, branchAngle, branchLength, irregularity, rng)
        shapes.push({ shape: { kind: 'path', d: pathD(secondary) }, stroke: rng.pick(palette), strokeWidth: thickness * 0.6, fill: 'none', opacity: 0.75 })
      }
    }

    return {
      id: `cracked-earth-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'cracks', name: 'Crack Network', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'cracked-earth', generatorName: 'Cracked Earth', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
