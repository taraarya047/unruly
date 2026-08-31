# Export System

## Hierarchy

1. **Copy to Figma** — copies a self-contained SVG string to the clipboard as `image/svg+xml` (with a
   `text/plain` fallback) via the Clipboard API. Figma's paste handler accepts SVG on the clipboard directly.
2. **Copy SVG** — same serialization, copied as plain text for pasting into code/markup.
3. **Download SVG** — same serialization, saved as a `.svg` file.
4. **Download PNG / WebP** — the SVG is drawn to an offscreen `<canvas>` at 1x/2x/3x/custom resolution and
   exported via `canvas.toBlob('image/png' | 'image/webp')`.

## Serialization rules (`engine/render.ts`, `export/clean.ts`)

- Correct `viewBox` and explicit `width`/`height`.
- Semantic groups preserved: `<g id="background">`, `<g id="dots">`, etc. — one group per `SVGLayer`, including
  the layer panel's Background/duplicate/reorder edits, in the same order the layer panel shows (`engine/composeLayers.ts`).
- All fills/strokes are inline attributes or local `url(#id)` refs into a `<defs>` block a layout can add
  (e.g. `composition/render.ts`'s `<clipPath>`) — never an external URL. No generator currently emits gradients.
- No external font/image references (Copy to Figma and Download must work fully offline).
- `Clean SVG` (`export/clean.ts`) strips `data-*` metadata attributes for a smaller, presentation-only file; the
  default export keeps metadata (generator id, seed, palette id) as `data-*` attributes for traceability.

## Validated, not just assumed

This environment has no Figma access, so "does it paste into Figma cleanly" is validated as: every generator ×
every palette, in both default and Clean SVG form, plus every composition layout × canvas size — parsed with
`DOMParser` (checked for `parsererror`, a valid `<svg>` root, and zero external references) and spot-checked by
loading an export through `<img src>` (the strictest same-tool proxy for "another program treats this as a
self-contained image"). All checks pass; see the Phase 4 note in `ROADMAP.md`.

## One render path

`DesignCanvas` and the export serializer both consume the same `GeneratedDesign` -> SVG-string function
(`engine/render.ts`), so what the user sees in the editor is byte-identical to what gets exported.

## Reused across Playground and Compose

`components/export/ExportMenu.tsx` takes a `buildSvg(): string` function plus `width`/`height`/`filenameBase`
— it doesn't know about `GeneratedDesign` at all. Playground passes `engine/render.ts`'s serializer; Compose
passes `composition/render.ts`'s serializer. One export UI, two independent SVG sources.
