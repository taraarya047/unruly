import { useMemo } from 'react'
import { generatorRegistry } from '@/engine/registry'
import type { NumberParamSchema } from '@/engine/types'
import type { Keyframe } from '@/engine/easing'
import { useDesignStore } from '@/state/useDesignStore'
import { useAnimationStore } from '@/state/useAnimationStore'
import { usePlaybackLoop } from '@/hooks/usePlaybackLoop'
import { IconButton } from '@/components/ui/IconButton'
import { PlayIcon, PauseIcon, LoopIcon, CloseIcon, TrashIcon } from '@/components/ui/icons'
import { TimelineRuler } from './TimelineRuler'
import { TrackLane } from './TrackLane'
import { CurveEditor } from './CurveEditor'

const PIXELS_PER_SECOND = 90
const EMPTY_TRACKS: Record<string, Keyframe[]> = {}

export function TimelinePanel() {
  const generatorId = useDesignStore((s) => s.generatorId)
  const parameters = useDesignStore((s) => s.parameters)

  const setPanelOpen = useAnimationStore((s) => s.setPanelOpen)
  const duration = useAnimationStore((s) => s.duration)
  const setDuration = useAnimationStore((s) => s.setDuration)
  const currentTime = useAnimationStore((s) => s.currentTime)
  const setCurrentTime = useAnimationStore((s) => s.setCurrentTime)
  const isPlaying = useAnimationStore((s) => s.isPlaying)
  const togglePlay = useAnimationStore((s) => s.togglePlay)
  const loop = useAnimationStore((s) => s.loop)
  const toggleLoop = useAnimationStore((s) => s.toggleLoop)
  const tracksForGenerator = useAnimationStore((s) => s.tracks[generatorId]) ?? EMPTY_TRACKS
  const selected = useAnimationStore((s) => s.selectedKeyframe)
  const selectKeyframe = useAnimationStore((s) => s.selectKeyframe)
  const addTrack = useAnimationStore((s) => s.addTrack)
  const removeTrack = useAnimationStore((s) => s.removeTrack)
  const addKeyframe = useAnimationStore((s) => s.addKeyframe)
  const removeKeyframe = useAnimationStore((s) => s.removeKeyframe)
  const updateKeyframe = useAnimationStore((s) => s.updateKeyframe)
  const setKeyframeEasing = useAnimationStore((s) => s.setKeyframeEasing)

  usePlaybackLoop(isPlaying)

  const generator = generatorRegistry.get(generatorId)!
  const numericSchema = useMemo(
    () => generator.parameterSchema.filter((s): s is NumberParamSchema => s.type === 'number' || s.type === 'angle'),
    [generator],
  )
  const trackedKeys = Object.keys(tracksForGenerator)
  const availableToAdd = numericSchema.filter((s) => !trackedKeys.includes(s.key))

  const selection = selected && selected.generatorId === generatorId ? selected : null
  const selectedKeyframeObj = selection ? tracksForGenerator[selection.paramKey]?.find((k) => k.id === selection.keyframeId) : undefined

  return (
    <div className="hidden h-64 shrink-0 flex-col border-t border-border bg-surface md:flex">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <IconButton label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay}>
          {isPlaying ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
        </IconButton>
        <IconButton label={loop ? 'Looping — click to play once' : 'Play once — click to loop'} active={loop} onClick={toggleLoop}>
          <LoopIcon width={15} height={15} />
        </IconButton>
        <span className="w-24 shrink-0 text-xs tabular-nums text-text-muted">
          {currentTime.toFixed(2)}s / {duration.toFixed(1)}s
        </span>
        <label className="flex items-center gap-1.5 text-xs text-text-muted">
          Duration
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 0.5)}
            className="w-14 rounded-md border border-border bg-control-bg px-1.5 py-0.5 text-text"
          />
          s
        </label>
        <div className="ml-auto flex items-center gap-2">
          {availableToAdd.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const key = e.target.value
                if (!key) return
                addTrack(generatorId, key, Number(parameters[key] ?? 0))
              }}
              className="rounded-full border border-border bg-control-bg px-3 py-1 text-xs text-text"
            >
              <option value="">+ Animate parameter…</option>
              {availableToAdd.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
          <IconButton label="Close timeline" onClick={() => setPanelOpen(false)}>
            <CloseIcon width={15} height={15} />
          </IconButton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-auto">
          <TimelineRuler duration={duration} currentTime={currentTime} pixelsPerSecond={PIXELS_PER_SECOND} onScrub={setCurrentTime} />
          {trackedKeys.length === 0 ? (
            <div className="flex h-24 items-center justify-center px-6 text-center text-xs text-text-muted">
              Pick a parameter above to animate it, then click a lane to add a keyframe.
            </div>
          ) : (
            trackedKeys.map((key) => {
              const schema = numericSchema.find((s) => s.key === key)
              if (!schema) return null
              return (
                <TrackLane
                  key={key}
                  schema={schema}
                  keyframes={tracksForGenerator[key]}
                  duration={duration}
                  pixelsPerSecond={PIXELS_PER_SECOND}
                  selectedKeyframeId={selection?.paramKey === key ? selection.keyframeId : null}
                  onSelectKeyframe={(id) => selectKeyframe({ generatorId, paramKey: key, keyframeId: id })}
                  onAddKeyframe={(time, value) => addKeyframe(generatorId, key, time, value)}
                  onMoveKeyframe={(id, time) => updateKeyframe(generatorId, key, id, { time })}
                  onRemoveTrack={() => removeTrack(generatorId, key)}
                />
              )
            })
          )}
        </div>

        {selection && selectedKeyframeObj && (
          <div className="flex shrink-0 flex-col">
            <div className="flex items-center gap-2 border-b border-l border-border px-2.5 py-1.5 text-xs">
              <label className="flex items-center gap-1 text-text-muted">
                Time
                <input
                  type="number"
                  min={0}
                  max={duration}
                  step={0.05}
                  value={Number(selectedKeyframeObj.time.toFixed(2))}
                  onChange={(e) => updateKeyframe(selection.generatorId, selection.paramKey, selection.keyframeId, { time: Number(e.target.value) })}
                  className="w-14 rounded-md border border-border bg-control-bg px-1 py-0.5 text-text"
                />
              </label>
              <label className="flex items-center gap-1 text-text-muted">
                Value
                <input
                  type="number"
                  value={Number(selectedKeyframeObj.value.toFixed(3))}
                  onChange={(e) => updateKeyframe(selection.generatorId, selection.paramKey, selection.keyframeId, { value: Number(e.target.value) })}
                  className="w-16 rounded-md border border-border bg-control-bg px-1 py-0.5 text-text"
                />
              </label>
              <button
                onClick={() => removeKeyframe(selection.generatorId, selection.paramKey, selection.keyframeId)}
                aria-label="Delete keyframe"
                className="ml-auto text-text-muted hover:text-text"
              >
                <TrashIcon width={13} height={13} />
              </button>
            </div>
            <CurveEditor
              easing={selectedKeyframeObj.easing}
              onChange={(easing) => setKeyframeEasing(selection.generatorId, selection.paramKey, selection.keyframeId, easing)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
