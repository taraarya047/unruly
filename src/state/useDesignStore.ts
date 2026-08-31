import { create } from 'zustand'
import type { GeneratorParameters, ParamGroup } from '@/engine/types'
import type { Palette } from '@/palette/types'
import { randomSeed, createRng } from '@/engine/prng'
import { generatorRegistry } from '@/engine/registry'
import '@/generators'
import { applySemanticAction, type SemanticAction } from '@/engine/mutate'
import { generateVariations } from '@/engine/evolve'
import { randomizeParameters } from '@/engine/randomizeParams'
import { DEFAULT_PALETTE, PALETTE_PRESETS } from '@/palette/presets'
import { generateHarmonyPalette } from '@/palette/harmony'
import type { DesignPreset } from '@/presets/designPresets'

export interface DesignSnapshot {
  generatorId: string
  parameters: GeneratorParameters
  seed: number
  palette: Palette
}

export interface Locks {
  geometry: boolean
  composition: boolean
  texture: boolean
  palette: boolean
}

const LOCK_GROUPS: Record<keyof Locks, ParamGroup[]> = {
  geometry: ['shape'],
  composition: ['pattern', 'composition'],
  texture: ['variation'],
  palette: ['color'],
}

const ALL_GROUPS: ParamGroup[] = ['shape', 'pattern', 'variation', 'composition', 'color']

function unlockedGroups(locks: Locks): Set<ParamGroup> {
  const groups = new Set<ParamGroup>(ALL_GROUPS)
  ;(Object.keys(LOCK_GROUPS) as (keyof Locks)[]).forEach((key) => {
    if (locks[key]) LOCK_GROUPS[key].forEach((g) => groups.delete(g))
  })
  return groups
}

interface DesignStoreState extends DesignSnapshot {
  locks: Locks
  history: DesignSnapshot[]
  historyIndex: number
  advancedMode: boolean

  setGenerator: (generatorId: string) => void
  setParameter: (key: string, value: number | string | boolean) => void
  setParameters: (params: GeneratorParameters) => void
  setSeed: (seed: number) => void
  setPalette: (palette: Palette) => void
  toggleLock: (key: keyof Locks) => void
  toggleAdvancedMode: () => void

  randomizeNew: () => void
  randomizeEvolve: () => void
  randomizeRemix: () => void
  randomizeRecolor: () => void
  randomizeDistort: () => void
  applyAction: (action: SemanticAction) => void
  applyPreset: (preset: DesignPreset) => void

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  loadSnapshot: (snapshot: DesignSnapshot) => void
}

const HISTORY_LIMIT = 50

function initialSnapshot(): DesignSnapshot {
  const generator = generatorRegistry.all()[0]
  return {
    generatorId: generator.id,
    parameters: { ...generator.defaultParameters },
    seed: randomSeed(),
    palette: DEFAULT_PALETTE,
  }
}

function pushHistory(state: DesignStoreState, snapshot: DesignSnapshot): Partial<DesignStoreState> {
  const truncated = state.history.slice(0, state.historyIndex + 1)
  const nextHistory = [...truncated, snapshot].slice(-HISTORY_LIMIT)
  return { history: nextHistory, historyIndex: nextHistory.length - 1 }
}

