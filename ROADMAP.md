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
      with an editable heading/body text layer, generic export reused from Playground. Layer
      hide/show/reorder/duplicate (spec §27) not yet exposed in UI — `SVGLayer` already carries the needed
      fields (`visible`/`locked`/`opacity`), just no editor for it yet.
- [ ] **Phase 4 — Export/Figma hardening**: real-world Figma paste testing, clean-SVG mode polish.
- [ ] **Phase 5 — Explore**: inspiration gallery, categories, remix/evolve-from-inspiration.
- [ ] **Phase 6 — Saved Designs**: search/filter/tags, import/export config, shareable design URLs.
- [ ] **Phase 7 — Advertising**: real ad network integration behind the existing `AdSlot` contract.
- [ ] **Phase 8 — Polish**: visual/interaction/perf/accessibility/export review pass.

See per-phase "what shipped" notes in commit history and end-of-phase reports.
