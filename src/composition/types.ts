export type ClipShape = 'rect' | 'circle' | 'half-left' | 'half-right'
export type FitMode = 'cover' | 'contain'
export type SafeZoneSide = 'none' | 'left' | 'right' | 'center' | 'top' | 'bottom'
export type TextAlign = 'left' | 'center' | 'right'

export interface CanvasPreset {
  id: string
  name: string
  category: 'Poster' | 'Web' | 'Social' | 'Presentation' | 'Wallpaper'
  width: number
  height: number
}

export interface LayoutPreset {
  id: string
  name: string
  description: string
  fitMode: FitMode
  clipShape: ClipShape
  focalX: number
  focalY: number
  scale: number
  rotation: number
  /** Extra inset margin (0-0.3) used by 'contain' layouts like Framed. */
  margin?: number
}

export interface TextLayerState {
  enabled: boolean
  heading: string
  body: string
  align: TextAlign
}

export interface CompositionState {
  canvasWidth: number
  canvasHeight: number
  canvasPresetId: string
  layoutId: string
  focalX: number
  focalY: number
  scale: number
  rotation: number
  safeZone: SafeZoneSide
  showSafeZoneOverlay: boolean
  text: TextLayerState
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: 'poster-a4', name: 'A4', category: 'Poster', width: 2480, height: 3508 },
  { id: 'poster-a3', name: 'A3', category: 'Poster', width: 3508, height: 4961 },
  { id: 'poster-a2', name: 'A2', category: 'Poster', width: 4961, height: 7016 },
  { id: 'web-1440', name: '1440 × 900', category: 'Web', width: 1440, height: 900 },
  { id: 'web-1920', name: '1920 × 1080', category: 'Web', width: 1920, height: 1080 },
  { id: 'web-1200', name: '1200 × 800', category: 'Web', width: 1200, height: 800 },
  { id: 'social-square', name: 'Square post', category: 'Social', width: 1080, height: 1080 },
  { id: 'social-portrait', name: 'Portrait post', category: 'Social', width: 1080, height: 1350 },
  { id: 'social-story', name: 'Story', category: 'Social', width: 1080, height: 1920 },
  { id: 'presentation', name: 'Presentation', category: 'Presentation', width: 1920, height: 1080 },
  { id: 'wallpaper', name: 'Desktop wallpaper', category: 'Wallpaper', width: 2560, height: 1440 },
]

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: 'centered', name: 'Centered', description: 'Fills the frame, centered', fitMode: 'cover', clipShape: 'rect', focalX: 0.5, focalY: 0.5, scale: 1, rotation: 0 },
  { id: 'full-bleed', name: 'Full bleed', description: 'Edge to edge, slightly zoomed', fitMode: 'cover', clipShape: 'rect', focalX: 0.5, focalY: 0.5, scale: 1.15, rotation: 0 },
  { id: 'corner', name: 'Corner', description: 'Small accent in one corner', fitMode: 'contain', clipShape: 'rect', focalX: 0.16, focalY: 0.16, scale: 0.55, rotation: 0 },
  { id: 'diagonal', name: 'Diagonal', description: 'Rotated across the frame', fitMode: 'cover', clipShape: 'rect', focalX: 0.5, focalY: 0.5, scale: 1.25, rotation: 8 },
  { id: 'radial', name: 'Radial', description: 'Circular clip, centered', fitMode: 'cover', clipShape: 'circle', focalX: 0.5, focalY: 0.5, scale: 1, rotation: 0 },
  { id: 'framed', name: 'Framed', description: 'Inset with breathing room', fitMode: 'contain', clipShape: 'rect', focalX: 0.5, focalY: 0.5, scale: 1, rotation: 0, margin: 0.1 },
  { id: 'split', name: 'Split', description: 'Fills the left half only', fitMode: 'cover', clipShape: 'half-left', focalX: 0.5, focalY: 0.5, scale: 1, rotation: 0 },
  { id: 'asymmetric', name: 'Asymmetric', description: 'Off-center and tilted', fitMode: 'cover', clipShape: 'rect', focalX: 0.72, focalY: 0.32, scale: 1.25, rotation: -4 },
]

export const DEFAULT_LAYOUT = LAYOUT_PRESETS[0]
export const DEFAULT_CANVAS_PRESET = CANVAS_PRESETS[6] // social-square — friendly first canvas
