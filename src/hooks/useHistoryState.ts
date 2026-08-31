import { useCallback, useState } from 'react'

interface HistoryState<T> {
  items: T[]
  index: number
}

/** Local (non-undo-stack) value history: push new values, then step back/forward through them. */
export function useHistoryState<T>(initial: T) {
  const [state, setState] = useState<HistoryState<T>>({ items: [initial], index: 0 })

  const push = useCallback((next: T) => {
    setState((s) => {
      const items = [...s.items.slice(0, s.index + 1), next]
      return { items, index: items.length - 1 }
    })
  }, [])

  const back = useCallback(() => {
    setState((s) => ({ ...s, index: Math.max(0, s.index - 1) }))
  }, [])

  const forward = useCallback(() => {
    setState((s) => ({ ...s, index: Math.min(s.items.length - 1, s.index + 1) }))
  }, [])

  return {
    value: state.items[state.index],
    push,
    back,
    forward,
    canBack: state.index > 0,
    canForward: state.index < state.items.length - 1,
  }
}
