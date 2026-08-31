import { PALETTE_PRESETS } from './presets'
import { useCustomPaletteStore } from '@/state/useCustomPaletteStore'
import type { Palette } from './types'

/** Reactive: built-in palettes (Pride/Trans pinned first) followed by the user's custom ones. */
export function useAllPalettes(): Palette[] {
  const custom = useCustomPaletteStore((s) => s.palettes)
  return [...PALETTE_PRESETS, ...custom]
}

/** Non-reactive equivalent for use outside React (zustand store actions, e.g. randomize). */
export function getAllPalettes(): Palette[] {
  return [...PALETTE_PRESETS, ...useCustomPaletteStore.getState().palettes]
}
