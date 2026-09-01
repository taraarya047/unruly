import { create } from 'zustand'
import type { GeneratorParameters, ParamGroup, SVGLayer, BlendMode } from '@/engine/types'
import { BLEND_MODES } from '@/engine/types'
import type { Palette } from '@/palette/types'
import { randomSeed, createRng } from '@/engine/prng'
import { generatorRegistry } from '@/engine/registry'
import '@/generators'
import { applySemanticAction, type SemanticAction } from '@/engine/mutate'
import { generateVariations } from '@/engine/evolve'
import { randomizeParameters } from '@/engine/randomizeParams'
import { defaultLayerState, type LayerState } from '@/engine/composeLayers'
import { DEFAULT_PALETTE } from '@/palette/presets'
import { getAllPalettes } from '@/palette/allPalettes'
import { generateHarmonyPalette } from '@/palette/harmony'
import type { DesignPreset } from '@/presets/designPresets'

/** One generator stacked on top of the base design, composited via CSS mix-blend-mode + opacity. */
export interface GeneratorLayerConfig {
  id: string
  generatorId: string
  parameters: GeneratorParameters
  seed: number
  opacity: number
  blendMode: BlendMode
  visible: boolean
}

export interface DesignSnapshot {
  generatorId: string
  parameters: GeneratorParameters
  seed: number
  palette: Palette
  layers: LayerState
  /** Additional generator layers stacked above the base design (empty for most designs). */
  generatorLayers: GeneratorLayerConfig[]
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

// Weighted toward 'normal' by repetition so a non-chaos "Surprise me" mostly reads as a soft
// composite, with an occasional blend for texture rather than a jarring one every time.
const TASTEFUL_BLEND_MODES: BlendMode[] = ['normal', 'normal', 'normal', 'multiply', 'screen', 'overlay', 'soft-light']

function unlockedGroups(locks: Locks): Set<ParamGroup> {
  const groups = new Set<ParamGroup>(ALL_GROUPS)
  ;(Object.keys(LOCK_GROUPS) as (keyof Locks)[]).forEach((key) => {
    if (locks[key]) LOCK_GROUPS[key].forEach((g) => groups.delete(g))
  })
  return groups
}

let layerIdCounter = 0
function makeLayerId(): string {
  layerIdCounter += 1
  return `layer-${Date.now()}-${layerIdCounter}-${Math.random().toString(36).slice(2, 7)}`
}

function randomGeneratorLayer(opacity: number, blendMode: BlendMode): GeneratorLayerConfig {
  const generator = createRng(randomSeed()).pick(generatorRegistry.all())
  return {
    id: makeLayerId(),
    generatorId: generator.id,
    parameters: { ...generator.defaultParameters },
    seed: randomSeed(),
    opacity,
    blendMode,
    visible: true,
  }
}

interface DesignStoreState extends DesignSnapshot {
  locks: Locks
  history: DesignSnapshot[]
  historyIndex: number
  advancedMode: boolean
  /** When true, the "Surprise me" composition randomizer also scrambles every layer's blend mode/opacity. */
  chaosBlending: boolean
  /**
   * Which layer the parameter-editing controls (MagicBar "Make it...", Shape/Pattern/Variation/
   * Composition/Color sliders, Seed) currently target — null means the base design, otherwise the id
   * of an entry in `generatorLayers`. Purely a UI selection, not part of DesignSnapshot: it's not
   * undoable/saveable/shareable, and undo/redo/loadSnapshot leave it untouched (a stale id just falls
   * back to the base, see ControlPanel's `activeLayer` lookup).
   */
  activeLayerId: string | null

  setGenerator: (generatorId: string) => void
  setParameter: (key: string, value: number | string | boolean) => void
  setParameterLive: (key: string, value: number | string | boolean) => void
  setParameters: (params: GeneratorParameters) => void
  setSeed: (seed: number) => void
  setPalette: (palette: Palette) => void
  toggleLock: (key: keyof Locks) => void
  toggleAdvancedMode: () => void
  toggleChaosBlending: () => void
  setActiveLayer: (id: string | null) => void

