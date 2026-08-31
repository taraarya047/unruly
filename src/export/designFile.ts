import type { SavedDesign } from '@/state/useSavedStore'
import { generatorRegistry } from '@/engine/registry'

const FILE_VERSION = 1

interface DesignFilePayload {
  fileVersion: number
  name: string
  generatorId: string
  parameters: SavedDesign['parameters']
  seed: number
  palette: SavedDesign['palette']
  layers?: SavedDesign['layers']
  generatorLayers?: SavedDesign['generatorLayers']
  tags?: string[]
}

export function serializeDesignFile(design: SavedDesign): string {
  const payload: DesignFilePayload = {
    fileVersion: FILE_VERSION,
    name: design.name,
    generatorId: design.generatorId,
    parameters: design.parameters,
    seed: design.seed,
    palette: design.palette,
    layers: design.layers,
    generatorLayers: design.generatorLayers,
    tags: design.tags,
  }
  return JSON.stringify(payload, null, 2)
}

export type ParsedDesignFile = Omit<SavedDesign, 'id' | 'createdAt' | 'updatedAt'>

/** Parses and validates an imported design JSON file. Returns null (never throws) if it doesn't look right. */
export function parseDesignFile(text: string): ParsedDesignFile | null {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const payload = raw as Partial<DesignFilePayload>

  if (typeof payload.generatorId !== 'string' || !generatorRegistry.get(payload.generatorId)) return null
  if (typeof payload.seed !== 'number' || !Number.isFinite(payload.seed)) return null
  if (!payload.parameters || typeof payload.parameters !== 'object') return null
  if (!payload.palette || typeof payload.palette !== 'object' || !Array.isArray(payload.palette.colors)) return null

  return {
    name: typeof payload.name === 'string' && payload.name.trim() ? payload.name : 'Imported design',
    generatorId: payload.generatorId,
    parameters: payload.parameters,
    seed: payload.seed,
    palette: payload.palette,
    layers: payload.layers,
    generatorLayers: Array.isArray(payload.generatorLayers) ? payload.generatorLayers : undefined,
    tags: Array.isArray(payload.tags) ? payload.tags.filter((t): t is string => typeof t === 'string') : undefined,
  }
}
