import { useEffect, useState } from 'react'
import { useCurrentDesign } from '@/hooks/useCurrentDesign'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useDesignStore } from '@/state/useDesignStore'
import { useAnimationStore } from '@/state/useAnimationStore'
import { renderDesignToSvgString } from '@/engine/render'
import { decodeShareUrl } from '@/state/shareLink'
import { defaultLayerState } from '@/engine/composeLayers'
import { DesignCanvas } from '@/components/canvas/DesignCanvas'
import { GeneratorLibrary } from '@/components/generator/GeneratorLibrary'
import { ControlPanel } from '@/components/controls/ControlPanel'
import { TimelinePanel } from '@/components/timeline/TimelinePanel'
import { AdSlot } from '@/components/ads/AdSlot'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { ExportMenu } from '@/components/export/ExportMenu'
import { GridIcon, PaletteIcon, TimelineIcon } from '@/components/ui/icons'

export function Playground() {
  useKeyboardShortcuts(true)
  const design = useCurrentDesign()
  useDocumentMeta(
    `${design.metadata.generatorName} — Unruly Playground`,
    `Generate, tune, and evolve ${design.metadata.generatorName.toLowerCase()} designs live, then export as SVG, PNG, WebP, or copy straight into Figma.`,
  )
  const palette = useDesignStore((s) => s.palette)
  const isMobile = useIsMobile()
  const timelineOpen = useAnimationStore((s) => s.panelOpen)
  const toggleTimeline = useAnimationStore((s) => s.togglePanel)
  const setTimelineOpen = useAnimationStore((s) => s.setPanelOpen)
  const [mobileSheet, setMobileSheet] = useState<'generators' | 'controls' | null>(null)

  useEffect(() => {
    const shared = decodeShareUrl(window.location.search)
    if (!shared) return
    useDesignStore.getState().loadSnapshot({
      generatorId: shared.generatorId,
      parameters: shared.parameters,
      seed: shared.seed,
      palette: shared.palette,
      layers: defaultLayerState(),
      generatorLayers: shared.generatorLayers,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    // md:flex-none matters: `flex-1` alone sets flex-basis:0%, which makes an explicit height inert
    // (the flex algorithm ignores `height` once flex-basis is non-auto) — so without flex-none here,
    // this wrapper silently grows past the viewport the moment total content (e.g. the timeline panel)
    // exceeds it, instead of the fixed height clamping it and letting children scroll internally.
    <div className="flex flex-1 flex-col md:h-[calc(100vh-4rem)] md:flex-none">
      <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block md:min-h-0">
          <GeneratorLibrary />
        </aside>

        <div className="flex min-h-[60vh] flex-1 flex-col md:min-h-0">
          <DesignCanvas design={design} background={palette.background} />
          {timelineOpen && !isMobile && (
            <div className="flex h-96 shrink-0 flex-col border-t border-border bg-surface">
              <TimelinePanel />
            </div>
          )}
        </div>

        <aside className="hidden w-72 shrink-0 border-l border-border bg-surface md:block md:min-h-0">
          <ControlPanel />
        </aside>
      </div>

      {/* Mobile bottom toolbar */}
      <div className="flex items-center gap-2 border-t border-border bg-surface-elevated p-3 md:hidden">
        <Button className="flex-1" icon={<GridIcon width={15} height={15} />} onClick={() => setMobileSheet('generators')}>
          Generators
        </Button>
        <Button className="flex-1" icon={<PaletteIcon width={15} height={15} />} onClick={() => setMobileSheet('controls')}>
          Controls
        </Button>
        <IconButton label={timelineOpen ? 'Hide animation timeline' : 'Show animation timeline'} active={timelineOpen} onClick={toggleTimeline}>
          <TimelineIcon width={18} height={18} />
        </IconButton>
        <ExportMenu
          buildSvg={() => renderDesignToSvgString(design)}
          width={design.width}
          height={design.height}
          filenameBase={`${design.metadata.generatorId}-${design.seed}`}
        />
      </div>

      <div className="border-t border-border bg-surface px-4 py-4">
        <AdSlot variant="leaderboard" placement="editor-bottom" />
      </div>

      <BottomSheet open={mobileSheet === 'generators'} onClose={() => setMobileSheet(null)} title="Generators">
        <GeneratorLibrary />
      </BottomSheet>
      <BottomSheet open={mobileSheet === 'controls'} onClose={() => setMobileSheet(null)} title="Controls">
        <ControlPanel />
      </BottomSheet>
      <BottomSheet open={isMobile && timelineOpen} onClose={() => setTimelineOpen(false)} title="Animation timeline">
        <TimelinePanel />
      </BottomSheet>
    </div>
  )
}
