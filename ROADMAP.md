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
- [x] **Phase 6 — Saved Designs**: search by name, inline rename, duplicate (store actions existed since
      Phase 1, wired to UI in this phase). Shareable design URLs (`state/shareLink.ts` — base64url-encodes
      `{generator, parameters, seed, palette}` into `?d=`, decoded and hydrated on Playground load).
      Tags (add/remove, normalized, filterable via chips at the top of the page) and JSON import/export of a
      single saved design (`export/designFile.ts` — versioned payload, validates generator id/seed/parameters/
      palette shape and rejects malformed or unrecognized files without throwing). Verified end-to-end:
      round-trip preserves tags/parameters/palette with a fresh id, and three invalid-input cases (malformed
      JSON, wrong shape, unknown generator id) all correctly rejected.
- [ ] **Phase 7 — Advertising**: real ad network integration behind the existing `AdSlot` contract. Needs
      actual ad-network accounts/SDKs this environment doesn't have — skipped, not attempted.
- [x] **Phase 8 — Polish**: found and fixed real issues rather than a cosmetic pass —
      (1) **Accessibility**: added a global `:focus-visible` ring (nothing had one before), fixed the Home
      hero mutator (a clickable `div` with no keyboard support — now a real `<button>`), added Escape-to-close
      + `role="dialog"`/`aria-labelledby` to Modal and BottomSheet (neither closed on Escape before), added
      `role="status"`/`aria-live` to the toaster, `role="img"`/`aria-label` on rendered-SVG previews that
      lacked one, and fixed a real WCAG failure: light-mode primary buttons (white text on the orange accent)
      measured 2.99:1 contrast, below the 4.5:1 AA minimum — fixed by darkening `--accent-foreground` in
      light mode to 6.10:1, verified by computing contrast ratios for every text/surface pairing in both
      themes. (2) **Performance/correctness**: profiled every generator at max parameters (worst case ~27ms
      for Flow Lines) and found every slider drag was pushing one undo-history entry *per tick* — confirmed
      via the store that a 20-tick drag created 20 undo steps. Fixed with a live/commit split
      (`setParameterLive` for drag-time updates, no history; `setParameter` commits once on release) plus
      `requestAnimationFrame` coalescing, verified a 21-tick simulated drag now produces exactly one history
      entry and one Undo reverts the whole drag.

- [x] **Palettes & more generators** (user-requested, outside the original phase plan): Pride and Trans
      Pride palettes, permanently pinned first in every palette list (`PINNED_PALETTE_IDS`) and the default
      on a fresh session; a Palette Manager (create/edit/delete/reorder custom palettes, built-ins read-only)
      backed by `useCustomPaletteStore`, with custom palettes folded into the randomization pool alongside
      built-ins. Four new generators — Spiral, Hex Grid, Halftone, Mandala — bringing the total to 14.

See per-phase "what shipped" notes in commit history and end-of-phase reports.
