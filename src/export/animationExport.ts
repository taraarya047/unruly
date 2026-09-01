import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, canEncodeVideo, QUALITY_HIGH } from 'mediabunny'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { generatorRegistry } from '@/engine/registry'
import { composeLayers, type LayerState } from '@/engine/composeLayers'
import { mergeGeneratorLayers } from '@/engine/composeGeneratorLayers'
import { renderDesignToSvgString } from '@/engine/render'
import { evaluateTrack, type Keyframe } from '@/engine/easing'
import type { GeneratorParameters } from '@/engine/types'
import type { Palette } from '@/palette/types'
import type { GeneratorLayerConfig } from '@/state/useDesignStore'
import type { PlayMode } from '@/state/useAnimationStore'

export interface AnimationExportParams {
  generatorId: string
  parameters: GeneratorParameters
  seed: number
  palette: Palette
  layers: LayerState
  generatorLayers: GeneratorLayerConfig[]
  /** Keyframe tracks for the current generator only — {paramKey: keyframes}. */
  tracks: Record<string, Keyframe[]>
  duration: number
  fps: number
  playMode: PlayMode
  onProgress?: (fraction: number) => void
}

function animatedParametersAt(base: GeneratorParameters, tracks: Record<string, Keyframe[]>, time: number): GeneratorParameters {
  const keys = Object.keys(tracks)
  if (keys.length === 0) return base
  const out = { ...base }
  for (const key of keys) {
    const keyframes = tracks[key]
    if (keyframes.length) out[key] = evaluateTrack(keyframes, time)
  }
  return out
}

/**
 * The forward pass, plus — for ping-pong — the reverse pass with both shared endpoints dropped, so the
 * file loops seamlessly (no doubled frame at either end) when played/looped by whatever opens it.
 */
function buildFrameTimes(duration: number, fps: number, playMode: PlayMode): number[] {
  const frameCount = Math.max(1, Math.round(duration * fps))
  const forward = Array.from({ length: frameCount }, (_, i) => Math.min(i / fps, duration))
  if (playMode !== 'pingpong' || frameCount < 3) return forward
  const reverse = forward.slice(1, -1).reverse()
  return [...forward, ...reverse]
}

function renderFrameSvg(params: AnimationExportParams, time: number): string {
  const generator = generatorRegistry.get(params.generatorId)!
  const animated = animatedParametersAt(params.parameters, params.tracks, time)
  const raw = generator.generate(animated, params.seed, params.palette.colors)
  const composed = composeLayers(raw, params.palette, params.layers)
  const layered = mergeGeneratorLayers(composed, params.generatorLayers, params.palette)
  return renderDesignToSvgString(layered, { includeMetadata: false, sizeMode: 'fixed' })
}

function drawSvgToCanvas(svg: string, canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve()
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to rasterize animation frame'))
    }
    img.src = url
  })
}

/** Feature-detects real MP4/H.264 encoding support (WebCodecs) — absent in some browsers (e.g. Firefox). */
export async function canExportMp4(): Promise<boolean> {
  if (typeof window === 'undefined' || !('VideoEncoder' in window)) return false
  try {
    return await canEncodeVideo('avc')
  } catch {
    return false
  }
}

export async function exportAnimationAsGif(params: AnimationExportParams, size = 800): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const gif = GIFEncoder()
  const times = buildFrameTimes(params.duration, params.fps, params.playMode)
  const delayMs = Math.round(1000 / params.fps)
  // GIFs conventionally loop forever unless the design is explicitly meant to play once.
  const repeat = params.playMode === 'once' ? -1 : 0

  for (let i = 0; i < times.length; i++) {
    const svg = renderFrameSvg(params, times[i])
    await drawSvgToCanvas(svg, canvas)
    const { data } = ctx.getImageData(0, 0, size, size)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, size, size, { palette, delay: delayMs, repeat })
    params.onProgress?.((i + 1) / times.length)
  }

  gif.finish()
  // Re-wrap in a fresh Uint8Array: gifenc's own type (ArrayBufferLike-backed) is wider than what
  // Blob's constructor accepts (ArrayBuffer-backed only).
  return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' })
}

export async function exportAnimationAsMp4(params: AnimationExportParams, size = 800): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() })
  const videoSource = new CanvasSource(canvas, { codec: 'avc', quality: QUALITY_HIGH })
  output.addVideoTrack(videoSource, { frameRate: params.fps })
  await output.start()

  const times = buildFrameTimes(params.duration, params.fps, params.playMode)
  const frameDuration = 1 / params.fps

  for (let i = 0; i < times.length; i++) {
    const svg = renderFrameSvg(params, times[i])
    await drawSvgToCanvas(svg, canvas)
    await videoSource.add(i * frameDuration, frameDuration)
    params.onProgress?.((i + 1) / times.length)
  }

  await output.finalize()
  const buffer = output.target.buffer
  if (!buffer) throw new Error('MP4 export produced no output')
  return new Blob([buffer], { type: 'video/mp4' })
}
