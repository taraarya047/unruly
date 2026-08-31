import { create } from 'zustand'
import type { CompositionState, SafeZoneSide, TextAlign } from '@/composition/types'
import { CANVAS_PRESETS, DEFAULT_CANVAS_PRESET, DEFAULT_LAYOUT, LAYOUT_PRESETS } from '@/composition/types'

interface CompositionStoreState extends CompositionState {
  setCanvasPreset: (presetId: string) => void
  setCustomCanvas: (width: number, height: number) => void
  setLayout: (layoutId: string) => void
  setFocal: (x: number, y: number) => void
  setScale: (scale: number) => void
  setRotation: (rotation: number) => void
  setSafeZone: (side: SafeZoneSide) => void
  toggleSafeZoneOverlay: () => void
  setTextEnabled: (enabled: boolean) => void
  setTextField: (field: 'heading' | 'body', value: string) => void
  setTextAlign: (align: TextAlign) => void
}

function initial(): CompositionState {
  const layout = DEFAULT_LAYOUT
  return {
    canvasWidth: DEFAULT_CANVAS_PRESET.width,
    canvasHeight: DEFAULT_CANVAS_PRESET.height,
    canvasPresetId: DEFAULT_CANVAS_PRESET.id,
    layoutId: layout.id,
    focalX: layout.focalX,
    focalY: layout.focalY,
    scale: layout.scale,
    rotation: layout.rotation,
    safeZone: 'none',
    showSafeZoneOverlay: true,
    text: { enabled: false, heading: 'Make something unexpected.', body: 'A parametric design playground.', align: 'left' },
  }
}

export const useCompositionStore = create<CompositionStoreState>((set) => ({
  ...initial(),

  setCanvasPreset: (presetId) => {
    const preset = CANVAS_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    set({ canvasPresetId: presetId, canvasWidth: preset.width, canvasHeight: preset.height })
  },

  setCustomCanvas: (width, height) => set({ canvasPresetId: 'custom', canvasWidth: Math.round(width), canvasHeight: Math.round(height) }),

  setLayout: (layoutId) => {
    const layout = LAYOUT_PRESETS.find((l) => l.id === layoutId)
    if (!layout) return
    set({ layoutId, focalX: layout.focalX, focalY: layout.focalY, scale: layout.scale, rotation: layout.rotation })
  },

  setFocal: (x, y) => set({ focalX: Math.min(1, Math.max(0, x)), focalY: Math.min(1, Math.max(0, y)) }),
  setScale: (scale) => set({ scale }),
  setRotation: (rotation) => set({ rotation }),
  setSafeZone: (side) => set({ safeZone: side }),
  toggleSafeZoneOverlay: () => set((s) => ({ showSafeZoneOverlay: !s.showSafeZoneOverlay })),

  setTextEnabled: (enabled) => set((s) => ({ text: { ...s.text, enabled } })),
  setTextField: (field, value) => set((s) => ({ text: { ...s.text, [field]: value } })),
  setTextAlign: (align) => set((s) => ({ text: { ...s.text, align } })),
}))
