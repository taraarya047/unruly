# Export System

## Hierarchy

1. **Copy to Figma** — copies a self-contained SVG string to the clipboard as `image/svg+xml` (with a
   `text/plain` fallback) via the Clipboard API. Figma's paste handler accepts SVG on the clipboard directly.
2. **Copy SVG** — same serialization, copied as plain text for pasting into code/markup.
3. **Download SVG** — same serialization, saved as a `.svg` file.
4. **Download PNG / WebP** — the SVG is drawn to an offscreen `<canvas>` at 1x/2x/3x/custom resolution and
   exported via `canvas.toBlob('image/png' | 'image/webp')`.

## Serialization rules (`export/serialize.ts`)

- Correct `viewBox` and explicit `width`/`height`.
- Semantic groups preserved: `<g id="background">`, `<g id="primary-pattern">`, etc. — one group per
  `SVGLayer`, in the same order the layer panel shows.
- All gradients/defs inlined in `<defs>`, referenced by local `url(#id)` — never an external URL.
- No external font/image references (Copy to Figma and Download must work fully offline).
- `Clean SVG` option strips `data-*` metadata attributes and rounds coordinates for smaller output; the
  default export keeps metadata (generator id, seed, params) as `data-*` attributes for traceability.

## One render path

`DesignCanvas` and the export serializer both consume the same `GeneratedDesign` -> SVG-string function
(`engine/render.ts`), so what the user sees in the editor is byte-identical to what gets exported.

## Reused across Playground and Compose

`components/export/ExportMenu.tsx` takes a `buildSvg(): string` function plus `width`/`height`/`filenameBase`
— it doesn't know about `GeneratedDesign` at all. Playground passes `engine/render.ts`'s serializer; Compose
passes `composition/render.ts`'s serializer. One export UI, two independent SVG sources.