  randomizeNew: () => void
  randomizeEvolve: () => void
  randomizeRemix: () => void
  randomizeRecolor: () => void
  randomizeDistort: () => void
  randomizeComposition: () => void
  applyAction: (action: SemanticAction) => void
  applyPreset: (preset: DesignPreset) => void

  addGeneratorLayer: () => void
  removeGeneratorLayer: (id: string) => void
  setGeneratorLayerGenerator: (id: string, generatorId: string) => void
  randomizeGeneratorLayer: (id: string) => void
  setGeneratorLayerParameter: (id: string, key: string, value: number | string | boolean) => void
  setGeneratorLayerParameterLive: (id: string, key: string, value: number | string | boolean) => void
  setGeneratorLayerSeed: (id: string, seed: number) => void
  setGeneratorLayerOpacity: (id: string, opacity: number) => void
  setGeneratorLayerOpacityLive: (id: string, opacity: number) => void
  setGeneratorLayerBlendMode: (id: string, blendMode: BlendMode) => void
  toggleGeneratorLayerVisible: (id: string) => void
  moveGeneratorLayer: (id: string, direction: 'up' | 'down') => void

  toggleLayerVisible: (id: string) => void
  toggleLayerLocked: (id: string) => void
  setLayerOpacity: (id: string, opacity: number) => void
  setLayerOpacityLive: (id: string, opacity: number) => void
  duplicateLayer: (layer: SVGLayer) => void
  deleteExtraLayer: (id: string) => void
  setLayerOrder: (order: string[]) => void

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
    layers: defaultLayerState(),
    generatorLayers: [],
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
    chaosBlending: false,
    activeLayerId: null,

    setGenerator: (generatorId) => {
      const generator = generatorRegistry.get(generatorId)
      if (!generator) return
      set((state) => {
        const snapshot: DesignSnapshot = {
          generatorId,
          parameters: { ...generator.defaultParameters },
          seed: randomSeed(),
          palette: state.palette,
          layers: state.layers,
          generatorLayers: state.generatorLayers,
        }
        return { ...snapshot, ...pushHistory(state, snapshot) }
      })
    },

    setParameter: (key, value) => {
      set((state) => {
        const parameters = { ...state.parameters, [key]: value }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers: state.generatorLayers }
        return { parameters, ...pushHistory(state, snapshot) }
      })
    },

    // Updates the live value during a drag without pushing history — a slider drag should be one
    // undo step, not one per tick. The UI calls setParameter once more at drag end to commit it.
    setParameterLive: (key, value) => {
      set((state) => ({ parameters: { ...state.parameters, [key]: value } }))
    },

