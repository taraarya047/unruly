import { useMemo } from 'react'
import { useCurrentDesign } from '@/hooks/useCurrentDesign'
import { useDesignStore } from '@/state/useDesignStore'
import { useCompositionStore } from '@/state/useCompositionStore'
import { renderCompositionToSvgString, safeZoneRect } from '@/composition/render'
import { useCanvasView } from '@/hooks/useCanvasView'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'

export function ComposeCanvas() {
  const design = useCurrentDesign()
  const palette = useDesignStore((s) => s.palette)
  const comp = useCompositionStore()
  const view = useCanvasView()

  const markup = useMemo(() => renderCompositionToSvgString(design, palette, comp), [design, palette, comp])
  const zone = comp.showSafeZoneOverlay ? safeZoneRect(comp.safeZone, comp.canvasWidth, comp.canvasHeight) : null

  const aspect = comp.canvasWidth / comp.canvasHeight
  const baseSize = 520
  const frameW = aspect >= 1 ? baseSize : baseSize * aspect
  const frameH = aspect >= 1 ? baseSize / aspect : baseSize

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className="relative flex-1 touch-none overflow-hidden bg-canvas"
        onWheel={view.onWheel}
        onPointerDown={view.onPointerDown}
        onPointerMove={view.onPointerMove}
        onPointerUp={view.onPointerUp}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{ transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom})` }} className="relative shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_48px_-12px_rgba(0,0,0,0.25)]">
            <div style={{ width: frameW, height: frameH }} dangerouslySetInnerHTML={{ __html: markup }} />
            {zone && (
              <div
                className="pointer-events-none absolute rounded-sm border-2 border-dashed border-accent/70"
                style={{
                  left: `${(zone.x / comp.canvasWidth) * 100}%`,
                  top: `${(zone.y / comp.canvasHeight) * 100}%`,
                  width: `${(zone.w / comp.canvasWidth) * 100}%`,
                  height: `${(zone.h / comp.canvasHeight) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      <CanvasToolbar view={view} />
    </div>
  )
}
