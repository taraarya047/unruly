/**
 * Copies an SVG string to the clipboard as image/svg+xml (what Figma's paste handler expects),
 * with a text/plain fallback for browsers/contexts that only support plain text clipboard writes.
 */
export async function copySvgToClipboard(svg: string): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    const item = new ClipboardItem({
      'image/svg+xml': new Blob([svg], { type: 'image/svg+xml' }),
      'text/plain': new Blob([svg], { type: 'text/plain' }),
    })
    await navigator.clipboard.write([item])
    return
  }
  await navigator.clipboard.writeText(svg)
}

export async function copyTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}
