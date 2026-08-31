import { useCallback, useEffect, useRef, useState } from 'react'

export function useCanvasView() {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)

  const zoomIn = useCallback(() => setZoom((z) => Math.min(4, z * 1.25)), [])
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.1, z / 1.25)), [])
  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.min(4, Math.max(0.1, z * (1 - e.deltaY * 0.001))))
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [pan],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - dragging.current.startX
    const dy = e.clientY - dragging.current.startY
    setPan({ x: dragging.current.panX + dx, y: dragging.current.panY + dy })
  }, [])

  const onPointerUp = useCallback(() => {
    dragging.current = null
  }, [])

  useEffect(() => {
    const onFit = () => resetView()
    window.addEventListener('playground:fit', onFit)
    return () => window.removeEventListener('playground:fit', onFit)
  }, [resetView])

  return { zoom, pan, zoomIn, zoomOut, resetView, onWheel, onPointerDown, onPointerMove, onPointerUp }
}
