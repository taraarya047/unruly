import { useEffect } from 'react'

/**
 * Injects a schema.org JSON-LD <script> into <head> for the lifetime of the calling page — Google's
 * indexer executes JS, so this works even though it's a client-only SPA with no SSR (unlike raw og:
 * tags, which need to be in the initial HTML for link-preview bots that don't run JS — see index.html
 * for those). Shared by any page that wants rich results (FAQPage, Article, ...).
 */
export function useJsonLd(data: object) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)])
}
