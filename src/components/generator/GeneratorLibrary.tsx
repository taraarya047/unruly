import { useState } from 'react'
import { generatorRegistry } from '@/engine/registry'
import { useDesignStore } from '@/state/useDesignStore'
import { trackEvent } from '@/state/useAnalyticsStore'
import { ChevronDownIcon } from '@/components/ui/icons'
import { GeneratorCard } from './GeneratorCard'
import { PresetStrip } from './PresetStrip'

const CATEGORY_LABELS: Record<string, string> = {
  geometric: 'Geometric',
  organic: 'Organic',
  lines: 'Lines',
  experimental: 'Experimental',
  fields: 'Fields',
  particles: 'Particles',
  topology: 'Topology',
  tessellation: 'Tessellation',
  optical: 'Optical',
  mathematical: 'Mathematical',
  texture: 'Texture',
  playful: 'Playful',
  architectural: 'Architectural',
  illustrative: 'Illustrative',
}

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS)

export function GeneratorLibrary() {
  const generatorId = useDesignStore((s) => s.generatorId)
  const setGenerator = useDesignStore((s) => s.setGenerator)
  const [query, setQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const generators = generatorRegistry.all()

  const toggleCategory = (cat: string) => setExpandedCategory((prev) => (prev === cat ? null : cat))

  const selectGenerator = (id: string, category: string) => {
    setGenerator(id)
    trackEvent('generator_selected', { generatorId: id, category })
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? generators.filter((g) => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || (g.tags ?? []).some((t) => t.toLowerCase().includes(q)))
    : generators

  const categories = CATEGORY_ORDER.filter((cat) => filtered.some((g) => g.category === cat))

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      <h2 className="px-1.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Presets</h2>
      <div className="mb-4">
        <PresetStrip />
      </div>

      <div className="mb-3 px-0.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search generators…"
          className="w-full rounded-full border border-border bg-control-bg px-3 py-1.5 text-sm text-text placeholder:text-text-muted"
        />
      </div>

      <h2 className="px-1.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Generators {q && `(${filtered.length})`}
      </h2>
      {categories.length === 0 && q && <p className="px-1.5 text-xs text-text-muted">No generators match “{query}”.</p>}
      {categories.map((cat) => {
        const isOpen = q ? true : expandedCategory === cat
        return (
          <div key={cat} className="mb-1">
            <button
              onClick={() => toggleCategory(cat)}
              className="flex w-full items-center justify-between rounded-md px-1.5 py-1 text-[11px] font-medium text-text-muted transition-colors hover:bg-control-bg"
            >
              <span>{CATEGORY_LABELS[cat] ?? cat}</span>
              <ChevronDownIcon width={12} height={12} className={`shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="flex flex-col gap-1 pb-2 pt-1">
                {filtered
                  .filter((g) => g.category === cat)
                  .map((g) => (
                    <GeneratorCard key={g.id} generator={g} active={g.id === generatorId} onClick={() => selectGenerator(g.id, g.category)} />
                  ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
