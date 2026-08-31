# Roadmap

- [x] **Phase 0 — Foundation**: tooling, routing, theme tokens, app shell, generator/palette/state architecture.
- [x] **Phase 1 — Core Playground**: 5 generators, canvas, randomize/evolve, undo/redo, palette controls,
      light/dark, responsive editor, local save, SVG/PNG/WebP + Copy to Figma export.
- [x] **Phase 2 — Generative Playground**: 5 more generators (10 total), 4-way lockable subsystems
      (geometry/composition/texture/palette) with per-group randomization, Distort magic-button mode,
      design-evolution variation picker, curated presets, advanced seed control, keyboard-shortcuts panel.
- [x] **Phase 3 — Composition**: `/compose` page — 11 canvas-size presets (Poster/Web/Social/Presentation/
      Wallpaper) + custom dimensions, 8 layout presets (Centered/Full bleed/Corner/Diagonal/Radial/Framed/
      Split/Asymmetric) via a unified fit+clip+focal transform, focal/scale/rotation controls, text-safe zones
      with an editable heading/body text layer, generic export reused from Playground. (Layer
      hide/show/reorder/duplicate landed in Phase 4, below.)
- [x] **Phase 4 — Export/Figma hardening + layers**: `Background` is now a first-class layer
      (visibility/opacity respected in-canvas via a transparency checkerboard, not just on export); a real
      Layer Panel (show/hide, lock, opacity, reorder, duplicate, delete) wired into undo/redo history. No
      Figma access in this environment, so hardening took the form of automated validation instead: every
      generator × every palette × full/clean export, plus every composition layout × canvas size (224 cases)
      parsed with `DOMParser` (zero parse errors, zero external references) and one export round-tripped
      through `<img src>` and the PNG/WebP rasterizer to confirm it renders standalone outside the app.
- [~] **Phase 5 — Explore** (partial): gallery tiles now evolve/recolor/copy-to-Figma in place on hover,
      no navigation required — the "evolve/remix from inspiration" loop from the spec. Still a lightweight
      deterministic gallery (24 fixed items from one seeded RNG), not a browsable/paginated/curated one; no
      preset gallery section separate from the generator gallery.
- [~] **Phase 6 — Saved Designs** (partial): search by name, inline rename, duplicate now wired up (the
      store actions existed since Phase 1 but had no UI). Shareable design URLs shipped
      (`state/shareLink.ts` — base64url-encodes `{generator, parameters, seed, palette}` into `?d=`, decoded
      and hydrated on Playground load; round-trip and malformed-input handling verified). Still missing:
      tags, and JSON import/export of a single saved design.
- [ ] **Phase 7 — Advertising**: real ad network integration behind the existing `AdSlot` contract.
- [ ] **Phase 8 — Polish**: visual/interaction/perf/accessibility/export review pass.

See per-phase "what shipped" notes in commit history and end-of-phase reports.