    setParameters: (params) => {
      set((state) => {
        const parameters = { ...state.parameters, ...params }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers: state.generatorLayers }
        return { parameters, ...pushHistory(state, snapshot) }
      })
    },

    setSeed: (seed) => {
      set((state) => {
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed, palette: state.palette, layers: state.layers, generatorLayers: state.generatorLayers }
        return { seed, ...pushHistory(state, snapshot) }
      })
    },

    setPalette: (palette) => {
      set((state) => {
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette, layers: state.layers, generatorLayers: state.generatorLayers }
        return { palette, ...pushHistory(state, snapshot) }
      })
    },

    toggleLock: (key) => set((state) => ({ locks: { ...state.locks, [key]: !state.locks[key] } })),
    toggleAdvancedMode: () => set((state) => ({ advancedMode: !state.advancedMode })),
    toggleChaosBlending: () => set((state) => ({ chaosBlending: !state.chaosBlending })),
    setActiveLayer: (id) => set({ activeLayerId: id }),

    // "Shuffle" (formerly "Surprise me") — rerolls everything not protected by a lock, one layer at a
    // time: the base design and every stacked generator layer each get their own independent reroll
    // pass (own generator pick, own params, own seed), rather than sharing a single random draw. The
    // layer stack itself (how many layers, their opacity/blend mode) is left untouched — see
    // randomizeComposition for the mode that reshuffles the stack itself. See §19 of the product spec.
    randomizeNew: () => {
      set((state) => {
        const rng = createRng(randomSeed())
        const groups = unlockedGroups(state.locks)
        const generatorId = state.locks.geometry ? state.generatorId : rng.pick(generatorRegistry.all()).id
        const generator = generatorRegistry.get(generatorId)!
        const baseParams = generatorId === state.generatorId ? state.parameters : generator.defaultParameters
        const parameters = randomizeParameters(generator.parameterSchema, baseParams, groups, rng)
        const seed = state.locks.geometry ? state.seed : randomSeed()
        const palette = state.locks.palette ? state.palette : rng.pick(getAllPalettes())
        const generatorLayers = state.generatorLayers.map((layer) => {
          const layerRng = createRng(randomSeed())
          const layerGeneratorId = state.locks.geometry ? layer.generatorId : layerRng.pick(generatorRegistry.all()).id
          const layerGenerator = generatorRegistry.get(layerGeneratorId)!
          const layerBaseParams = layerGeneratorId === layer.generatorId ? layer.parameters : layerGenerator.defaultParameters
          const layerParameters = randomizeParameters(layerGenerator.parameterSchema, layerBaseParams, groups, layerRng)
          const layerSeed = state.locks.geometry ? layer.seed : randomSeed()
          return { ...layer, generatorId: layerGeneratorId, parameters: layerParameters, seed: layerSeed }
        })
        const snapshot: DesignSnapshot = { generatorId, parameters, seed, palette, layers: state.layers, generatorLayers }
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
          layers: state.layers,
          generatorLayers: state.generatorLayers,
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
          layers: state.layers,
          generatorLayers: state.generatorLayers,
        }
        return { ...snapshot, ...pushHistory(state, snapshot) }
      })
    },

    // Preserves geometry, generates a fresh harmony palette — a direct action, not gated by locks.
    randomizeRecolor: () => {
      set((state) => {
        const rng = createRng(randomSeed())
        const palette = generateHarmonyPalette(rng)
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette, layers: state.layers, generatorLayers: state.generatorLayers }
        return { palette, ...pushHistory(state, snapshot) }
      })
    },

    // Preserves identity (generator/seed/palette), rerolls only the variation/texture parameters.
    randomizeDistort: () => {
      set((state) => {
        const rng = createRng(randomSeed())
        const generator = generatorRegistry.get(state.generatorId)!
        const parameters = randomizeParameters(generator.parameterSchema, state.parameters, new Set<ParamGroup>(['variation']), rng)
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers: state.generatorLayers }
        return { parameters, ...pushHistory(state, snapshot) }
      })
    },

    // The "new Surprise me" mode: rebuilds the whole composition from scratch — how many stacked
    // generator layers there are, which generators fill them, and (when chaosBlending is on) their
    // blend modes/opacities too. Ignores locks entirely, like Remix — it's a direct, deliberately wild
    // action rather than a locked reroll of the current design.
    randomizeComposition: () => {
      set((state) => {
        const rng = createRng(randomSeed())
        const baseGenerator = rng.pick(generatorRegistry.all())
        const palette = state.locks.palette ? state.palette : rng.pick(getAllPalettes())
        const extraCount = rng.int(0, 3)
        const pool = state.chaosBlending ? BLEND_MODES : TASTEFUL_BLEND_MODES
        const generatorLayers: GeneratorLayerConfig[] = Array.from({ length: extraCount }, () =>
          randomGeneratorLayer(state.chaosBlending ? rng.range(0.15, 1) : rng.range(0.5, 0.9), rng.pick(pool)),
        )
        const snapshot: DesignSnapshot = {
          generatorId: baseGenerator.id,
          parameters: { ...baseGenerator.defaultParameters },
          seed: randomSeed(),
          palette,
          layers: state.layers,
          generatorLayers,
        }
        return { ...snapshot, ...pushHistory(state, snapshot) }
      })
    },

    // Targets whichever layer is currently active (see `activeLayerId`) — the base design by default,
    // or a specific stacked generator layer once the user has selected one in GeneratorLayersPanel.
    applyAction: (action) => {
      set((state) => {
        const activeLayer = state.activeLayerId ? state.generatorLayers.find((l) => l.id === state.activeLayerId) : undefined
        if (activeLayer) {
          const generator = generatorRegistry.get(activeLayer.generatorId)!
          const parameters = applySemanticAction(generator, activeLayer.parameters, action)
          const generatorLayers = state.generatorLayers.map((l) => (l.id === activeLayer.id ? { ...l, parameters } : l))
          const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
          return { generatorLayers, ...pushHistory(state, snapshot) }
        }
        const generator = generatorRegistry.get(state.generatorId)!
        const parameters = applySemanticAction(generator, state.parameters, action)
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers: state.generatorLayers }
        return { parameters, ...pushHistory(state, snapshot) }
      })
    },

    // Presets are a specific curated single-generator look, so applying one clears any stacked
    // generator layers rather than leaving them composited on top of it.
    applyPreset: (preset) => {
      const generator = generatorRegistry.get(preset.generatorId)
      if (!generator) return
      set((state) => {
        const snapshot: DesignSnapshot = {
          generatorId: preset.generatorId,
          parameters: { ...generator.defaultParameters, ...preset.parameters } as GeneratorParameters,
          seed: preset.seed ?? randomSeed(),
          palette: preset.palette,
          layers: state.layers,
          generatorLayers: [],
        }
        return { ...snapshot, ...pushHistory(state, snapshot) }
      })
    },

    addGeneratorLayer: () => {
      set((state) => {
        const generatorLayers = [...state.generatorLayers, randomGeneratorLayer(0.75, 'normal')]
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, ...pushHistory(state, snapshot) }
      })
    },

    removeGeneratorLayer: (id) => {
      set((state) => {
        const generatorLayers = state.generatorLayers.filter((l) => l.id !== id)
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, activeLayerId: state.activeLayerId === id ? null : state.activeLayerId, ...pushHistory(state, snapshot) }
      })
    },

    setGeneratorLayerGenerator: (id, generatorId) => {
      const generator = generatorRegistry.get(generatorId)
      if (!generator) return
      set((state) => {
        const generatorLayers = state.generatorLayers.map((l) =>
          l.id === id ? { ...l, generatorId, parameters: { ...generator.defaultParameters }, seed: randomSeed() } : l,
        )
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, ...pushHistory(state, snapshot) }
      })
    },

    randomizeGeneratorLayer: (id) => {
      set((state) => {
        const generator = createRng(randomSeed()).pick(generatorRegistry.all())
        const generatorLayers = state.generatorLayers.map((l) =>
          l.id === id ? { ...l, generatorId: generator.id, parameters: { ...generator.defaultParameters }, seed: randomSeed() } : l,
        )
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, ...pushHistory(state, snapshot) }
      })
    },

    setGeneratorLayerParameter: (id, key, value) => {
      set((state) => {
        const generatorLayers = state.generatorLayers.map((l) => (l.id === id ? { ...l, parameters: { ...l.parameters, [key]: value } } : l))
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, ...pushHistory(state, snapshot) }
      })
    },

    // Live drag preview for a generator layer's own parameter sliders — no history entry (see setParameterLive).
    setGeneratorLayerParameterLive: (id, key, value) => {
      set((state) => ({
        generatorLayers: state.generatorLayers.map((l) => (l.id === id ? { ...l, parameters: { ...l.parameters, [key]: value } } : l)),
      }))
    },

    setGeneratorLayerSeed: (id, seed) => {
      set((state) => {
        const generatorLayers = state.generatorLayers.map((l) => (l.id === id ? { ...l, seed } : l))
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, ...pushHistory(state, snapshot) }
      })
    },

    setGeneratorLayerOpacity: (id, opacity) => {
      set((state) => {
        const generatorLayers = state.generatorLayers.map((l) => (l.id === id ? { ...l, opacity } : l))
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, ...pushHistory(state, snapshot) }
      })
    },

    // Live drag preview for a generator layer's opacity slider — no history entry (see setParameterLive).
    setGeneratorLayerOpacityLive: (id, opacity) => {
      set((state) => ({ generatorLayers: state.generatorLayers.map((l) => (l.id === id ? { ...l, opacity } : l)) }))
    },

    setGeneratorLayerBlendMode: (id, blendMode) => {
      set((state) => {
        const generatorLayers = state.generatorLayers.map((l) => (l.id === id ? { ...l, blendMode } : l))
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, ...pushHistory(state, snapshot) }
      })
    },

    toggleGeneratorLayerVisible: (id) => {
      set((state) => {
        const generatorLayers = state.generatorLayers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, ...pushHistory(state, snapshot) }
      })
    },

    moveGeneratorLayer: (id, direction) => {
      set((state) => {
        const idx = state.generatorLayers.findIndex((l) => l.id === id)
        const swapWith = direction === 'up' ? idx + 1 : idx - 1
        if (idx === -1 || swapWith < 0 || swapWith >= state.generatorLayers.length) return {}
        const generatorLayers = [...state.generatorLayers]
        ;[generatorLayers[idx], generatorLayers[swapWith]] = [generatorLayers[swapWith], generatorLayers[idx]]
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers: state.layers, generatorLayers }
        return { generatorLayers, ...pushHistory(state, snapshot) }
      })
    },

    toggleLayerVisible: (id) => {
      set((state) => {
        const current = state.layers.overrides[id] ?? {}
        const wasVisible = current.visible ?? true
        const layers: LayerState = { ...state.layers, overrides: { ...state.layers.overrides, [id]: { ...current, visible: !wasVisible } } }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers, generatorLayers: state.generatorLayers }
        return { layers, ...pushHistory(state, snapshot) }
      })
    },

    toggleLayerLocked: (id) => {
      set((state) => {
        const current = state.layers.overrides[id] ?? {}
        const wasLocked = current.locked ?? false
        const layers: LayerState = { ...state.layers, overrides: { ...state.layers.overrides, [id]: { ...current, locked: !wasLocked } } }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers, generatorLayers: state.generatorLayers }
        return { layers, ...pushHistory(state, snapshot) }
      })
    },

    setLayerOpacity: (id, opacity) => {
      set((state) => {
        const current = state.layers.overrides[id] ?? {}
        const layers: LayerState = { ...state.layers, overrides: { ...state.layers.overrides, [id]: { ...current, opacity } } }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers, generatorLayers: state.generatorLayers }
        return { layers, ...pushHistory(state, snapshot) }
      })
    },

    // Live drag preview for the layer opacity slider — no history entry (see setParameterLive).
    setLayerOpacityLive: (id, opacity) => {
      set((state) => {
        const current = state.layers.overrides[id] ?? {}
        return { layers: { ...state.layers, overrides: { ...state.layers.overrides, [id]: { ...current, opacity } } } }
      })
    },

    duplicateLayer: (layer) => {
      set((state) => {
        const id = `dup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const copy: SVGLayer = { ...layer, id, name: `${layer.name} copy` }
        const layers: LayerState = { ...state.layers, extraLayers: [...state.layers.extraLayers, copy] }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers, generatorLayers: state.generatorLayers }
        return { layers, ...pushHistory(state, snapshot) }
      })
    },

    deleteExtraLayer: (id) => {
      set((state) => {
        const layers: LayerState = { ...state.layers, extraLayers: state.layers.extraLayers.filter((l) => l.id !== id) }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers, generatorLayers: state.generatorLayers }
        return { layers, ...pushHistory(state, snapshot) }
      })
    },

    setLayerOrder: (order) => {
      set((state) => {
        const layers: LayerState = { ...state.layers, order }
        const snapshot: DesignSnapshot = { generatorId: state.generatorId, parameters: state.parameters, seed: state.seed, palette: state.palette, layers, generatorLayers: state.generatorLayers }
        return { layers, ...pushHistory(state, snapshot) }
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
