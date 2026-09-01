import { useEffect, useRef, type RefObject } from 'react'
import { trackEvent } from '@/state/useAnalyticsStore'

// IAB "viewable impression" standard: >=50% of the slot's area visible for >=1 continuous second.
const VIEWABLE_RATIO = 0.5
const VIEWABLE_DURATION_MS = 1000

/** Fires one 'ad_viewable' event the first time `ref`'s element meets the standard viewability bar. */
export function useAdViewability(ref: RefObject<HTMLElement | null>, placement: string, variant: string, enabled: boolean) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (!enabled || trackedRef.current) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= VIEWABLE_RATIO) {
          if (timer) return
          timer = setTimeout(() => {
            trackedRef.current = true
            trackEvent('ad_viewable', { placement, variant })
            observer.disconnect()
          }, VIEWABLE_DURATION_MS)
        } else if (timer) {
          clearTimeout(timer)
          timer = null
        }
      },
      { threshold: [0, VIEWABLE_RATIO] },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [ref, placement, variant, enabled])
}
