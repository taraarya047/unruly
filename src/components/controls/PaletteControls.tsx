import { useState } from 'react'
import { useDesignStore } from '@/state/useDesignStore'
import { useAllPalettes } from '@/palette/allPalettes'
import { generateHarmonyPalette } from '@/palette/harmony'
import { createRng, randomSeed } from '@/engine/prng'
import { Button } from '@/components/ui/Button'
import { ShuffleIcon } from '@/components/ui/icons'
import { PaletteManagerModal } from './PaletteManagerModal'
import type { Palette } from '@/palette/types'

export function PaletteControls() {
  const palette = useDesignStore((s) => s.palette)
  const setPalette = useDesignStore((s) => s.setPalette)
  const allPalettes = useAllPalettes()
  const [managerOpen, setManagerOpen] = useState(false)

  const updateColor = (index: number, hex: string) => {
    const colors = palette.colors.slice()
    colors[index] = hex
    setPalette({ ...palette, colors, id: 'custom', name: palette.name === 'Custom' ? palette.name : `${palette.name} (edited)` })
  }

  const shuffle = () => {
    const rng = createRng(randomSeed())
    setPalette(generateHarmonyPalette(rng))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">{palette.name}</span>
        <Button size="sm" variant="ghost" icon={<ShuffleIcon width={14} height={14} />} onClick={shuffle}>
          Shuffle
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {palette.colors.map((c, i) => (
          <span key={i} className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10" style={{ backgroundColor: c }}>
            <input
              type="color"
              value={c}
              onChange={(e) => updateColor(i, e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={`Color ${i + 1}`}
            />
          </span>
        ))}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">Palettes</span>
          <button onClick={() => setManagerOpen(true)} className="text-xs font-medium text-accent hover:underline">
            Manage
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {allPalettes.map((p) => (
            <PalettePreview key={p.id} palette={p} active={p.id === palette.id} onClick={() => setPalette(p)} />
          ))}
        </div>
      </div>

      <PaletteManagerModal
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onSelect={(p) => {
          setPalette(p)
          setManagerOpen(false)
        }}
        seedForNew={palette}
      />
    </div>
  )
}

function PalettePreview({ palette, active, onClick }: { palette: Palette; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={palette.name}
      className={`flex h-9 overflow-hidden rounded-lg ring-1 transition-transform hover:scale-105 ${active ? 'ring-2 ring-accent' : 'ring-border'}`}
    >
      {palette.colors.slice(0, 4).map((c, i) => (
        <span key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </button>
  )
}
