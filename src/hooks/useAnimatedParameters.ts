import { useMemo } from 'react'
import type { GeneratorParameters } from '@/engine/types'
import { evaluateTrack } from '@/engine/easing'
import { useAnimationStore } from '@/state/useAnimationStore'

/**
 * Overrides animated parameter keys with their interpolated value at the current playhead time.
 * Purely a render-time preview layer — never writes back into useDesignStore, so scrubbing/playback
 * never touches undo history or the "real" stored parameter values.
 */
export function useAnimatedParameters(generatorId: string, parameters: GeneratorParameters): GeneratorParameters {
  const tracksForGenerator = useAnimationStore((s) => s.tracks[generatorId])
  const currentTime = useAnimationStore((s) => s.currentTime)

  return useMemo(() => {
    if (!tracksForGenerator) return parameters
    const keys = Object.keys(tracksForGenerator)
    if (keys.length === 0) return parameters
    const overridden = { ...parameters }
    for (const key of keys) {
      const keyframes = tracksForGenerator[key]
      if (keyframes.length === 0) continue
      overridden[key] = evaluateTrack(keyframes, currentTime)
    }
    return overridden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracksForGenerator, currentTime, JSON.stringify(parameters)])
}
