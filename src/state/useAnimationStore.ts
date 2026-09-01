import { create } from 'zustand'
import { EASING_PRESETS, type BezierPoints, type Keyframe } from '@/engine/easing'

export interface KeyframeSelection {
  generatorId: string
  paramKey: string
  keyframeId: string
}

let idCounter = 0
function makeKeyframeId(): string {
  idCounter += 1
  return `kf-${Date.now()}-${idCounter}`
}

interface AnimationStoreState {
  panelOpen: boolean
  duration: number
  currentTime: number
  isPlaying: boolean
  loop: boolean
  /** tracks[generatorId][paramKey] = keyframes, always kept sorted by time. Animation is scoped to the
   *  base generator's own parameters — stacked generator layers aren't animatable in this iteration. */
  tracks: Record<string, Record<string, Keyframe[]>>
  selectedKeyframe: KeyframeSelection | null

  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
  setDuration: (seconds: number) => void
  setCurrentTime: (time: number) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  toggleLoop: () => void

  addTrack: (generatorId: string, paramKey: string, initialValue: number) => void
  removeTrack: (generatorId: string, paramKey: string) => void
  addKeyframe: (generatorId: string, paramKey: string, time: number, value: number) => void
  removeKeyframe: (generatorId: string, paramKey: string, keyframeId: string) => void
  updateKeyframe: (generatorId: string, paramKey: string, keyframeId: string, patch: Partial<Pick<Keyframe, 'time' | 'value'>>) => void
  setKeyframeEasing: (generatorId: string, paramKey: string, keyframeId: string, easing: BezierPoints) => void
  selectKeyframe: (selection: KeyframeSelection | null) => void
}

// Keyframes within this many seconds of a click are treated as "the same spot" (updated, not duplicated).
const SNAP_EPSILON = 0.03

function sortByTime(keyframes: Keyframe[]): Keyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time)
}

export const useAnimationStore = create<AnimationStoreState>((set, get) => ({
  panelOpen: false,
  duration: 4,
  currentTime: 0,
  isPlaying: false,
  loop: true,
  tracks: {},
  selectedKeyframe: null,

  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  setPanelOpen: (open) => set({ panelOpen: open }),
  setDuration: (seconds) => set((state) => ({ duration: Math.max(0.5, seconds), currentTime: Math.min(state.currentTime, Math.max(0.5, seconds)) })),
  setCurrentTime: (time) => set((state) => ({ currentTime: Math.min(Math.max(0, time), state.duration) })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleLoop: () => set((state) => ({ loop: !state.loop })),

  addTrack: (generatorId, paramKey, initialValue) => {
    set((state) => {
      const forGenerator = state.tracks[generatorId] ?? {}
      if (forGenerator[paramKey]) return state
      const keyframe: Keyframe = { id: makeKeyframeId(), time: 0, value: initialValue, easing: EASING_PRESETS.linear }
      return { tracks: { ...state.tracks, [generatorId]: { ...forGenerator, [paramKey]: [keyframe] } } }
    })
  },

  removeTrack: (generatorId, paramKey) => {
    set((state) => {
      const forGenerator = { ...(state.tracks[generatorId] ?? {}) }
      delete forGenerator[paramKey]
      return { tracks: { ...state.tracks, [generatorId]: forGenerator }, selectedKeyframe: null }
    })
  },

  addKeyframe: (generatorId, paramKey, time, value) => {
    set((state) => {
      const existing = state.tracks[generatorId]?.[paramKey] ?? []
      const nearby = existing.find((k) => Math.abs(k.time - time) < SNAP_EPSILON)
      const next = nearby
        ? existing.map((k) => (k.id === nearby.id ? { ...k, value } : k))
        : sortByTime([...existing, { id: makeKeyframeId(), time, value, easing: EASING_PRESETS.linear }])
      const forGenerator = { ...(state.tracks[generatorId] ?? {}), [paramKey]: next }
      return { tracks: { ...state.tracks, [generatorId]: forGenerator } }
    })
  },

  removeKeyframe: (generatorId, paramKey, keyframeId) => {
    set((state) => {
      const existing = state.tracks[generatorId]?.[paramKey] ?? []
      const next = existing.filter((k) => k.id !== keyframeId)
      const forGenerator = { ...(state.tracks[generatorId] ?? {}) }
      if (next.length === 0) delete forGenerator[paramKey]
      else forGenerator[paramKey] = next
      const selected = get().selectedKeyframe
      const clearSelection = selected?.keyframeId === keyframeId
      return { tracks: { ...state.tracks, [generatorId]: forGenerator }, ...(clearSelection ? { selectedKeyframe: null } : {}) }
    })
  },

  updateKeyframe: (generatorId, paramKey, keyframeId, patch) => {
    set((state) => {
      const existing = state.tracks[generatorId]?.[paramKey] ?? []
      const next = sortByTime(
        existing.map((k) => (k.id === keyframeId ? { ...k, ...patch, time: patch.time !== undefined ? Math.min(Math.max(0, patch.time), state.duration) : k.time } : k)),
      )
      const forGenerator = { ...(state.tracks[generatorId] ?? {}), [paramKey]: next }
      return { tracks: { ...state.tracks, [generatorId]: forGenerator } }
    })
  },

  setKeyframeEasing: (generatorId, paramKey, keyframeId, easing) => {
    set((state) => {
      const existing = state.tracks[generatorId]?.[paramKey] ?? []
      const next = existing.map((k) => (k.id === keyframeId ? { ...k, easing } : k))
      const forGenerator = { ...(state.tracks[generatorId] ?? {}), [paramKey]: next }
      return { tracks: { ...state.tracks, [generatorId]: forGenerator } }
    })
  },

  selectKeyframe: (selection) => set({ selectedKeyframe: selection }),
}))
