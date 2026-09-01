import { useEffect, useRef, useState } from 'react'
import { useDesignStore } from '@/state/useDesignStore'
import { useAnimationStore } from '@/state/useAnimationStore'
import { useToastStore } from '@/state/useToastStore'
import { downloadBlob } from '@/export/download'
import type { AnimationExportParams } from '@/export/animationExport'
import type { Keyframe } from '@/engine/easing'
import { Button } from '@/components/ui/Button'
import { ChevronDownIcon, DownloadIcon } from '@/components/ui/icons'

const FPS = 24
const EXPORT_SIZE = 800

interface AnimationExportMenuProps {
  tracks: Record<string, Keyframe[]>
}

type ExportFormat = 'gif' | 'mp4'

// mediabunny + gifenc together add ~180kb (gzipped) to whatever bundle imports them — real weight
// every visitor would otherwise pay for a feature only exporters touch. Both are loaded via dynamic
// import() the first time this menu is actually used, so the cost lands only there.
export function AnimationExportMenu({ tracks }: AnimationExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)
  const [progress, setProgress] = useState(0)
  // null = not checked yet (checked lazily the first time the menu opens, so page load never pays for it)
  const [mp4Supported, setMp4Supported] = useState<boolean | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const show = useToastStore((s) => s.show)

  const generatorId = useDesignStore((s) => s.generatorId)
  const parameters = useDesignStore((s) => s.parameters)
  const seed = useDesignStore((s) => s.seed)
  const palette = useDesignStore((s) => s.palette)
  const layers = useDesignStore((s) => s.layers)
  const generatorLayers = useDesignStore((s) => s.generatorLayers)
  const duration = useAnimationStore((s) => s.duration)
  const playMode = useAnimationStore((s) => s.playMode)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const toggleOpen = async () => {
    const next = !open
    setOpen(next)
    if (next && mp4Supported === null) {
      const { canExportMp4 } = await import('@/export/animationExport')
      setMp4Supported(await canExportMp4())
    }
  }

  const runExport = async (format: ExportFormat) => {
    setOpen(false)
    setExportingFormat(format)
    setProgress(0)
    try {
      const { exportAnimationAsGif, exportAnimationAsMp4 } = await import('@/export/animationExport')
      const params: AnimationExportParams = {
        generatorId,
        parameters,
        seed,
        palette,
        layers,
        generatorLayers,
        tracks,
        duration,
        fps: FPS,
        playMode,
        onProgress: setProgress,
      }
      const blob = format === 'gif' ? await exportAnimationAsGif(params, EXPORT_SIZE) : await exportAnimationAsMp4(params, EXPORT_SIZE)
      downloadBlob(`${generatorId}-animation.${format}`, blob)
      show(`${format.toUpperCase()} downloaded`)
    } catch (err) {
      show('Animation export failed — try a shorter duration.')
      console.error('Animation export failed', err)
    } finally {
      setExportingFormat(null)
    }
  }

  if (exportingFormat) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-control-bg px-3 py-1.5 text-xs text-text-muted">
        <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-text-muted border-t-transparent" aria-hidden="true" />
        Exporting {exportingFormat.toUpperCase()}… {Math.round(progress * 100)}%
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <Button size="sm" variant="ghost" icon={<DownloadIcon width={13} height={13} />} onClick={toggleOpen}>
        <span className="flex items-center gap-1">
          Export
          <ChevronDownIcon width={11} height={11} />
        </span>
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-44 rounded-xl border border-border bg-surface-elevated p-1.5 shadow-lg">
          <button
            onClick={() => runExport('gif')}
            className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-text hover:bg-control-bg"
          >
            GIF
          </button>
          <button
            onClick={() => runExport('mp4')}
            disabled={!mp4Supported}
            title={
              mp4Supported === null
                ? 'Checking browser support…'
                : mp4Supported
                  ? undefined
                  : 'MP4 export needs a browser with WebCodecs support (e.g. Chrome, Edge, or Safari 16.4+)'
            }
            className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-text hover:bg-control-bg disabled:opacity-40 disabled:pointer-events-none"
          >
            MP4 (H.264)
          </button>
        </div>
      )}
    </div>
  )
}
