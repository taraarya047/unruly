import { generatorRegistry } from '@/engine/registry'
import { useDesignStore } from '@/state/useDesignStore'
import { GeneratorCard } from './GeneratorCard'
import { PresetStrip } from './PresetStrip'

const CATEGORY_LABELS: Record<string, string> = {
  geometric: 'Geometric',
  organic: 'Organic',
  lines: 'Lines',
  experimental: 'Experimental',
}

export function GeneratorLibrary() {
  const generatorId = useDesignStore((s) => s.generatorId)
  const setGenerator = useDesignStore((s) => s.setGenerator)
  const generators = generatorRegistry.all()
  const categories = Array.from(new Set(generators.map((g) => g.category)))

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      <h2 className="px-1.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Presets</h2>
      <div className="mb-4">
        <PresetStrip />
      </div>

      <h2 className="px-1.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Generators</h2>
      {categories.map((cat) => (
        <div key={cat} className="mb-3">
          <div className="px-1.5 pb-1 text-[11px] font-medium text-text-muted">{CATEGORY_LABELS[cat] ?? cat}</div>
          <div className="flex flex-col gap-1">
            {generators
              .filter((g) => g.category === cat)
              .map((g) => (
                <GeneratorCard key={g.id} generator={g} active={g.id === generatorId} onClick={() => setGenerator(g.id)} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
