import { useMemo } from 'react'
import type { GeneratedDesign } from '@/engine/types'
import { renderDesignToSvgString } from '@/engine/render'
import { useCanvasView } from '@/hooks/useCanvasView'
import { CanvasToolbar } from './CanvasToolbar'

interface DesignCanvasProps {
  design: GeneratedDesign
  background: string
  className?: string
  showToolbar?: boolean
}

export function DesignCanvas({ design, background, className, showToolbar = true }: DesignCanvasProps) {
  const view = useCanvasView()
  const markup = useMemo(() => renderDesignToSvgString(design, { includeMetadata: false, sizeMode: 'fill' }), [design])
  const aspect = design.width / design.height
  const baseSize = 560

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col ${className ?? ''}`}>
      <div
        className="relative flex-1 touch-none overflow-hidden bg-canvas"
        onWheel={view.onWheel}
        onPointerDown={view.onPointerDown}
        onPointerMove={view.onPointerMove}
        onPointerUp={view.onPointerUp}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom})`,
              transition: 'box-shadow 200ms ease',
            }}
            className="shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_48px_-12px_rgba(0,0,0,0.25)]"
          >
            <div
              style={{
                width: aspect >= 1 ? baseSize : baseSize * aspect,
                height: aspect >= 1 ? baseSize / aspect : baseSize,
                background,
              }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: markup }}
              aria-label="Generated design preview"
              role="img"
            />
          </div>
        </div>
      </div>
      {showToolbar && <CanvasToolbar view={view} />}
    </div>
  )
}
