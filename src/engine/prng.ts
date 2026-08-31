/**
 * Deterministic seeded PRNG (mulberry32). Generators must pull all randomness
 * from an Rng instance passed into generate() — never call Math.random() directly.
 */
export interface Rng {
  next(): number // [0, 1)
  range(min: number, max: number): number
  int(min: number, maxInclusive: number): number
  pick<T>(arr: readonly T[]): T
  sign(): 1 | -1
  bool(probability?: number): boolean
  fork(salt: number): Rng // derive an independent sub-stream (for lockable subsystems)
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(input: string | number): number {
  if (typeof input === 'number') return input >>> 0
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function createRng(seed: number): Rng {
  const rand = mulberry32(seed)
  const api: Rng = {
    next: rand,
    range: (min, max) => min + rand() * (max - min),
    int: (min, maxInclusive) => min + Math.floor(rand() * (maxInclusive - min + 1)),
    pick: (arr) => arr[Math.floor(rand() * arr.length)],
    sign: () => (rand() < 0.5 ? -1 : 1),
    bool: (probability = 0.5) => rand() < probability,
    fork: (salt) => createRng((seed ^ hashSeed(salt * 2654435761)) >>> 0),
  }
  return api
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}
