/** Strips data-* metadata attributes for a smaller, presentation-only SVG. */
export function cleanSvg(svg: string): string {
  return svg.replace(/\s+data-[\w-]+="[^"]*"/g, '')
}
