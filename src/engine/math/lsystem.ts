import type { Rng } from '@/engine/prng'

export interface LSystemRules {
  axiom: string
  rules: Record<string, string>
}

/** Expands an L-system string by rewriting each character per `rules` for `iterations` generations. */
export function expandLSystem({ axiom, rules }: LSystemRules, iterations: number, maxLength = 20000): string {
  let s = axiom
  for (let i = 0; i < iterations; i++) {
    let next = ''
    for (const ch of s) next += rules[ch] ?? ch
    s = next
    if (s.length > maxLength) return s.slice(0, maxLength)
  }
  return s
}

export interface TurtleSegment {
  x1: number
  y1: number
  x2: number
  y2: number
  depth: number
}

/**
 * Turtle-graphics interpreter for L-system strings: F/G draw forward, +/- turn, [/] push/pop state.
 * `angleJitter` (radians) adds organic irregularity per turn, seeded by `rng`.
 */
export function turtleInterpret(str: string, startX: number, startY: number, startAngle: number, stepLength: number, angleStep: number, angleJitter: number, rng: Rng): TurtleSegment[] {
  const segments: TurtleSegment[] = []
  const stack: { x: number; y: number; angle: number; depth: number }[] = []
  let x = startX
  let y = startY
  let angle = startAngle
  let depth = 0
  const maxSegments = 8000

  for (const ch of str) {
    if (segments.length > maxSegments) break
    switch (ch) {
      case 'F':
      case 'G': {
        const nx = x + Math.cos(angle) * stepLength
        const ny = y + Math.sin(angle) * stepLength
        segments.push({ x1: x, y1: y, x2: nx, y2: ny, depth })
        x = nx
        y = ny
        break
      }
      case '+':
        angle += angleStep + rng.range(-angleJitter, angleJitter)
        break
      case '-':
        angle -= angleStep + rng.range(-angleJitter, angleJitter)
        break
      case '[':
        stack.push({ x, y, angle, depth })
        depth++
        break
      case ']': {
        const popped = stack.pop()
        if (popped) {
          x = popped.x
          y = popped.y
          angle = popped.angle
          depth = popped.depth
        }
        break
      }
    }
  }
  return segments
}

export const LSYSTEM_PRESETS: Record<string, LSystemRules & { angle: number }> = {
  tree: { axiom: 'F', rules: { F: 'FF+[+F-F-F]-[-F+F+F]' }, angle: 22.5 },
  fern: { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25 },
  coral: { axiom: 'F', rules: { F: 'F[+F]F[-F]F' }, angle: 20 },
  lightning: { axiom: 'F', rules: { F: 'F[+F][-F]F' }, angle: 35 },
  roots: { axiom: 'F', rules: { F: 'FF-[-F+F+F]+[+F-F-F]' }, angle: 17 },
}
