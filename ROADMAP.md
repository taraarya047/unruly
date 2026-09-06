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
- [x] **Phase 5 — Explore**: gallery tiles evolve/recolor/copy-to-Figma in place on hover, no navigation
      required — the "evolve/remix from inspiration" loop from the spec, with real back/forward memory per
      tile (see the shuffle-history entry below). A "Curated presets" section (the same `DESIGN_PRESETS`
      used in the Playground sidebar, now also browsable here) sits above the algorithmic generator
      gallery, giving Explore the separate curated section the spec asked for. The gallery itself is now
      paginated ("Load more", capped at 120) instead of a fixed 24 items — `buildGallery(count)` replays
      the same seeded RNG stream from the start each time, so a bigger count's first N items are always
      identical to the smaller count's, making "Load more" a pure re-slice with no separate per-page seed
      bookkeeping and no risk of the newly-revealed items silently reshuffling the ones already on screen.
- [x] **Phase 6 — Saved Designs**: search by name, inline rename, duplicate (store actions existed since
      Phase 1, wired to UI in this phase). Shareable design URLs (`state/shareLink.ts` — base64url-encodes
      `{generator, parameters, seed, palette}` into `?d=`, decoded and hydrated on Playground load).
      Tags (add/remove, normalized, filterable via chips at the top of the page) and JSON import/export of a
      single saved design (`export/designFile.ts` — versioned payload, validates generator id/seed/parameters/
      palette shape and rejects malformed or unrecognized files without throwing). Verified end-to-end:
      round-trip preserves tags/parameters/palette with a fresh id, and three invalid-input cases (malformed
      JSON, wrong shape, unknown generator id) all correctly rejected.
- [~] **Phase 7 — Advertising** (partial): everything the spec asked for except real ad delivery. `AdSlot`
      is now a real loading/filled/failed state machine (a pulsing skeleton, then either the placeholder
      "Advertisement" fill or a silently-empty reserved slot — never a layout shift, in any state); the one
      function standing in for a real ad SDK's load call (`loadAdStub`) simulates realistic latency and an
      occasional fill failure specifically so the failed state is a real, exercised path rather than
      untested code. Built the measurement layer the spec called for (`state/useAnalyticsStore.ts`, a
      capped local event log, no backend to send it to yet): ad viewability via a real `IntersectionObserver`
      against the IAB 50%-for-1s standard, page-wide Cumulative Layout Shift via the real
      `PerformanceObserver` Layout Instability API, session duration, export conversion (every `ExportMenu`
      action), and generator usage (`GeneratorLibrary` selections) — every metric is a real measurement of
      real interactions, not simulated data. What's still blocked: actual ad network accounts/SDKs this
      environment doesn't have, so no real ad ever renders in the slot.
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

