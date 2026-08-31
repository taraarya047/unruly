import { generatorRegistry } from '@/engine/registry'
import { dotFieldGenerator } from './dotField'
import { gridGenerator } from './grid'
import { circlesGenerator } from './circles'
import { wavesGenerator } from './waves'
import { blobsGenerator } from './blobs'

export function registerGenerators() {
  ;[dotFieldGenerator, gridGenerator, circlesGenerator, wavesGenerator, blobsGenerator].forEach((g) =>
    generatorRegistry.register(g),
  )
}

// Registers on import so any module can safely depend on generatorRegistry being populated.
registerGenerators()

export { dotFieldGenerator, gridGenerator, circlesGenerator, wavesGenerator, blobsGenerator }
