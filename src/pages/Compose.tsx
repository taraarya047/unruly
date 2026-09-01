import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentDesign } from '@/hooks/useCurrentDesign'
import { useDesignStore } from '@/state/useDesignStore'
import { useCompositionStore } from '@/state/useCompositionStore'
import { generatorRegistry } from '@/engine/registry'
import { renderCompositionToSvgString } from '@/composition/render'
import { ComposeCanvas } from '@/components/compose/ComposeCanvas'
import { ComposeControls } from '@/components/compose/ComposeControls'
import { ExportMenu } from '@/components/export/ExportMenu'
import { AdSlot } from '@/components/ads/AdSlot'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { PaletteIcon } from '@/components/ui/icons'

export function Compose() {
  const design = useCurrentDesign()
  const palette = useDesignStore((s) => s.palette)
  const generatorId = useDesignStore((s) => s.generatorId)
  const comp = useCompositionStore()
  const generator = generatorRegistry.get(generatorId)
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false)

  return (
    // md:flex-none matters here too — see the same comment in pages/Playground.tsx.
    <div className="flex flex-1 flex-col md:h-[calc(100vh-4rem)] md:flex-none">
      <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface p-4 md:flex md:min-h-0">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Composing</div>
          <div className="mb-3 text-sm font-medium text-text">{generator?.name ?? 'Design'}</div>
          <div className="mb-4 aspect-square w-full overflow-hidden rounded-xl border border-border" style={{ background: palette.background }}>
            <div
              className="h-full w-full"
              aria-hidden="true"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: renderCompositionToSvgString(design, palette, { ...comp, layoutId: 'centered', focalX: 0.5, focalY: 0.5, scale: 1, rotation: 0, safeZone: 'none', text: { ...comp.text, enabled: false } }),
              }}
            />
          </div>
          <Link to="/playground">
            <Button className="w-full" size="sm">
              Edit design
            </Button>
          </Link>
          <p className="mt-4 text-xs leading-relaxed text-text-muted">
            Composition turns your generated design into a poster, hero, or social graphic. Pick a canvas size and layout, then export.
          </p>
        </aside>

        <div className="flex min-h-[60vh] flex-1 flex-col md:min-h-0">
          <ComposeCanvas />
        </div>

        <aside className="hidden w-80 shrink-0 border-l border-border bg-surface md:block md:min-h-0">
          <ComposeControls />
        </aside>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-elevated p-3">
        <Button className="md:hidden" icon={<PaletteIcon width={15} height={15} />} onClick={() => setMobileControlsOpen(true)}>
          Controls
        </Button>
        <span className="hidden text-xs text-text-muted md:block">
          {comp.canvasWidth} × {comp.canvasHeight}px
        </span>
        <ExportMenu
          buildSvg={() => renderCompositionToSvgString(design, palette, comp)}
          width={comp.canvasWidth}
          height={comp.canvasHeight}
          filenameBase={`compose-${generatorId}-${comp.canvasPresetId}`}
        />
      </div>

      <div className="border-t border-border bg-surface px-4 py-4">
        <AdSlot variant="leaderboard" placement="compose-bottom" />
      </div>

      <BottomSheet open={mobileControlsOpen} onClose={() => setMobileControlsOpen(false)} title="Compose controls">
        <ComposeControls />
      </BottomSheet>
    </div>
  )
}
