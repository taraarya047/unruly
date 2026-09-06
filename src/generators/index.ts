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
import { voronoiWorldsGenerator } from './voronoiWorlds'
import { delaunayMeshGenerator } from './delaunayMesh'
import { stainedGlassGenerator } from './stainedGlass'
import { stringArtGenerator } from './stringArt'
import { tileMorpherGenerator } from './tileMorpher'
import { particleConstellationGenerator } from './particleConstellation'
import { forceFieldGenerator } from './forceField'
import { magneticLinesGenerator } from './magneticLines'
import { orbitalSystemGenerator } from './orbitalSystem'
import { gravityWellGenerator } from './gravityWell'
import { spiralGalaxyGenerator } from './spiralGalaxy'
import { lorenzTrailsGenerator } from './lorenzTrails'
import { strangeAttractorGenerator } from './strangeAttractor'
import { fractalBloomGenerator } from './fractalBloom'
import { spiralShellGenerator } from './spiralShell'
import { metaballsGenerator } from './metaballs'
import { lsystemForestGenerator } from './lsystemForest'
import { liquidSwirlGenerator } from './liquidSwirl'
import { paperCutGenerator } from './paperCut'
import { chaosGardenGenerator } from './chaosGarden'
import { kaleidoscopeGenerator } from './kaleidoscope'
import { radialMandalaGenerator } from './radialMandala'
import { geometricFlowerGenerator } from './geometricFlower'
import { radiatingSunGenerator } from './radiatingSun'
import { impossibleStairsGenerator } from './impossibleStairs'
import { topographicMapGenerator } from './topographicMap'
import { heightFieldGenerator } from './heightField'
import { isometricCityGenerator } from './isometricCity'
import { abstractFloorplanGenerator } from './abstractFloorplan'
import { weavingGenerator } from './weaving'
import { moireGenerator } from './moire'
import { opArtGenerator } from './opArt'
import { pixelMosaicGenerator } from './pixelMosaic'
import { glitchGridGenerator } from './glitchGrid'
import { ribbonSculptureGenerator } from './ribbonSculpture'
import { inkSplashGenerator } from './inkSplash'
import { doodleFieldGenerator } from './doodleField'
import { magneticTypographyGenerator } from './magneticTypography'
import { mandelbrotLandscapeGenerator } from './mandelbrotLandscape'
import { juliaOrbitsGenerator } from './juliaOrbits'
import { barnsleyFernGenerator } from './barnsleyFern'
import { fractalTreeSculptureGenerator } from './fractalTreeSculpture'
import { kochCoastlineGenerator } from './kochCoastline'
import { sierpinskiArchitectureGenerator } from './sierpinskiArchitecture'
import { pascalMosaicGenerator } from './pascalMosaic'
import { primeFieldGenerator } from './primeField'
import { phyllotaxisGenerator } from './phyllotaxis'
import { fibonacciSpiralGenerator } from './fibonacciSpiral'

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
  voronoiWorldsGenerator,
  delaunayMeshGenerator,
  stainedGlassGenerator,
  stringArtGenerator,
  tileMorpherGenerator,
  particleConstellationGenerator,
  forceFieldGenerator,
  magneticLinesGenerator,
  orbitalSystemGenerator,
  gravityWellGenerator,
  spiralGalaxyGenerator,
  lorenzTrailsGenerator,
  strangeAttractorGenerator,
  fractalBloomGenerator,
  spiralShellGenerator,
  metaballsGenerator,
  lsystemForestGenerator,
  liquidSwirlGenerator,
  paperCutGenerator,
  chaosGardenGenerator,
  kaleidoscopeGenerator,
  radialMandalaGenerator,
  geometricFlowerGenerator,
  radiatingSunGenerator,
  impossibleStairsGenerator,
  topographicMapGenerator,
  heightFieldGenerator,
  isometricCityGenerator,
  abstractFloorplanGenerator,
  weavingGenerator,
  moireGenerator,
  opArtGenerator,
  pixelMosaicGenerator,
  glitchGridGenerator,
  ribbonSculptureGenerator,
  inkSplashGenerator,
  doodleFieldGenerator,
  magneticTypographyGenerator,
  mandelbrotLandscapeGenerator,
  juliaOrbitsGenerator,
  barnsleyFernGenerator,
  fractalTreeSculptureGenerator,
  kochCoastlineGenerator,
  sierpinskiArchitectureGenerator,
  pascalMosaicGenerator,
  primeFieldGenerator,
  phyllotaxisGenerator,
  fibonacciSpiralGenerator,
]

export function registerGenerators() {
  ALL_GENERATORS.forEach((g) => generatorRegistry.register(g))
}

// Registers on import so any module can safely depend on generatorRegistry being populated.
registerGenerators()

export { ALL_GENERATORS }
