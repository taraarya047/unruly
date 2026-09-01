import { useEffect } from 'react'
import { useAnimationStore } from '@/state/useAnimationStore'

/** Drives the animation playhead forward with requestAnimationFrame while playing. */
export function usePlaybackLoop(isPlaying: boolean) {
  useEffect(() => {
    if (!isPlaying) return
    let raf: number
    let last = performance.now()

    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const state = useAnimationStore.getState()
      let next = state.currentTime + dt
      if (next >= state.duration) {
        if (state.loop) next %= state.duration || 1
        else {
          next = state.duration
          useAnimationStore.getState().pause()
        }
      }
      useAnimationStore.getState().setCurrentTime(next)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying])
}