- [x] **40-generator expansion** (user-requested, outside the original phase plan): 38 new generators across
      Geometry/Organic/Lines/Fields/Particles/Topology/Tessellation/Optical/Mathematical/Experimental/Texture/
      Playful/Architectural/Illustrative, bringing the total to 52 (two spec-requested concepts, Halftone and
      Confetti Party, already matched existing generators closely enough that adding near-duplicates would
      have violated the spec's own "if indistinguishable, combine" guidance). Extracted a shared `engine/math/`
      layer (Delaunay/Voronoi, marching-squares contour extraction, L-systems + turtle graphics, chaotic
      attractors, isometric projection, noise/height fields) so new generators reuse non-trivial algorithms
      instead of reimplementing them, and added a search box to the generator library. Confirmed the existing
      lock/Evolve/mutation/undo-redo architecture required zero per-generator code to support all 38 new
      generators — those systems only ever read a generator's declarative `parameterSchema`. Built an automated
      smoke test (`window.__smokeTest`) covering all 52 generators × default/min/max params × 3 seeds (468
      cases) checking for NaN/Infinity, invalid SVG (`DOMParser` parse errors), and slow renders (>250ms); it
      caught two real, previously-undetected bugs: a dormant duplicate-XML-attribute bug in the `ring`
      primitive (fixed in `engine/shapes.ts`/`engine/types.ts`) that broke every generator using it, and a
      performance regression where Topographic Map (and the pre-existing Checker generator) resampled an
      expensive field/produced excessive shape counts (fixed via `sampleGrid`/`marchingSquaresFromGrid` reuse
      and a raised `tileSize` minimum, respectively).

- [x] **Stacked generator layers** (user-requested, outside the original phase plan): designs can now
      composite multiple independent generators — `state/useDesignStore.ts` gained a `generatorLayers`
      array (`{ generatorId, parameters, seed, opacity, blendMode, visible }` each), rendered on top of
      the base design via CSS `mix-blend-mode` (16 modes) with `isolation:isolate`, managed through a new
      Generator Layers panel (add/remove/reorder/randomize/opacity/blend mode per layer). "Surprise me"
      was renamed "Shuffle" and now rerolls the base design and every stacked layer's generator/params/
      seed independently rather than just the base; a new "Surprise me" mode rebuilds the whole layer
      stack from scratch (how many layers, which generators), with a "Chaos blending" toggle that also
      wildly randomizes every layer's opacity/blend mode instead of the tasteful default range. Persists
      through save/load, share links, and JSON import/export. Found and fixed a real bug during
      integration: the pre-existing "Shape layers" panel (per-generator sub-layer visibility/opacity)
      was picking up these new stacked layers too, but its opacity slider for them was a dead end —
      overrides are applied before the stacked layers are composited onto the design, so the control
      looked live but silently did nothing; fixed by excluding stacked-layer ids from that panel.

- [x] **Keyframe animation timeline** (user-requested, outside the original phase plan): numeric/angle
      generator parameters can now be animated — a collapsible Timeline panel with a real transport
      (play/pause/loop/duration/scrubbable playhead ruler), per-parameter tracks (click a lane to drop a
      keyframe, drag to retime), and a proper cubic-bezier curve editor per keyframe (draggable handles +
      Linear/Ease in/Ease out/Ease in-out presets) — the common video/motion-graphics timeline workflow the
      spec asked for. Desktop docks it under the canvas (toggled from the header); mobile opens the same
      `TimelinePanel` component in a `BottomSheet` (toggled from the mobile toolbar), with the curve editor
      stacking below the tracks instead of beside them and a narrower label column to fit — one component,
      two responsive layouts, not a separate mobile build. Playback is a pure render-time preview
      (`state/useAnimationStore.ts` is entirely separate from `useDesignStore` and its undo history) that
      flows through the same generate → composeLayers pipeline as any other parameter change. While
      building this, found and fixed a real, previously-latent layout bug: the Playground/Compose page
      wrapper's `flex-1` was silently making its own `md:h-[calc(100vh-4rem)]` inert (flex-basis:0% from
      flex-1 makes an explicit height ignored by the flex algorithm), so the whole page grew past the
      viewport instead of clamping to it the moment total content — like the new 256px timeline panel —
      exceeded it; fixed with `md:flex-none` alongside the explicit height on both pages. Also found a
      second real bug while wiring up mobile: a `hidden md:inline-flex` meant to hide the panel's own close
      button on mobile (redundant with the sheet's own close affordance) silently lost the cascade fight
      against `IconButton`'s hardcoded `inline-flex` base class at equal specificity, so the button stayed
      visible; fixed by conditionally rendering it instead of fighting CSS specificity. See ARCHITECTURE.md's
      "Keyframe animation timeline" section for the full mechanism.

- [x] **Animation export (GIF / MP4)** (user-requested, outside the original phase plan): the Timeline panel
      gained an "Export" menu, shown once at least one parameter is animated, that renders the keyframe
      animation to a real GIF or MP4 and downloads it — see EXPORT_SYSTEM.md's "Animation export" section for
      the full mechanism. GIF via `gifenc` (per-frame palette quantization); MP4 via `mediabunny`, which
      drives the browser's native WebCodecs `VideoEncoder` directly — a real H.264 `.mp4`, not a MediaRecorder
      screen-capture hack or an `ffmpeg.wasm` build. Both formats respect the current play mode: `once`
      exports a single forward pass (and the GIF is set to play once, not loop); `loop` exports one forward
      pass that loops natively; `pingpong` exports the forward pass plus the reverse pass with the shared
      endpoints dropped, so the file bounces and loops seamlessly with no doubled frame at the turn. Frame
      rendering reuses the exact same generate → composeLayers → mergeGeneratorLayers pipeline the live
      preview uses, just sampled at fixed timestamps instead of driven by `requestAnimationFrame`, so export
      has no wall-clock dependency and is fully deterministic. Both encoding libraries (~180kb gzipped
      together) are dynamic-`import()`ed on first use rather than bundled eagerly, so Vite code-splits them
      into their own chunk and every visitor who never exports an animation pays nothing for the feature.

- [x] **Timeline accessibility polish**: a dedicated pass over the Timeline panel (the newest, most complex
      interactive surface added this cycle) turned up three real keyboard-accessibility gaps, mirroring
      exactly the kind of issue the original Phase 8 pass was built to catch. `CurveEditor`'s two bezier
      handles were bare SVG `<circle>`s with no focus/keyboard path at all — replaced with real `<button>`s
      absolutely positioned over the SVG (same drag behavior, plus arrow-key nudging, Shift for a bigger
      step). `TrackLane`'s keyframe diamonds were real `<button>`s but their `onClick` only called
      `stopPropagation()` — so a keyboard user tabbing to one and pressing Enter did nothing; fixed to
      actually select the keyframe, and added Left/Right arrow retiming. The keyframe lane itself had no
      keyboard way to add a keyframe (mouse-click-position only) — added Enter-to-add-at-the-current-
      playhead-time. `TimelineRuler`'s scrub track was a plain unfocusable `<div>` — turned into a real
      `role="slider"` with arrow-key (and Home/End) scrubbing. All verified via genuine keyboard event
      dispatch (Tab, Enter, arrow keys), not just code review.

- [x] **Rebrand to royal blue + favicon/logo + SEO metadata** (user-requested, outside the original phase
      plan): `--accent` is now a royal blue (`#3355dd` light / `#3d5ce0` dark) instead of the original
      orange, chosen and verified by computing WCAG contrast ratios directly rather than eyeballing —
      white `--accent-foreground` text on filled accent surfaces clears AA's 4.5:1 in both themes (6.03:1 /
      5.52:1). That same depth is, by construction, too dark to itself work as small text on the page
      background in dark mode (the two constraints don't overlap for one hue at AA — verified this is a
      real, not assumed, conflict); added a separate `--accent-text` token (`#7c93ff` in dark mode, 6.70:1)
      for the two small accent-colored text links that needed it, documented in DESIGN_SYSTEM.md. Replaced
      the unused, mismatched purple `favicon.svg` (from project scaffolding — didn't match the app's actual
      orange-then-blue star badge at all) with the real mark; added a 32×32 PNG fallback, an apple-touch-icon,
      and a `Logo.tsx` component so the badge exists in exactly one place. Built a proper 1200×630 OG share
      image and full `og:*`/`twitter:*`/canonical tag set in `index.html`, plus a `useDocumentMeta` hook for
      per-route (and per-generator, on Playground) live title/description updates — see ARCHITECTURE.md's
      "SEO / sharing metadata" section for what each mechanism actually covers and its limits as a
      client-only SPA. Discovered the About page already contained exactly the five educational Q&As the
      master spec's content-strategy section asked for (parametric design, SVG, SVG-vs-PNG, seeds, Figma
      workflow) — it just weren't linked from anywhere and had no SEO treatment; added it to the header nav,
      gave it its own title/description, and injected schema.org FAQPage structured data (Google's indexer
      runs JS, so this works despite no SSR). The larger §70 ask — indexable landing pages per generator
      type (`/svg-pattern-generator` etc.) — remains a distinct, larger follow-up, not attempted here.

