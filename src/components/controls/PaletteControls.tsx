import { useDesignStore } from '@/state/useDesignStore'
import { PALETTE_PRESETS } from '@/palette/presets'
import { generateHarmonyPalette } from '@/palette/harmony'
import { createRng, randomSeed } from '@/engine/prng'
import { Button } from '@/components/ui/Button'
import { ShuffleIcon } from '@/components/ui/icons'
import type { Palette } from '@/palette/types'

export function PaletteControls() {
  const palette = useDesignStore((s) => s.palette)
  const setPalette = useDesignStore((s) => s.setPalette)

  const updateColor = (index: number, hex: string) => {
    const colors = palette.colors.slice()
    colors[index] = hex
    setPalette({ ...palette, colors, id: 'custom', name: 'Custom' })
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
        <div className="mb-1.5 text-xs font-medium text-text-muted">Palettes</div>
        <div className="grid grid-cols-5 gap-1.5">
          {PALETTE_PRESETS.map((p) => (
            <PalettePreview key={p.id} palette={p} onClick={() => setPalette(p)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PalettePreview({ palette, onClick }: { palette: Palette; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={palette.name}
      className="flex h-9 overflow-hidden rounded-lg ring-1 ring-border transition-transform hover:scale-105"
    >
      {palette.colors.slice(0, 4).map((c, i) => (
        <span key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </button>
  )
}
