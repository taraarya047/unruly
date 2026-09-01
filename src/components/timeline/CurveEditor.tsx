import { useMemo, useRef } from 'react'
import { EASING_PRESETS, cubicBezierComponent, type BezierPoints, type EasingPresetName } from '@/engine/easing'

const SIZE = 112
const PAD = 12
const PLOT = SIZE - PAD * 2
const Y_MIN = -0.5
const Y_MAX = 1.5

const PRESET_LABELS: Record<EasingPresetName, string> = {
  linear: 'Linear',
  'ease-in': 'Ease in',
  'ease-out': 'Ease out',
  'ease-in-out': 'Ease in-out',
}

function toPx(x: number, y: number) {
  const px = PAD + x * PLOT
  const norm = (y - Y_MIN) / (Y_MAX - Y_MIN)
  const py = PAD + (1 - norm) * PLOT
  return { px, py }
}

function fromPx(px: number, py: number) {
  const x = Math.min(1, Math.max(0, (px - PAD) / PLOT))
  const norm = 1 - (py - PAD) / PLOT
  const y = Math.min(Y_MAX, Math.max(Y_MIN, norm * (Y_MAX - Y_MIN) + Y_MIN))
  return { x, y }
}

interface CurveEditorProps {
  easing: BezierPoints
  onChange: (easing: BezierPoints) => void
}

/** Cubic-bezier curve editor for a keyframe's incoming easing — draggable handles, CSS-style semantics. */
export function CurveEditor({ easing, onChange }: CurveEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<'p1' | 'p2' | null>(null)

  const origin = toPx(0, 0)
  const dest = toPx(1, 1)
  const p1 = toPx(easing.x1, easing.y1)
  const p2 = toPx(easing.x2, easing.y2)

  const curvePath = useMemo(() => {
    const steps = 28
    let d = `M ${origin.px} ${origin.py}`
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const x = cubicBezierComponent(t, easing.x1, easing.x2)
      const y = cubicBezierComponent(t, easing.y1, easing.y2)
      const { px, py } = toPx(x, y)
      d += ` L ${px} ${py}`
    }
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [easing.x1, easing.y1, easing.x2, easing.y2])

  const beginDrag = (which: 'p1' | 'p2') => (e: React.PointerEvent) => {
    e.stopPropagation()
    dragging.current = which
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // No-op: pointer capture is best-effort (e.g. no active pointer session for this id).
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const { x, y } = fromPx(e.clientX - rect.left, e.clientY - rect.top)
    if (dragging.current === 'p1') onChange({ ...easing, x1: x, y1: y })
    else onChange({ ...easing, x2: x, y2: y })
  }
  const endDrag = () => {
    dragging.current = null
  }

  return (
    <div className="w-full shrink-0 p-2 md:w-[148px] md:border-l md:border-border">
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">Easing</div>
      <div className="mb-1.5 flex flex-wrap gap-1">
        {(Object.keys(EASING_PRESETS) as EasingPresetName[]).map((name) => (
          <button
            key={name}
            onClick={() => onChange(EASING_PRESETS[name])}
            className="rounded-full bg-control-bg px-2 py-0.5 text-[10px] font-medium text-text transition-colors hover:bg-control-hover"
          >
            {PRESET_LABELS[name]}
          </button>
        ))}
      </div>
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="touch-none rounded-lg border border-border bg-control-bg/40"
      >
        <line x1={origin.px} y1={origin.py} x2={dest.px} y2={dest.py} stroke="var(--border)" strokeDasharray="2 2" />
        <path d={curvePath} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={origin.px} y1={origin.py} x2={p1.px} y2={p1.py} stroke="var(--text-muted)" strokeWidth={1} />
        <line x1={dest.px} y1={dest.py} x2={p2.px} y2={p2.py} stroke="var(--text-muted)" strokeWidth={1} />
        <circle cx={origin.px} cy={origin.py} r={2.5} fill="var(--text-muted)" />
        <circle cx={dest.px} cy={dest.py} r={2.5} fill="var(--text-muted)" />
        <circle cx={p1.px} cy={p1.py} r={5.5} fill="var(--accent)" className="cursor-grab" onPointerDown={beginDrag('p1')} />
        <circle cx={p2.px} cy={p2.py} r={5.5} fill="var(--accent)" className="cursor-grab" onPointerDown={beginDrag('p2')} />
      </svg>
      <div className="mt-1 text-center text-[10px] tabular-nums text-text-muted">
        cubic-bezier({easing.x1.toFixed(2)}, {easing.y1.toFixed(2)}, {easing.x2.toFixed(2)}, {easing.y2.toFixed(2)})
      </div>
    </div>
  )
}
