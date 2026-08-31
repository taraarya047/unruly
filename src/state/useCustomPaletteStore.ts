import { create } from 'zustand'
import type { Palette } from '@/palette/types'

const STORAGE_KEY = 'svgplayground:customPalettes'

function readAll(): Palette[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Palette[]) : []
  } catch {
    return []
  }
}

function writeAll(palettes: Palette[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes))
}

interface CustomPaletteStoreState {
  palettes: Palette[]
  add: (input: Omit<Palette, 'id'>) => Palette
  update: (id: string, updates: Partial<Omit<Palette, 'id'>>) => void
  remove: (id: string) => void
  reorder: (order: string[]) => void
}

export const useCustomPaletteStore = create<CustomPaletteStoreState>((set, get) => ({
  palettes: readAll(),

  add: (input) => {
    const record: Palette = { ...input, id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
    const palettes = [...get().palettes, record]
    writeAll(palettes)
    set({ palettes })
    return record
  },

  update: (id, updates) => {
    const palettes = get().palettes.map((p) => (p.id === id ? { ...p, ...updates } : p))
    writeAll(palettes)
    set({ palettes })
  },

  remove: (id) => {
    const palettes = get().palettes.filter((p) => p.id !== id)
    writeAll(palettes)
    set({ palettes })
  },

  reorder: (order) => {
    const byId = new Map(get().palettes.map((p) => [p.id, p]))
    const palettes = order.map((id) => byId.get(id)).filter((p): p is Palette => !!p)
    writeAll(palettes)
    set({ palettes })
  },
}))
