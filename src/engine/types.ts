export type GeneratorCategory =
  | 'geometric'
  | 'organic'
  | 'lines'
  | 'experimental'
  | 'fields'
  | 'particles'
  | 'topology'
  | 'tessellation'
  | 'optical'
  | 'mathematical'
  | 'texture'
  | 'playful'
  | 'architectural'
  | 'illustrative'

export type ParamGroup = 'shape' | 'pattern' | 'variation' | 'composition' | 'color'

export type GeneratorParameters = Record<string, number | string | boolean>

export interface NumberParamSchema {
  key: string
  label: string
  type: 'number' | 'angle'
  group: ParamGroup
  min: number
  max: number
  step: number
  advanced?: boolean
  /** Semantic hint used by the "Make it..." mutation engine */
  semantic?: 'density' | 'size' | 'jitter' | 'rotation' | 'contrast' | 'complexity' | 'scale'
}

export interface SelectParamSchema {
  key: string
  label: string
  type: 'select'
  group: ParamGroup
  options: { label: string; value: string }[]
  advanced?: boolean
}

export interface BooleanParamSchema {
  key: string
  label: string
  type: 'boolean'
  group: ParamGroup
  advanced?: boolean
}

export type ParameterSchema = NumberParamSchema | SelectParamSchema | BooleanParamSchema

// ---- Shape primitives ----

export type ShapePrimitive =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ring'; cx: number; cy: number; r: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number; rotation?: number }
  | { kind: 'polygon'; cx: number; cy: number; r: number; sides: number; rotation?: number }
  | { kind: 'star'; cx: number; cy: number; rOuter: number; rInner: number; points: number; rotation?: number }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'path'; d: string }
  | { kind: 'blob'; cx: number; cy: number; r: number; points: number; irregularity: number; seed: number }
  | { kind: 'arc'; cx: number; cy: number; r: number; startAngle: number; endAngle: number }

export interface StyledShape {
  shape: ShapePrimitive
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

// CSS mix-blend-mode values usable on an SVG <g> — the vocabulary for stacked generator layers.
export const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
] as const

export type BlendMode = (typeof BLEND_MODES)[number]

export interface SVGLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  shapes: StyledShape[]
  /** Defaults to 'normal' (plain alpha compositing) when omitted. */
  blendMode?: BlendMode
}

export interface DesignMetadata {
  generatorId: string
  generatorName: string
  seed: number
  paletteId: string
  createdAt: number
}

export interface GeneratedDesign {
  id: string
  seed: number
  width: number
  height: number
  layers: SVGLayer[]
  metadata: DesignMetadata
}

export interface GeneratorCapabilities {
  supportsColor: boolean
  supportsRotation: boolean
  supportsDensity: boolean
  supportsLayers: boolean
}

export interface GeneratorDefinition {
  id: string
  name: string
  category: GeneratorCategory
  description: string
  /** Free-form keywords for search/discovery — a generator can span multiple. */
  tags?: string[]
  defaultParameters: GeneratorParameters
  parameterSchema: ParameterSchema[]
  generate: (parameters: GeneratorParameters, seed: number, colors: string[]) => GeneratedDesign
  capabilities: GeneratorCapabilities
}
