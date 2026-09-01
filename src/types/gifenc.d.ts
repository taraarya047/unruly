// gifenc ships no type declarations — this covers only the surface this app actually uses.
// See node_modules/gifenc/README.md for the full API.
declare module 'gifenc' {
  export interface GifQuantizeOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444'
    oneBitAlpha?: boolean | number
    clearAlpha?: boolean
    clearAlphaThreshold?: number
    clearAlphaColor?: number
  }

  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: GifQuantizeOptions): number[][]

  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: number[][], format?: 'rgb565' | 'rgb444' | 'rgba4444'): Uint8Array

  export interface GifWriteFrameOptions {
    palette?: number[][]
    delay?: number
    repeat?: number
    dispose?: number
    transparent?: boolean
    transparentIndex?: number
    first?: boolean
  }

  export interface GIFEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: GifWriteFrameOptions): void
    finish(): void
    bytes(): Uint8Array
    reset(): void
    stream: { toString(): string }
  }

  export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): GIFEncoderInstance
}
