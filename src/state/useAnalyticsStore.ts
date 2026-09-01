import { create } from 'zustand'

/**
 * Local-only measurement layer for Phase 7 (product spec §35-41): "Measure: ad viewability, layout
 * shift, session duration, export conversion, generator usage." No backend exists yet — events are
 * kept in a capped in-memory log (inspectable via `window.__analytics()` in dev) so a real analytics
 * sink can subscribe to the same `track()` call later without touching any call site.
 */
export type AnalyticsEventName =
  | 'session_start'
  | 'session_end'
  | 'generator_selected'
  | 'export'
  | 'ad_viewable'
  | 'ad_load_failed'
  | 'layout_shift'

export interface AnalyticsEvent {
  id: number
  name: AnalyticsEventName
  data?: Record<string, unknown>
  timestamp: number
}

const EVENT_LOG_LIMIT = 200

interface AnalyticsState {
  events: AnalyticsEvent[]
  track: (name: AnalyticsEventName, data?: Record<string, unknown>) => void
}

let counter = 0

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  events: [],
  track: (name, data) => {
    const event: AnalyticsEvent = { id: ++counter, name, data, timestamp: Date.now() }
    set((state) => ({ events: [...state.events, event].slice(-EVENT_LOG_LIMIT) }))
    if (import.meta.env.DEV) console.debug('[analytics]', name, data ?? {})
  },
}))

/** Non-reactive access for call sites outside React components (observers, module-level code). */
export function trackEvent(name: AnalyticsEventName, data?: Record<string, unknown>) {
  useAnalyticsStore.getState().track(name, data)
}
