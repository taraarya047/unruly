import type { GeneratorDefinition, StyledShape } from '@/engine/types'
import { createRng } from '@/engine/prng'

const WIDTH = 800
const HEIGHT = 800
const STEPS = 70

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

export const particleCollisionGenerator: GeneratorDefinition = {
  id: 'particle-collision',
  name: 'Particle Collision',
  category: 'particles',
  description: 'Particles that repel each other and settle into a final arrangement — a deterministic physics relaxation, not a live simulation.',
  tags: ['particles', 'physics', 'simulation', 'clustering'],
  defaultParameters: {
    particleCount: 140,
    repulsion: 0.5,
    attraction: 0.3,
    drag: 0.85,
  },
  parameterSchema: [
    { key: 'particleCount', label: 'Particles', type: 'number', group: 'pattern', min: 30, max: 300, step: 5, semantic: 'density' },
    { key: 'repulsion', label: 'Repulsion', type: 'number', group: 'variation', min: 0.1, max: 1, step: 0.02, semantic: 'complexity' },
    { key: 'attraction', label: 'Clustering pull', type: 'number', group: 'variation', min: 0, max: 1, step: 0.02 },
    { key: 'drag', label: 'Drag', type: 'number', group: 'shape', min: 0.5, max: 0.98, step: 0.01, advanced: true },
  ],
  capabilities: { supportsColor: true, supportsRotation: false, supportsDensity: true, supportsLayers: false },
  generate(parameters, seed, colors) {
    const rng = createRng(seed)
    const count = Math.round(Number(parameters.particleCount))
    const repulsion = Number(parameters.repulsion)
    const attraction = Number(parameters.attraction)
    const drag = Number(parameters.drag)
    const palette = colors.length ? colors : ['#111111']

    const clusterCount = 2 + Math.floor(attraction * 3)
    const clusters = Array.from({ length: clusterCount }, () => ({ x: rng.range(150, WIDTH - 150), y: rng.range(150, HEIGHT - 150) }))
    const clusterOf = (i: number) => clusters[i % clusters.length]

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: rng.range(0, WIDTH),
      y: rng.range(0, HEIGHT),
      vx: 0,
      vy: 0,
    }))

    const collisionRadius = 26
    for (let step = 0; step < STEPS; step++) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        let fx = 0
        let fy = 0
        for (let j = 0; j < particles.length; j++) {
          if (i === j) continue
          const q = particles[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const distSq = dx * dx + dy * dy
          if (distSq < collisionRadius * collisionRadius && distSq > 0.01) {
            const dist = Math.sqrt(distSq)
            const force = (repulsion * 40) / distSq
            fx += (dx / dist) * force
            fy += (dy / dist) * force
          }
        }
        const c = clusterOf(i)
        fx += (c.x - p.x) * attraction * 0.004
        fy += (c.y - p.y) * attraction * 0.004

        p.vx = (p.vx + fx) * drag
        p.vy = (p.vy + fy) * drag
        p.x = Math.max(10, Math.min(WIDTH - 10, p.x + p.vx))
        p.y = Math.max(10, Math.min(HEIGHT - 10, p.y + p.vy))
      }
    }

    // Local density (neighbors within the collision radius after settling) drives size/color, so the
    // final image visibly shows which particles ended up in a crowded cluster versus isolated.
    const shapes: StyledShape[] = particles.map((p) => {
      let neighbors = 0
      for (const q of particles) {
        if (Math.hypot(p.x - q.x, p.y - q.y) < collisionRadius) neighbors++
      }
      const density = Math.min(1, neighbors / 8)
      return {
        shape: { kind: 'circle', cx: p.x, cy: p.y, r: 3 + density * 5 },
        fill: palette[Math.floor(density * (palette.length - 0.001))] ?? rng.pick(palette),
        opacity: 0.7 + density * 0.3,
      }
    })

    return {
      id: `particle-collision-${seed}`,
      seed,
      width: WIDTH,
      height: HEIGHT,
      layers: [{ id: 'particles', name: 'Settled Particles', visible: true, locked: false, opacity: 1, shapes }],
      metadata: { generatorId: 'particle-collision', generatorName: 'Particle Collision', seed, paletteId: '', createdAt: Date.now() },
    }
  },
}
