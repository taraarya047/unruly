import { generatorRegistry } from '@/engine/registry'
import { dotFieldGenerator } from './dotField'
import { gridGenerator } from './grid'
import { circlesGenerator } from './circles'
import { wavesGenerator } from './waves'
import { blobsGenerator } from './blobs'
import { polygonFieldGenerator } from './polygonField'
import { concentricGenerator } from './concentric'
import { flowLinesGenerator } from './flowLines'
import { checkerGenerator } from './checker'
import { confettiGenerator } from './confetti'
import { spiralGenerator } from './spiral'
import { hexGridGenerator } from './hexGrid'
import { halftoneGenerator } from './halftone'
import { mandalaGenerator } from './mandala'

const ALL_GENERATORS = [
  dotFieldGenerator,
  gridGenerator,
  circlesGenerator,
  wavesGenerator,
  blobsGenerator,
  polygonFieldGenerator,
  concentricGenerator,
  flowLinesGenerator,
  checkerGenerator,
  confettiGenerator,
  spiralGenerator,
  hexGridGenerator,
  halftoneGenerator,
  mandalaGenerator,
]

export function registerGenerators() {
  ALL_GENERATORS.forEach((g) => generatorRegistry.register(g))
}

// Registers on import so any module can safely depend on generatorRegistry being populated.
registerGenerators()

export {
  dotFieldGenerator,
  gridGenerator,
  circlesGenerator,
  wavesGenerator,
  blobsGenerator,
  polygonFieldGenerator,
  concentricGenerator,
  flowLinesGenerator,
  checkerGenerator,
  confettiGenerator,
  spiralGenerator,
  hexGridGenerator,
  halftoneGenerator,
  mandalaGenerator,
}
