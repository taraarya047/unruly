import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = 'G-9WLGCSHEES'

/**
 * Sends a GA4 page_view on every client-side route change. index.html's initial gtag('config', ...)
 * call has send_page_view disabled, so this hook is the single source of truth for every pageview —
 * including the first — rather than double-counting it between gtag's automatic send and this one.
 * `window.gtag` may not exist yet (ad blockers, or the GA script still loading), so calls are guarded.
 */
export function useGoogleAnalyticsPageview() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname + location.search,
      send_to: GA_MEASUREMENT_ID,
    })
  }, [location.pathname, location.search])
}
