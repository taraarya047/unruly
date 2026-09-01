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
      const duration = state.duration || 1
      let next = state.currentTime + dt * state.direction

      if (state.playMode === 'pingpong') {
        // Reflect off either end and flip direction — may overshoot past 0/duration in one tick at
        // low frame rates, so reflect (not clamp) to keep the bounce visually accurate.
        if (next >= duration) {
          next = duration - (next - duration)
          useAnimationStore.getState().setDirection(-1)
        } else if (next <= 0) {
          next = -next
          useAnimationStore.getState().setDirection(1)
        }
        next = Math.min(Math.max(next, 0), duration)
      } else if (state.playMode === 'loop') {
        if (next >= duration) next %= duration
      } else {
        if (next >= duration) {
          next = duration
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
