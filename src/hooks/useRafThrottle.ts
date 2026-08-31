import { useEffect, useRef } from 'react'

/** Coalesces rapid calls (e.g. slider drag ticks) to at most once per animation frame. */
export function useRafThrottle() {
  const ref = useRef<number | null>(null)

  const schedule = (fn: () => void) => {
    if (ref.current) cancelAnimationFrame(ref.current)
    ref.current = requestAnimationFrame(fn)
  }

  const cancel = () => {
    if (ref.current) cancelAnimationFrame(ref.current)
  }

  useEffect(() => cancel, [])

  return { schedule, cancel }
}
