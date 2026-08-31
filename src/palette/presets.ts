import type { Palette } from './types'

export const PALETTE_PRESETS: Palette[] = [
  { id: 'sunset', name: 'Sunset', colors: ['#ff6b4a', '#ff9f6e', '#ffd08a', '#7c3aed'], background: '#fff7ed' },
  { id: 'acid', name: 'Acid Grid', colors: ['#ccff00', '#ff00aa', '#00e0ff', '#111111'], background: '#f5f5f0' },
  { id: 'paper', name: 'Paper Cut', colors: ['#e8e2d4', '#c9b896', '#8a6d4b', '#3f3226'], background: '#f7f4ec' },
  { id: 'brutalist', name: 'Brutalist', colors: ['#111111', '#ff3b30', '#f5f5f0'], background: '#f5f5f0' },
  { id: 'retrowave', name: 'Retro Wave', colors: ['#ff5f6d', '#ffc371', '#845ec2', '#2c2c54'], background: '#1b1035' },
  { id: 'swiss', name: 'Swiss', colors: ['#d0021b', '#111111', '#f5f5f0'], background: '#ffffff' },
  { id: 'topographic', name: 'Topographic', colors: ['#264653', '#2a9d8f', '#e9c46a'], background: '#f4f1ea' },
  { id: 'coral', name: 'Coral Reef', colors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#1a535c'], background: '#f7fff7' },
  { id: 'ink', name: 'Ink Wash', colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'], background: '#eef0f2' },
  { id: 'meadow', name: 'Meadow', colors: ['#606c38', '#283618', '#dda15e', '#bc6c25'], background: '#fefae0' },
]

export const DEFAULT_PALETTE = PALETTE_PRESETS[0]
