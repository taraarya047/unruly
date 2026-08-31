import type { GeneratorParameters } from '@/engine/types'
import type { Palette } from '@/palette/types'
import { PALETTE_PRESETS } from '@/palette/presets'

export interface DesignPreset {
  id: string
  name: string
  description: string
  generatorId: string
  parameters: Partial<GeneratorParameters>
  palette: Palette
  seed?: number
}

function palette(id: string): Palette {
  return PALETTE_PRESETS.find((p) => p.id === id) ?? PALETTE_PRESETS[0]
}

// Curated parameter configurations, not raster assets — see product spec §54.
export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: 'soft-geometry',
    name: 'Soft Geometry',
    description: 'Circles, muted palette, low contrast',
    generatorId: 'circles',
    parameters: { size: 70, overlap: 0.2, opacity: 0.55, scaleVariation: 0.3 },
    palette: palette('meadow'),
  },
  {
    id: 'acid-grid',
    name: 'Acid Grid',
    description: 'Grid, vivid colors, distortion',
    generatorId: 'grid',
    parameters: { columns: 14, rows: 14, distortion: 0.6, spacing: 0.08 },
    palette: palette('acid'),
  },
  {
    id: 'paper-cut',
    name: 'Paper Cut',
    description: 'Organic shapes, limited palette',
    generatorId: 'blobs',
    parameters: { count: 8, size: 130, smoothness: 0.85, variation: 0.3 },
    palette: palette('paper'),
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'High contrast, geometric forms',
    generatorId: 'checker',
    parameters: { tileSize: 22, distortion: 0.35, rotation: 8 },
    palette: palette('brutalist'),
  },
  {
    id: 'retro-wave',
    name: 'Retro Wave',
    description: 'Waves, sunset palette',
    generatorId: 'waves',
    parameters: { amplitude: 42, frequency: 3, thickness: 4, spacing: 26 },
    palette: palette('retrowave'),
  },
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'Grid, restrained palette, symmetry',
    generatorId: 'grid',
    parameters: { columns: 6, rows: 6, spacing: 0.2, rotation: 0, distortion: 0 },
    palette: palette('swiss'),
  },
  {
    id: 'playground',
    name: 'Playground',
    description: 'Bright colors, randomness',
    generatorId: 'confetti',
    parameters: { count: 320, distribution: 0.7, rotation: 1 },
    palette: palette('coral'),
  },
  {
    id: 'topographic',
    name: 'Topographic',
    description: 'Contour lines, monochrome',
    generatorId: 'concentric',
    parameters: { count: 26, spacing: 16, distortion: 0.25, thickness: 1.5 },
    palette: palette('topographic'),
  },
  {
    id: 'cellular',
    name: 'Cellular',
    description: 'Voronoi cells, organic edges',
    generatorId: 'voronoi-worlds',
    parameters: { pointCount: 34, regularity: 0.45, distortion: 0.3 },
    palette: palette('meadow'),
  },
  {
    id: 'lava-lamp',
    name: 'Lava Lamp',
    description: 'Metaballs, warm merge',
    generatorId: 'metaballs',
    parameters: { blobCount: 9, blobSize: 100, smoothness: 1.3 },
    palette: palette('sunset'),
  },
  {
    id: 'kaleido-dream',
    name: 'Kaleido Dream',
    description: 'Mirrored symmetry, saturated',
    generatorId: 'kaleidoscope',
    parameters: { segments: 10, sourceShapes: 18, complexity: 0.6 },
    palette: palette('coral'),
  },
  {
    id: 'stained-light',
    name: 'Stained Light',
    description: 'Leaded panes, jewel tones',
    generatorId: 'stained-glass',
    parameters: { paneCount: 20, leadWidth: 4, colorVariation: 0.6 },
    palette: palette('acid'),
  },
  {
    id: 'blueprint-city',
    name: 'Blueprint City',
    description: 'Isometric blocks, restrained',
    generatorId: 'isometric-city',
    parameters: { gridSize: 7, density: 0.8, maxHeight: 110 },
    palette: palette('swiss'),
  },
  {
    id: 'chaotic-orbit',
    name: 'Chaotic Orbit',
    description: 'Lorenz attractor trails, dark',
    generatorId: 'lorenz-trails',
    parameters: { iterations: 8000, chaos: 30, thickness: 0.8 },
    palette: palette('ink'),
  },
  {
    id: 'cosmic-drift',
    name: 'Cosmic Drift',
    description: 'Spiral galaxy, dense stars',
    generatorId: 'spiral-galaxy',
    parameters: { arms: 4, twist: 4, density: 420 },
    palette: palette('ink'),
  },
  {
    id: 'textile',
    name: 'Textile',
    description: 'Over-under weave, muted',
    generatorId: 'weaving',
    parameters: { threadCount: 22, threadWidth: 0.85, colorVariation: 0.4 },
    palette: palette('paper'),
  },
  {
    id: 'wild-garden',
    name: 'Wild Garden',
    description: 'Chaos garden, dense growth',
    generatorId: 'chaos-garden',
    parameters: { organisms: 30, growth: 160, randomness: 0.6 },
    palette: palette('meadow'),
  },
  {
    id: 'string-symmetry',
    name: 'String Symmetry',
    description: 'Pin-and-thread pattern',
    generatorId: 'string-art',
    parameters: { pins: 120, multiplier: 47, strokeWidth: 0.5 },
    palette: palette('brutalist'),
  },
]
