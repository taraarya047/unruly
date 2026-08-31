import { create } from 'zustand'
import type { GeneratorParameters } from '@/engine/types'
import type { Palette } from '@/palette/types'
import type { LayerState } from '@/engine/composeLayers'
import type { GeneratorLayerConfig } from './useDesignStore'

export interface SavedDesign {
  id: string
  name: string
  generatorId: string
  parameters: GeneratorParameters
  seed: number
  palette: Palette
  /** Optional for backward compatibility with designs saved before the layer system existed. */
  layers?: LayerState
  /** Optional for backward compatibility with designs saved before stacked generator layers existed. */
  generatorLayers?: GeneratorLayerConfig[]
  /** Optional for backward compatibility with designs saved before tags existed. */
  tags?: string[]
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'svgplayground:saved'

function readAll(): SavedDesign[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedDesign[]) : []
  } catch {
    return []
  }
}

function writeAll(designs: SavedDesign[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ')
}

interface SavedStoreState {
  designs: SavedDesign[]
  save: (input: Omit<SavedDesign, 'id' | 'createdAt' | 'updatedAt'>) => SavedDesign
  rename: (id: string, name: string) => void
  duplicate: (id: string) => void
  remove: (id: string) => void
  addTag: (id: string, tag: string) => void
  removeTag: (id: string, tag: string) => void
  /** Imports a design from an exported JSON payload as a brand-new saved record. */
  importDesign: (input: Omit<SavedDesign, 'id' | 'createdAt' | 'updatedAt'>) => SavedDesign
}

export const useSavedStore = create<SavedStoreState>((set, get) => ({
  designs: readAll(),

  save: (input) => {
    const now = Date.now()
    const record: SavedDesign = { ...input, id: `d-${now}-${Math.random().toString(36).slice(2, 8)}`, createdAt: now, updatedAt: now }
    const designs = [record, ...get().designs]
    writeAll(designs)
    set({ designs })
    return record
  },

  rename: (id, name) => {
    const designs = get().designs.map((d) => (d.id === id ? { ...d, name, updatedAt: Date.now() } : d))
    writeAll(designs)
    set({ designs })
  },

  duplicate: (id) => {
    const source = get().designs.find((d) => d.id === id)
    if (!source) return
    const now = Date.now()
    const copy: SavedDesign = { ...source, id: `d-${now}-${Math.random().toString(36).slice(2, 8)}`, name: `${source.name} copy`, createdAt: now, updatedAt: now }
    const designs = [copy, ...get().designs]
    writeAll(designs)
    set({ designs })
  },

  remove: (id) => {
    const designs = get().designs.filter((d) => d.id !== id)
    writeAll(designs)
    set({ designs })
  },

  addTag: (id, tag) => {
    const clean = normalizeTag(tag)
    if (!clean) return
    const designs = get().designs.map((d) => {
      if (d.id !== id) return d
      const tags = d.tags ?? []
      return tags.includes(clean) ? d : { ...d, tags: [...tags, clean], updatedAt: Date.now() }
    })
    writeAll(designs)
    set({ designs })
  },

  removeTag: (id, tag) => {
    const designs = get().designs.map((d) => (d.id === id ? { ...d, tags: (d.tags ?? []).filter((t) => t !== tag), updatedAt: Date.now() } : d))
    writeAll(designs)
    set({ designs })
  },

  importDesign: (input) => {
    const now = Date.now()
    const record: SavedDesign = { ...input, id: `d-${now}-${Math.random().toString(36).slice(2, 8)}`, createdAt: now, updatedAt: now }
    const designs = [record, ...get().designs]
    writeAll(designs)
    set({ designs })
    return record
  },
}))
