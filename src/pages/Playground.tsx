import { useEffect, useState } from 'react'
import { useCurrentDesign } from '@/hooks/useCurrentDesign'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useDesignStore } from '@/state/useDesignStore'
import { renderDesignToSvgString } from '@/engine/render'
import { decodeShareUrl } from '@/state/shareLink'
import { defaultLayerState } from '@/engine/composeLayers'
import { DesignCanvas } from '@/components/canvas/DesignCanvas'
import { GeneratorLibrary } from '@/components/generator/GeneratorLibrary'
import { ControlPanel } from '@/components/controls/ControlPanel'
import { AdSlot } from '@/components/ads/AdSlot'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { ExportMenu } from '@/components/export/ExportMenu'
import { GridIcon, PaletteIcon } from '@/components/ui/icons'

export function Playground() {
  useKeyboardShortcuts(true)
  const design = useCurrentDesign()
  const palette = useDesignStore((s) => s.palette)
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
    <div className="flex flex-1 flex-col md:h-[calc(100vh-4rem)]">
      <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block md:min-h-0">
          <GeneratorLibrary />
        </aside>

        <div className="flex min-h-[60vh] flex-1 flex-col md:min-h-0">
          <DesignCanvas design={design} background={palette.background} />
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
    </div>
  )
}
