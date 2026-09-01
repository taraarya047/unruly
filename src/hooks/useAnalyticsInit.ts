import { useEffect } from 'react'
import { trackEvent, useAnalyticsStore } from '@/state/useAnalyticsStore'

interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

/** Cumulative Layout Shift, tracked page-wide (real browser API, not simulated) — see AD_SYSTEM.md. */
function observeLayoutShift(onReport: (score: number) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') return () => {}
  let cumulative = 0
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) cumulative += entry.value
      }
    })
    observer.observe({ type: 'layout-shift', buffered: true })
    const report = () => onReport(cumulative)
    document.addEventListener('visibilitychange', report)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', report)
    }
    // Older browsers throw a TypeError on an unsupported entry type rather than just omitting it.
  } catch {
    return () => {}
  }
}

/** Mounted once at the app root: session start/end + page-wide CLS, both real measurements. */
export function useAnalyticsInit() {
  useEffect(() => {
    const start = Date.now()
    trackEvent('session_start')

    let reportedCls = 0
    const stopLayoutShift = observeLayoutShift((score) => {
      reportedCls = score
    })

    const endSession = () => {
      trackEvent('session_end', { durationMs: Date.now() - start, cumulativeLayoutShift: Number(reportedCls.toFixed(4)) })
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') endSession()
    }
    window.addEventListener('beforeunload', endSession)
    document.addEventListener('visibilitychange', onVisibilityChange)

    if (import.meta.env.DEV) {
      ;(window as unknown as { __analytics: () => unknown }).__analytics = () => useAnalyticsStore.getState().events
    }

    return () => {
      stopLayoutShift()
      window.removeEventListener('beforeunload', endSession)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])
}
