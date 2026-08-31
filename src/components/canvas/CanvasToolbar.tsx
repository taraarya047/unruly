import type { useCanvasView } from '@/hooks/useCanvasView'
import { IconButton } from '@/components/ui/IconButton'
import { ZoomInIcon, ZoomOutIcon, FitIcon } from '@/components/ui/icons'

interface CanvasToolbarProps {
  view: ReturnType<typeof useCanvasView>
}

export function CanvasToolbar({ view }: CanvasToolbarProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-surface-elevated px-1.5 py-1 shadow-sm">
        <IconButton label="Zoom out" onClick={view.zoomOut}>
          <ZoomOutIcon />
        </IconButton>
        <span className="w-10 text-center text-xs tabular-nums text-text-muted">{Math.round(view.zoom * 100)}%</span>
        <IconButton label="Zoom in" onClick={view.zoomIn}>
          <ZoomInIcon />
        </IconButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <IconButton label="Fit canvas (F)" onClick={view.resetView}>
          <FitIcon />
        </IconButton>
      </div>
    </div>
  )
}