- [x] **Advanced generator expansion, Phase 2 of 6 — fractals & mathematics** (user-requested 50-generator
      expansion, delivered in the phases the request's own spec demanded rather than all at once): added 10
      generators — Mandelbrot Landscape, Julia Orbits, Barnsley Fern, Fractal Tree Sculpture, Koch
      Coastline, Sierpinski Architecture, Pascal Mosaic, Prime Field, Phyllotaxis, Fibonacci Spiral (52 → 62
      total; see GENERATOR_SYSTEM.md for category placement and why each is a genuinely distinct technique,
      not a reskin of an existing generator). No architecture changes were needed — the existing
      `GeneratorDefinition`/`ParameterSchema` contract (group + `semantic` tags) already drives mutation,
      evolution, search, thumbnails, export, and Figma copy generically, so "add a generator" really did
      mean just writing `generate()` correctly. One new shared utility: `engine/math/complexEscape.ts`
      (the z²+c iteration both fractals share). Verified with a throwaway seed/min/max/random ×
      determinism harness (not checked into the repo — no test runner exists in this project yet, so this
      was a one-off `tsx` script) covering all 10 generators × 8 parameter combinations each, 80/80 passing,
      plus live visual QA in the browser. That QA caught two real bugs a passing test suite alone would have
      missed: Sierpinski Architecture's "Rotation" control was spinning each grid cell in place instead of
      rotating the whole composition (fixed by rotating the seed points/corners around canvas center before
      recursing, not each shape's own center); and Fibonacci Spiral's square-tiling used a plain geometric
      sequence that only tiles edge-to-edge at the exact golden ratio, producing disconnected fragments at
      any other "growth rate" value (fixed by switching to the true additive Fibonacci recurrence, which
      tiles perfectly for any seed ratio, and by anchoring the logarithmic-spiral curve to a fixed
      canvas-center radius instead of deriving it from that tiling's bounds). Also added `gridValueRange()`
      to `marchingSquares.ts` so Mandelbrot/Julia contour thresholds are placed within the field's actual
      observed range — a fixed guess could render blank at extreme zoom/iteration combinations.
      Remaining phases (3: tiling/geometry — Penrose, vortex/flow fields; 4: simulation/growth — DLA,
      crystal growth, cellular automata; 5: reaction/field systems — reaction-diffusion, circuit organism;
      6: typographic/optical — glyph field, Universal Field Sculptor) are intentionally not started yet.

See per-phase "what shipped" notes in commit history and end-of-phase reports.
