import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cleanSvg } from '@/export/clean'
import { copySvgToClipboard } from '@/export/clipboard'
import { downloadBlob, downloadTextFile, rasterizeSvg } from '@/export/download'
import { useToastStore } from '@/state/useToastStore'
import { Button } from '@/components/ui/Button'
import { CopyIcon, DownloadIcon, ChevronDownIcon, CheckIcon } from '@/components/ui/icons'

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

interface ExportMenuProps {
  /** Returns a complete, standalone <svg>...</svg> string at `width`x`height`. */
  buildSvg: () => string
  width: number
  height: number
  filenameBase: string
}

export function ExportMenu({ buildSvg, width, height, filenameBase }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [justCopied, setJustCopied] = useState(false)
  const [scale, setScale] = useState(2)
  const [clean, setClean] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const show = useToastStore((s) => s.show)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function finalSvg() {
    const svg = buildSvg()
    return clean ? cleanSvg(svg) : svg
  }

  async function handleCopyFigma() {
    await copySvgToClipboard(finalSvg())
    setJustCopied(true)
    show(`Copied! Paste it into Figma with ${isMac ? '⌘V' : 'Ctrl+V'}.`)
    setTimeout(() => setJustCopied(false), 1800)
  }

  async function handleCopySvg() {
    await copySvgToClipboard(finalSvg())
    show('SVG copied to clipboard')
  }

  function handleDownloadSvg() {
    downloadTextFile(`${filenameBase}.svg`, finalSvg())
    show('SVG downloaded')
  }

  async function handleDownloadRaster(kind: 'png' | 'webp') {
    const svg = finalSvg()
    const blob = await rasterizeSvg(svg, width, height, scale, kind === 'png' ? 'image/png' : 'image/webp')
    downloadBlob(`${filenameBase}@${scale}x.${kind}`, blob)
    show(`${kind.toUpperCase()} downloaded`)
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center">
        <Button
          variant="primary"
          icon={justCopied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
          onClick={handleCopyFigma}
          className="rounded-r-none"
        >
          <span className="hidden sm:inline">{justCopied ? 'Copied' : 'Copy to Figma'}</span>
        </Button>
        <button
          aria-label="More export options"
          onClick={() => setOpen((v) => !v)}
          className="flex h-full items-center rounded-r-full bg-accent px-2.5 text-accent-foreground hover:brightness-110"
          style={{ height: 38 }}
        >
          <ChevronDownIcon width={16} height={16} />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-surface-elevated p-2 shadow-lg">
          <MenuItem icon={<CopyIcon width={15} height={15} />} label="Copy SVG" onClick={handleCopySvg} />
          <MenuItem icon={<DownloadIcon width={15} height={15} />} label="Download SVG" onClick={handleDownloadSvg} />
          <div className="my-1.5 h-px bg-border" />
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-text-muted">Resolution</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`rounded-md px-2 py-0.5 text-xs ${scale === s ? 'bg-accent text-accent-foreground' : 'bg-control-bg text-text-muted'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
          <MenuItem icon={<DownloadIcon width={15} height={15} />} label="Download PNG" onClick={() => handleDownloadRaster('png')} />
          <MenuItem icon={<DownloadIcon width={15} height={15} />} label="Download WebP" onClick={() => handleDownloadRaster('webp')} />
          <div className="my-1.5 h-px bg-border" />
          <label className="flex items-center justify-between px-2 py-1 text-xs text-text-muted">
            <span>Clean SVG (strip metadata)</span>
            <input type="checkbox" checked={clean} onChange={(e) => setClean(e.target.checked)} />
          </label>
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-text hover:bg-control-bg"
    >
      {icon}
      {label}
    </button>
  )
}
