export interface GuideSection {
  heading: string
  body: string[]
}

export interface Guide {
  slug: string
  /** Short label used in nav/footer/cards. */
  title: string
  /** Full <title> tag text. */
  seoTitle: string
  /** Meta description + card excerpt. */
  description: string
  /** One-line hook shown under the H1. */
  tagline: string
  heroGeneratorId: string
  heroSeed: number
  heroPalette: string[]
  heroBackground: string
  intro: string[]
  sections: GuideSection[]
  ctaLabel: string
}

export const GUIDES: Guide[] = [
  {
    slug: 'what-is-parametric-design',
    title: 'What is parametric design?',
    seoTitle: 'What Is Parametric Design? A Beginner’s Guide — Unruly',
    description:
      'Parametric design explained simply: instead of drawing a shape by hand, you define a small set of rules and numbers, and the computer draws the shape for you.',
    tagline: 'Rules in, infinite variation out.',
    heroGeneratorId: 'geometric-flower',
    heroSeed: 11,
    heroPalette: ['#ff6b4a', '#ff9f6e', '#ffd08a', '#7c3aed'],
    heroBackground: '#fff7ed',
    intro: [
      'Parametric design flips the usual process of making a picture. Instead of drawing a shape point by point, you write down a small set of rules — how many petals, how much randomness, how tightly things curve — and a program draws the shape for you, every time those rules run.',
      'Change one number and the whole design updates. That’s the entire idea: a design isn’t a fixed picture, it’s a formula with a picture as its output.',
    ],
    sections: [
      {
        heading: 'Why bother with rules instead of just drawing?',
        body: [
          'A hand-drawn pattern is fixed the moment you finish it — resizing, recoloring, or exploring "what if this were denser" means starting over. A parametric design is never finished in that sense; it’s a live relationship between inputs (parameters) and an output (the shape). Nudge the input, get a new, related output instantly.',
          'That makes parametric tools especially good at two things traditional drawing is bad at: exploring many variations quickly, and producing families of designs that share an underlying structure — a brand’s pattern library, a set of icons, a generative poster series.',
        ],
      },
      {
        heading: 'Where randomness fits in',
        body: [
          'Most parametric systems, Unruly included, add controlled randomness on top of the rules — a "seed" number that determines every random choice a generator makes. The rules stay fixed, but the seed picks which specific outcome you get, the same way a recipe gives a different-looking loaf each time even though the method never changes.',
          'This is what makes designs reproducible: the same generator, the same parameters, and the same seed always produce the exact same picture, pixel for pixel — see our guide on design seeds for the full picture.',
        ],
      },
      {
        heading: 'Try it yourself',
        body: [
          'The fastest way to understand parametric design is to move a slider and watch the shape respond in real time. Every generator in Unruly is a small parametric system: geometry, pattern density, color, and organic variation are all exposed as controls you can play with directly.',
        ],
      },
    ],
    ctaLabel: 'Play with a parametric flower',
  },
  {
    slug: 'svg-vs-png',
    title: 'SVG vs PNG: which should you use?',
    seoTitle: 'SVG vs PNG: Which Should You Use? — Unruly',
    description:
      'PNG is a fixed grid of pixels. SVG is a description you can resize, recolor, and edit without losing quality. Here’s when each one actually matters.',
    tagline: 'One is a photograph. The other is a set of instructions.',
    heroGeneratorId: 'hex-grid',
    heroSeed: 4,
    heroPalette: ['#d0021b', '#111111', '#f5f5f0'],
    heroBackground: '#ffffff',
    intro: [
      'A PNG is a grid of colored pixels, locked in at whatever size it was exported. An SVG (Scalable Vector Graphics) is a text description — points, curves, fills — that a browser or design tool redraws from scratch at any size. That one difference explains almost every practical tradeoff between them.',
    ],
    sections: [
      {
        heading: 'Quality at any size',
        body: [
          'Scale a PNG up and you get visible pixels or blur; the file simply doesn’t have more detail to give. Scale an SVG up and it’s recomputed from its underlying math, so a logo that’s crisp at 32px is exactly as crisp filling a billboard. This is the main reason logos, icons, and patterns that need to work across many sizes should be vector, not raster.',
        ],
      },
      {
        heading: 'Editability',
        body: [
          'A PNG is baked — to change a color you’re editing pixels, not intent. An SVG stays a live document: open one in Figma or Illustrator and every shape is still a separate, selectable, recolorable object. This is why "Copy to Figma" in Unruly pastes real editable vector layers, not a flattened image.',
        ],
      },
      {
        heading: 'When PNG still wins',
        body: [
          'Photographs and anything with continuous tone (soft shadows, photographic gradients, complex textures) are usually smaller and simpler as PNG or JPEG — vector math isn’t a good fit for millions of subtly different pixel values. Rule of thumb: if it was drawn or generated from shapes, ship it as SVG; if it was captured by a camera, ship it as a raster format.',
        ],
      },
    ],
    ctaLabel: 'Generate an SVG pattern',
  },
  {
    slug: 'svg-to-figma',
    title: 'How to get a generated SVG into Figma',
    seoTitle: 'How to Get a Generated SVG into Figma — Unruly',
    description:
      'Step-by-step: generate a design in Unruly, copy it, and paste real editable vector layers directly onto a Figma canvas.',
    tagline: 'From playground to production file in two clicks.',
    heroGeneratorId: 'stained-glass',
    heroSeed: 22,
    heroPalette: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#1a535c'],
    heroBackground: '#f7fff7',
    intro: [
      'Unruly designs are real SVG the whole way through, so getting one into Figma is just a copy and a paste — no export/import round trip, no re-tracing, no flattening.',
    ],
    sections: [
      {
        heading: 'The three-step version',
        body: [
          '1. Build a design in the Playground — pick a generator, tune it, shuffle until something clicks.',
          '2. Click "Copy to Figma" in the top bar. This copies the design’s real SVG markup to your clipboard, the same markup the canvas is already showing you.',
          '3. Switch to Figma and paste (⌘V / Ctrl+V) directly onto a canvas. Figma parses the SVG and creates real vector layers — one per shape, each independently selectable, recolorable, and editable.',
        ],
      },
      {
        heading: 'What you actually get',
        body: [
          'Because Unruly renders every design as semantic, layered SVG (one group per visual layer, one shape per element) rather than a single flattened path, what lands in Figma is a proper layer tree, not a single blob you have to break apart. You can delete individual dots from a dot field, recolor one ring of a mandala, or drag a single blob out of a composition.',
          'If you’d rather have a file on disk, the export menu also offers plain SVG, PNG, and WebP downloads — useful for anything that needs a file path instead of a clipboard paste (a CMS upload, an email attachment, a build pipeline).',
        ],
      },
      {
        heading: 'Keeping it reproducible',
        body: [
          'Every design is fully described by its generator, parameters, seed, and palette. Use "Copy shareable link" instead of (or alongside) "Copy to Figma" to hand a teammate a URL that reopens the exact same design, still fully editable in Unruly — handy when you want to hand off the source of truth, not just a static copy.',
        ],
      },
    ],
    ctaLabel: 'Make something to paste into Figma',
  },
  {
    slug: 'design-seeds-explained',
    title: 'Design seeds explained',
    seoTitle: 'Design Seeds Explained: Reproducible Randomness — Unruly',
    description:
      'Why the same generator, parameters, and seed always produce the exact same design — and why that’s what makes designs saveable, shareable, and undoable.',
    tagline: 'The number behind every "random" choice.',
    heroGeneratorId: 'spiral-galaxy',
    heroSeed: 7,
    heroPalette: ['#ff5f6d', '#ffc371', '#845ec2', '#2c2c54'],
    heroBackground: '#1b1035',
    intro: [
      'Every generator in Unruly makes dozens of small "random" decisions — exactly where each dot lands, how much a blob wobbles, which branch an L-system tree grows next. None of those decisions are actually random in the unpredictable sense. They all come from a single number: the seed.',
    ],
    sections: [
      {
        heading: 'A seed is a starting point, not a style',
        body: [
          'Internally, a seed feeds a deterministic pseudo-random number generator (PRNG) — an algorithm that produces a long sequence of values that look random but are entirely determined by where it started. Feed it the same seed twice and it produces the exact same sequence twice. That sequence is what a generator draws its "random" choices from, so the same seed with the same parameters always yields the same design, pixel for pixel.',
        ],
      },
      {
        heading: 'Why this matters more than it sounds like it should',
        body: [
          'Because a design is really just { generator, parameters, seed, palette }, that small tuple is enough to reconstruct the entire artwork from scratch, with nothing else stored. That’s what makes Undo/Redo cheap (each history step is a tiny tuple, not a rendered image), what makes a shareable link work without a backend (the tuple is encoded straight into the URL), and what makes a "Saved" design open up exactly as you left it a week later.',
          'It’s also what makes Randomize meaningfully different from Evolve: Randomize picks a fresh seed (and often a fresh generator), while Evolve nudges the current parameters slightly and rerolls the seed just enough to produce a related variation rather than something unrecognizable.',
        ],
      },
      {
        heading: 'Using seeds directly',
        body: [
          'Turn on Advanced controls in the right-hand panel and you’ll see the raw seed as an editable number, with a dice icon to reroll it. Typing in a specific seed is mostly useful for two things: deliberately returning to a design you remember the number for, or exploring a generator’s range by stepping through nearby seed values one at a time.',
        ],
      },
    ],
    ctaLabel: 'Reroll a seed yourself',
  },
  {
    slug: 'svg-pattern-generator',
    title: 'Free SVG pattern generator',
    seoTitle: 'Free SVG Pattern Generator — Unruly',
    description:
      'Generate seamless-feeling SVG patterns — dots, grids, waves, tessellations — tune them live, and export as editable vector layers. No sign-up, no watermark.',
    tagline: 'Dozens of pattern systems. Every parameter is yours to move.',
    heroGeneratorId: 'dot-field',
    heroSeed: 3,
    heroPalette: ['#ccff00', '#ff00aa', '#00e0ff', '#111111'],
    heroBackground: '#f5f5f0',
    intro: [
      'Unruly includes a wide range of pattern-focused generators — dot fields, grids, hex grids, checkerboards, tessellating tiles, weaving, moiré, op-art rings — each one a small parametric system rather than a single fixed pattern.',
      'Every pattern is real SVG from the moment it’s generated, so there’s no rasterization step to fight with later: what you tune on screen is exactly what you export or paste into Figma.',
    ],
    sections: [
      {
        heading: 'What makes it a "generator" instead of a template',
        body: [
          'A template gives you one pattern with a color picker. A generator gives you the underlying rules — spacing, density, jitter, scale variation, stroke weight, palette — as independent sliders, so the space of possible patterns from a single generator is enormous. Shuffle for a completely fresh take, or Evolve to nudge the current one toward a nearby variation.',
        ],
      },
      {
        heading: 'Built for real design work',
        body: [
          'Patterns export as layered, editable SVG — not a flattened raster — so a pattern meant for a website background, a poster, or a packaging repeat arrives in Figma as real shapes you can still adjust. Use the Compose tool to drop a pattern into a poster, social, or presentation layout with one of eight ready-made placement presets.',
        ],
      },
      {
        heading: 'No account needed',
        body: [
          'Everything runs in your browser — there’s no sign-up, no server round trip, and no watermark. Saved designs live in your browser’s local storage; shareable links encode the whole design in the URL itself.',
        ],
      },
    ],
    ctaLabel: 'Open the pattern generator',
  },
  {
    slug: 'generative-art-tool',
    title: 'Generative art generator',
    seoTitle: 'Generative Art Generator — Create Unique Art in Your Browser — Unruly',
    description:
      'A browser-based generative art tool: organic blobs, L-system trees, strange attractors, flow fields, and more — export as vector art, no coding required.',
    tagline: 'Algorithmic art, no code required.',
    heroGeneratorId: 'lsystem-forest',
    heroSeed: 9,
    heroPalette: ['#606c38', '#283618', '#dda15e', '#bc6c25'],
    heroBackground: '#fefae0',
    intro: [
      'Generative art is art made by an algorithm rather than a hand — a set of rules that produces the piece, often with controlled randomness woven in. Unruly puts that process behind sliders: organic blobs, L-system trees, strange attractors, particle constellations, flow fields, and dozens more systems, each one a real generative algorithm you can steer without writing a line of code.',
    ],
    sections: [
      {
        heading: 'Systems worth exploring',
        body: [
          'L-system trees grow branching structures from a small grammar of rules, the same underlying idea botanists use to model real plant growth. Strange attractors trace the long-term path of a chaotic system, producing the same hypnotic structures that show up in physics simulations. Flow fields push particles through an invisible vector field, the way iron filings trace a magnet’s field lines. Each is a genuine algorithm, not a filter.',
        ],
      },
      {
        heading: 'From experiment to finished piece',
        body: [
          'Lock the parameters you like (geometry, composition, texture, palette can each be locked independently) and Shuffle to explore everything else — a fast way to search a generator’s range without losing the part that’s already working. Stack multiple generators as composited layers with blend modes for more complex, painterly results, or add keyframes on the timeline to animate a design over time and export it as a GIF or MP4.',
        ],
      },
      {
        heading: 'Take it further',
        body: [
          'Every piece exports as real, editable vector art — SVG, PNG, or WebP — or copies straight into Figma as live layers, so a generative experiment can become a finished poster, print, or web asset without leaving the browser.',
        ],
      },
    ],
    ctaLabel: 'Grow something generative',
  },
  {
    slug: 'svg-background-generator',
    title: 'Free SVG background generator for websites',
    seoTitle: 'Free SVG Background Generator for Websites — Unruly',
    description:
      'Generate lightweight, infinitely scalable SVG backgrounds and hero graphics for websites — wave fields, gradients of shape, abstract textures — free, no watermark.',
    tagline: 'Backgrounds that stay sharp at any screen size, in a few kilobytes.',
    heroGeneratorId: 'waves',
    heroSeed: 15,
    heroPalette: ['#264653', '#2a9d8f', '#e9c46a'],
    heroBackground: '#f4f1ea',
    intro: [
      'A website background image is usually either a heavy JPEG that blurs on retina screens, or a hand-tuned CSS gradient with limited texture. An SVG background sits in between: genuinely scalable like a gradient, but with real shape and texture like an image — and typically a few kilobytes, since it’s math, not pixels.',
    ],
    sections: [
      {
        heading: 'Good candidates for hero and section backgrounds',
        body: [
          'Wave fields, flow lines, and force fields all make calm, directional backdrops that don’t compete with foreground text. Dot fields, halftone, and confetti work well as lighter, more playful section dividers. Topographic maps and height fields give a subtle, technical texture that reads well behind a dark overlay.',
        ],
      },
      {
        heading: 'Fitting it to a real layout',
        body: [
          'Use Compose to place a generated design into a web-hero-sized canvas, pick a fit mode (cover or contain), and reserve a text-safe zone so a headline sits on a legible, scrim-backed area rather than fighting the pattern underneath. Export as SVG for the smallest possible file and full scalability, or PNG/WebP if your CMS needs a raster asset.',
        ],
      },
      {
        heading: 'Keeping it on-brand',
        body: [
          'Lock the palette to your brand colors (or build a custom palette in the Palette Manager) while you shuffle the geometry — so every variation you try stays visually consistent with the rest of the site.',
        ],
      },
    ],
    ctaLabel: 'Generate a background',
  },
  {
    slug: 'vector-design-for-figma',
    title: 'A vector design tool that pastes straight into Figma',
    seoTitle: 'Vector Design Tool That Exports Straight to Figma — Unruly',
    description:
      'Generate parametric vector designs and paste them into Figma as real, editable layers — not a flattened image. Free, browser-based, no plugin required.',
    tagline: 'No plugin. No import dialog. Just paste.',
    heroGeneratorId: 'tile-morpher',
    heroSeed: 6,
    heroPalette: ['#e8e2d4', '#c9b896', '#8a6d4b', '#3f3226'],
    heroBackground: '#f7f4ec',
    intro: [
      'Most "generate an image" tools hand you a raster file you then have to re-trace or live-trace inside your design tool to get anything editable. Unruly skips that step entirely: every design is real SVG from the moment it’s generated, so pasting into Figma gives you the actual vector layers, ready to keep editing.',
    ],
    sections: [
      {
        heading: 'How the handoff works',
        body: [
          'Build and tune a design in the Playground, click "Copy to Figma," and paste directly onto a Figma canvas — no plugin install, no file import dialog. Figma reads the SVG and creates a proper layer tree: one group per visual layer, one shape per element, each independently selectable and recolorable.',
        ],
      },
      {
        heading: 'Why layer structure matters',
        body: [
          'A design that arrives as a single flattened path is barely more useful in Figma than a screenshot. Unruly renders every generator’s output as semantic, named layers on purpose, so what lands in your Figma file is something you can actually keep working with — hide one ring of a mandala, recolor a single blob, delete a handful of dots — the same editing model you’d expect from something drawn by hand.',
        ],
      },
      {
        heading: 'Beyond a single motif',
        body: [
          'Compose places a generated design into a full poster, social, or presentation canvas with real text layers and safe zones, so what you paste can be a finished layout, not just a raw pattern tile.',
        ],
      },
    ],
    ctaLabel: 'Design something for Figma',
  },
]

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