export const useDesignStore = create<DesignStoreState>((set, get) => {
  const initial = initialSnapshot()
  return {
    ...initial,
    locks: { geometry: false, composition: false, texture: false, palette: false },
    history: [initial],
    historyIndex: 0,
    advancedMode: false,

    setGenerator: (generatorId) => {
      const generator = generatorRegistry.get(generatorId)
      if (!generator) return
      set((state) => {
        const snapshot: DesignSnapshot = {
          generatorId,
          parameters: { ...generator.defaultParameters },
          seed: randomSeed(),
          palette: state.palette,
        }
        return { ...snapshot, ...pushHistory(state, snapshot) }
      })
    },

    setParameter: (key, value) => {
      set((state) => {
        const parameters = { ...state.parameters, [key]: value }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters, seed: state.seed, palette: state.palette }
        return { parameters, ...pushHistory(state, snapshot) }
      })
    },

    setParameters: (params) => {
      set((state) => {
        const parameters = { ...state.parameters, ...params }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters, seed: state.seed, palette: state.palette }
        return { parameters, ...pushHistory(state, snapshot) }
      })
    },

    setSeed: (seed) => {
      set((state) => {
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed, palette: state.palette }
        return { seed, ...pushHistory(state, snapshot) }
      })
    },

    setPalette: (palette) => {
      set((state) => {
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette }
        return { palette, ...pushHistory(state, snapshot) }
      })
    },

    toggleLock: (key) => set((state) => ({ locks: { ...state.locks, [key]: !state.locks[key] } })),
    toggleAdvancedMode: () => set((state) => ({ advancedMode: !state.advancedMode })),

    // "Surprise me" — rerolls everything not protected by a lock. Locking geometry keeps the
    // generator/seed/shape identity; composition/texture/palette locks each protect their own
    // parameter groups. See §19 of the product spec.
    randomizeNew: () => {
      set((state) => {
        const rng = createRng(randomSeed())
        const groups = unlockedGroups(state.locks)
        const generatorId = state.locks.geometry ? state.generatorId : rng.pick(generatorRegistry.all()).id
        const generator = generatorRegistry.get(generatorId)!
        const baseParams = generatorId === state.generatorId ? state.parameters : generator.defaultParameters
        const parameters = randomizeParameters(generator.parameterSchema, baseParams, groups, rng)
        const seed = state.locks.geometry ? state.seed : randomSeed()
        const palette = state.locks.palette ? state.palette : rng.pick(PALETTE_PRESETS)
        const snapshot: DesignSnapshot = { generatorId, parameters, seed, palette }
        return { ...snapshot, ...pushHistory(state, snapshot) }
      })
    },

    // Nudges the current design toward a nearby variation, respecting locks group-by-group.
    randomizeEvolve: () => {
      set((state) => {
        const generator = generatorRegistry.get(state.generatorId)!
        const groups = unlockedGroups(state.locks)
        const [variation] = generateVariations(generator, state.parameters, 1, 0.18, groups)
        const snapshot: DesignSnapshot = {
          generatorId: state.generatorId,
          parameters: variation.parameters,
          seed: state.locks.geometry ? state.seed : variation.seed,
          palette: state.palette,
        }
        return { ...snapshot, ...pushHistory(state, snapshot) }
      })
    },

    // Preserves the palette, swaps the visual system entirely — a direct action, not gated by locks.
    randomizeRemix: () => {
      set((state) => {
        const others = generatorRegistry.all().filter((g) => g.id !== state.generatorId)
        const rng = createRng(randomSeed())
        const generator = others.length ? rng.pick(others) : generatorRegistry.get(state.generatorId)!
        const snapshot: DesignSnapshot = {
          generatorId: generator.id,
          parameters: { ...generator.defaultParameters },
          seed: randomSeed(),
          palette: state.palette,
        }
        return { ...snapshot, ...pushHistory(state, snapshot) }
      })
    },

    // Preserves geometry, generates a fresh harmony palette — a direct action, not gated by locks.
    randomizeRecolor: () => {
      set((state) => {
        const rng = createRng(randomSeed())
        const palette = generateHarmonyPalette(rng)
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette }
        return { palette, ...pushHistory(state, snapshot) }
      })
    },

    // Preserves identity (generator/seed/palette), rerolls only the variation/texture parameters.
    randomizeDistort: () => {
      set((state) => {
        const rng = createRng(randomSeed())
        const generator = generatorRegistry.get(state.generatorId)!
        const parameters = randomizeParameters(generator.parameterSchema, state.parameters, new Set<ParamGroup>(['variation']), rng)
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters, seed: state.seed, palette: state.palette }
        return { parameters, ...pushHistory(state, snapshot) }
      })
    },

    applyAction: (action) => {
      set((state) => {
        const generator = generatorRegistry.get(state.generatorId)!
        const parameters = applySemanticAction(generator, state.parameters, action)
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters, seed: state.seed, palette: state.palette }
        return { parameters, ...pushHistory(state, snapshot) }
      })
    },

    applyPreset: (preset) => {
      const generator = generatorRegistry.get(preset.generatorId)
      if (!generator) return
      set((state) => {
        const snapshot: DesignSnapshot = {
          generatorId: preset.generatorId,
          parameters: { ...generator.defaultParameters, ...preset.parameters } as GeneratorParameters,
          seed: preset.seed ?? randomSeed(),
          palette: preset.palette,
        }
        return { ...snapshot, ...pushHistory(state, snapshot) }
      })
    },

    undo: () => {
      const state = get()
      if (state.historyIndex <= 0) return
      const nextIndex = state.historyIndex - 1
      const snapshot = state.history[nextIndex]
      set({ ...snapshot, historyIndex: nextIndex })
    },

    redo: () => {
      const state = get()
      if (state.historyIndex >= state.history.length - 1) return
      const nextIndex = state.historyIndex + 1
      const snapshot = state.history[nextIndex]
      set({ ...snapshot, historyIndex: nextIndex })
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    loadSnapshot: (snapshot) => {
      set((state) => ({ ...snapshot, ...pushHistory(state, snapshot) }))
    },
  }
})
