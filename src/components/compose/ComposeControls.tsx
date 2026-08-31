import { useCompositionStore } from '@/state/useCompositionStore'
import { CANVAS_PRESETS, LAYOUT_PRESETS, type SafeZoneSide, type TextAlign } from '@/composition/types'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

const CATEGORIES = ['Poster', 'Web', 'Social', 'Presentation', 'Wallpaper'] as const

const SAFE_ZONE_OPTIONS: { label: string; value: SafeZoneSide }[] = [
  { label: 'None', value: 'none' },
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
]

const ALIGN_OPTIONS: { label: string; value: TextAlign }[] = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
]

export function ComposeControls() {
  const comp = useCompositionStore()

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div>
        <div className="mb-2 text-xs font-medium text-text-muted">Canvas size</div>
        <select
          value={comp.canvasPresetId === 'custom' ? '' : comp.canvasPresetId}
          onChange={(e) => comp.setCanvasPreset(e.target.value)}
          className="w-full rounded-lg border border-border bg-control-bg px-2.5 py-1.5 text-sm text-text"
        >
          <option value="" disabled>
            Custom ({comp.canvasWidth} × {comp.canvasHeight})
          </option>
          {CATEGORIES.map((cat) => (
            <optgroup key={cat} label={cat}>
              {CANVAS_PRESETS.filter((p) => p.category === cat).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.width}×{p.height})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            value={comp.canvasWidth}
            onChange={(e) => comp.setCustomCanvas(Number(e.target.value) || 1, comp.canvasHeight)}
            className="w-full rounded-lg border border-border bg-control-bg px-2.5 py-1.5 text-sm tabular-nums text-text"
          />
          <span className="text-xs text-text-muted">×</span>
          <input
            type="number"
            value={comp.canvasHeight}
            onChange={(e) => comp.setCustomCanvas(comp.canvasWidth, Number(e.target.value) || 1)}
            className="w-full rounded-lg border border-border bg-control-bg px-2.5 py-1.5 text-sm tabular-nums text-text"
          />
        </div>
      </div>

      <div className="h-px bg-border" />

      <div>
        <div className="mb-2 text-xs font-medium text-text-muted">Layout</div>
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUT_PRESETS.map((layout) => (
            <button
              key={layout.id}
              onClick={() => comp.setLayout(layout.id)}
              title={layout.description}
              className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                comp.layoutId === layout.id ? 'border-accent bg-accent/[0.08] text-text' : 'border-border text-text-muted hover:bg-control-bg'
              }`}
            >
              {layout.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-4">
        <div className="text-xs font-medium text-text-muted">Composition</div>
        <div className="grid grid-cols-2 gap-3">
          <Slider label="Focal X" value={comp.focalX} min={0} max={1} step={0.02} onChange={(v) => comp.setFocal(v, comp.focalY)} />
          <Slider label="Focal Y" value={comp.focalY} min={0} max={1} step={0.02} onChange={(v) => comp.setFocal(comp.focalX, v)} />
        </div>
        <Slider label="Scale" value={comp.scale} min={0.4} max={2} step={0.02} onChange={comp.setScale} />
        <Slider label="Rotation" value={comp.rotation} min={-45} max={45} step={1} onChange={comp.setRotation} formatValue={(v) => `${Math.round(v)}°`} />
      </div>

      <div className="h-px bg-border" />

      <div>
        <div className="mb-2 text-xs font-medium text-text-muted">Text-safe area</div>
        <SegmentedControl options={SAFE_ZONE_OPTIONS} value={comp.safeZone} onChange={comp.setSafeZone} className="flex-wrap" />
        <label className="mt-3 flex items-center justify-between">
          <span className="text-xs text-text-muted">Show safe-area guide</span>
          <Toggle checked={comp.showSafeZoneOverlay} onChange={comp.toggleSafeZoneOverlay} />
        </label>
      </div>

      <div className="h-px bg-border" />

      <div>
        <label className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">Text layer</span>
          <Toggle checked={comp.text.enabled} onChange={comp.setTextEnabled} />
        </label>
        {comp.text.enabled && (
          <div className="space-y-3">
            {comp.safeZone === 'none' && <p className="text-xs text-text-muted">Pick a text-safe area above to place your text.</p>}
            <label className="block">
              <span className="mb-1.5 block text-xs text-text-muted">Heading</span>
              <input
                value={comp.text.heading}
                onChange={(e) => comp.setTextField('heading', e.target.value)}
                className="w-full rounded-lg border border-border bg-control-bg px-2.5 py-1.5 text-sm text-text"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-text-muted">Body</span>
              <textarea
                value={comp.text.body}
                onChange={(e) => comp.setTextField('body', e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-control-bg px-2.5 py-1.5 text-sm text-text"
              />
            </label>
            <div>
              <span className="mb-1.5 block text-xs text-text-muted">Align</span>
              <SegmentedControl options={ALIGN_OPTIONS} value={comp.text.align} onChange={comp.setTextAlign} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
