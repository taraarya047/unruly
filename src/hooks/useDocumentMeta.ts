import { useEffect } from 'react'

/**
 * Updates the live document title / meta description for the current route, restoring the previous
 * values on unmount. This is a client-side SPA with no server/SSR, so it can't change what a crawler
 * sees in the raw HTML response (link-preview bots don't execute JS) — index.html's static tags are the
 * ceiling for that. What this DOES fix: the browser tab/history entry, and anything that reads the live
 * DOM (bookmarking, the Web Share API, in-app "current page" context).
 */
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    const descriptionTag = description ? document.querySelector('meta[name="description"]') : null
    const previousDescription = descriptionTag?.getAttribute('content') ?? null
    if (descriptionTag && description) descriptionTag.setAttribute('content', description)

    return () => {
      document.title = previousTitle
      if (descriptionTag && previousDescription !== null) descriptionTag.setAttribute('content', previousDescription)
    }
  }, [title, description])
}
