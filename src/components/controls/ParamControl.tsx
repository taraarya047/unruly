import type { ParameterSchema } from '@/engine/types'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'

interface ParamControlProps {
  schema: ParameterSchema
  value: number | string | boolean
  onChange: (value: number | string | boolean) => void
}

export function ParamControl({ schema, value, onChange }: ParamControlProps) {
  if (schema.type === 'boolean') {
    return <Toggle checked={Boolean(value)} onChange={(v) => onChange(v)} label={schema.label} />
  }
  if (schema.type === 'select') {
    return (
      <label className="block">
        <span className="mb-1.5 block text-sm text-text">{schema.label}</span>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-control-bg px-2.5 py-1.5 text-sm text-text"
        >
          {schema.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    )
  }
  return (
    <Slider
      label={schema.label}
      value={Number(value)}
      min={schema.min}
      max={schema.max}
      step={schema.step}
      onChange={(v) => onChange(v)}
      formatValue={schema.type === 'angle' ? (v) => `${Math.round(v)}°` : undefined}
    />
  )
}
