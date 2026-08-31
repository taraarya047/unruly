import { useMemo } from 'react'
import type { GeneratorDefinition } from '@/engine/types'
import { renderDesignToSvgString } from '@/engine/render'

interface GeneratorThumbnailProps {
  generator: GeneratorDefinition
  seed?: number
  colors?: string[]
  background?: string
  className?: string
}

export function GeneratorThumbnail({ generator, seed = 7, colors, background = '#ffffff', className }: GeneratorThumbnailProps) {
  const markup = useMemo(() => {
    const palette = colors ?? ['#171512', '#6b6559', '#ff5a36']
    const design = generator.generate(generator.defaultParameters, seed, palette)
    return renderDesignToSvgString(design, { includeMetadata: false, sizeMode: 'fill' })
  }, [generator, seed, colors])

  return (
    <div
      className={className}
      style={{ background }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
