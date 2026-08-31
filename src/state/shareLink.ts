import type { GeneratorParameters } from '@/engine/types'
import type { Palette } from '@/palette/types'
import { generatorRegistry } from '@/engine/registry'

/**
 * Shareable links encode the reproducible generative recipe — generator + parameters + seed + palette —
 * the same tuple that already drives determinism everywhere else in the app. Layer edits (visibility/
 * lock/opacity/duplicates) are local session polish and intentionally left out to keep links short.
 */
interface ShareablePayload {
  g: string
  p: GeneratorParameters
  s: number
  pal: Palette
}

const QUERY_KEY = 'd'

function toBase64Url(json: string): string {
  const base64 = btoa(unescape(encodeURIComponent(json)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return decodeURIComponent(escape(atob(padded)))
}

export function buildShareUrl(generatorId: string, parameters: GeneratorParameters, seed: number, palette: Palette): string {
  const payload: ShareablePayload = { g: generatorId, p: parameters, s: seed, pal: palette }
  const encoded = toBase64Url(JSON.stringify(payload))
  const url = new URL(window.location.href)
  url.pathname = '/playground'
  url.search = `?${QUERY_KEY}=${encoded}`
  return url.toString()
}

export interface DecodedShare {
  generatorId: string
  parameters: GeneratorParameters
  seed: number
  palette: Palette
}

/** Reads and validates a `?d=` share payload from the given search string. Returns null if absent/invalid. */
export function decodeShareUrl(search: string): DecodedShare | null {
  const params = new URLSearchParams(search)
  const encoded = params.get(QUERY_KEY)
  if (!encoded) return null
  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as ShareablePayload
    if (!generatorRegistry.get(payload.g)) return null
    if (typeof payload.s !== 'number' || !payload.p || !payload.pal?.colors) return null
    return { generatorId: payload.g, parameters: payload.p, seed: payload.s, palette: payload.pal }
  } catch {
    return null
  }
}
