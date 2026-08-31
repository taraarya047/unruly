import type { Rng } from '@/engine/prng'
import type { Palette } from './types'

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s = Math.min(1, Math.max(0, s))
  l = Math.min(1, Math.max(0, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let [r, g, b] = [0, 0, 0]
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export type HarmonyKind =
  | 'monochrome'
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'duotone'
  | 'high-contrast'
  | 'muted'
  | 'vivid'

const HARMONY_KINDS: HarmonyKind[] = [
  'monochrome',
  'complementary',
  'analogous',
  'triadic',
  'duotone',
  'high-contrast',
  'muted',
  'vivid',
]

export function generateHarmonyPalette(rng: Rng, kind?: HarmonyKind): Palette {
  const k = kind ?? rng.pick(HARMONY_KINDS)
  const baseHue = rng.range(0, 360)
  let colors: string[] = []
  let sat = rng.range(0.55, 0.85)
  let light = rng.range(0.5, 0.62)
  let bg = '#f7f5f0'

  switch (k) {
    case 'monochrome':
      colors = [0.3, 0.45, 0.6, 0.75].map((l) => hslToHex(baseHue, sat, l))
      bg = hslToHex(baseHue, sat * 0.15, 0.97)
      break
    case 'complementary':
      colors = [hslToHex(baseHue, sat, light), hslToHex(baseHue + 180, sat, light), hslToHex(baseHue, sat * 0.6, light + 0.2)]
      break
    case 'analogous':
      colors = [-30, -15, 0, 15, 30].map((d) => hslToHex(baseHue + d, sat, light))
      break
    case 'triadic':
      colors = [0, 120, 240].map((d) => hslToHex(baseHue + d, sat, light))
      break
    case 'duotone':
      colors = [hslToHex(baseHue, sat, 0.35), hslToHex(baseHue, sat, 0.35)]
      bg = hslToHex(baseHue, sat * 0.25, 0.94)
      break
    case 'high-contrast':
      colors = [hslToHex(baseHue, 0.9, 0.2), hslToHex(baseHue + 180, 0.9, 0.55), '#111111', '#f5f5f0']
      break
    case 'muted':
      sat = rng.range(0.15, 0.35)
      colors = [0, 60, 150, 220].map((d) => hslToHex(baseHue + d, sat, rng.range(0.45, 0.7)))
      bg = hslToHex(baseHue, 0.08, 0.95)
      break
    case 'vivid':
      sat = rng.range(0.8, 1)
      colors = [0, 40, 90, 160, 260].map((d) => hslToHex(baseHue + d, sat, rng.range(0.5, 0.62)))
      break
  }

  return {
    id: `harmony-${k}-${Math.round(baseHue)}`,
    name: `${capitalize(k)} ${Math.round(baseHue)}°`,
    colors,
    background: bg,
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
}

export function generatePaletteBatch(rng: Rng, count = 8): Palette[] {
  return Array.from({ length: count }, () => generateHarmonyPalette(rng))
}
