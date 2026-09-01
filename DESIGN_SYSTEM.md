# Design System

## Tokens

Theme tokens are CSS custom properties on `:root` / `.dark`, consumed via Tailwind's `@theme` mapping so
components use semantic classes (`bg-surface`, `text-muted`, `border-border`) instead of raw colors.

```
--color-bg               page background
--color-surface          workspace surface
--color-surface-elevated floating controls / cards
--color-canvas           canvas surface (distinct from workspace)
--color-border
--color-text
--color-text-muted
--color-accent
--color-accent-foreground
--color-accent-text
--color-control-bg
--color-control-hover
```

Light mode: warm off-white surfaces (not pure white), restrained shadows, high contrast text.
Dark mode: charcoal (not pure black), slightly lighter elevated surfaces, restrained glow.

## Accent color (royal blue)

`--accent` is `#3355dd` in light mode, `#3d5ce0` in dark — a royal blue deep enough that white
`--accent-foreground` text on a filled accent surface (buttons, active toggles) clears WCAG AA's 4.5:1 for
normal text in both themes (verified: 6.03:1 light, 5.51:1 dark).

That same depth is, by construction, too dark to itself work as small *text* directly on the page background
in dark mode — the two constraints (accent dark enough for white text on it; accent light enough to read as
text on a near-black page) don't overlap for a single hue at AA. `--accent-text` is a separate token for that
one case: identical to `--accent` in light mode (already clears 4.5:1 as text there — no divergence needed),
but a lighter tint (`#7c93ff`) in dark mode, clearing 6.69:1 as text on `--bg`. Use `text-accent-text` for
small accent-colored text sitting directly on a page/surface background (e.g. the "Manage" palette link);
`bg-accent` + `text-accent-foreground` for filled buttons and toggles as always. Large accent-colored text
(≥24px, or ≥19px bold) only needs 3:1 and can use `text-accent` directly — the Home hero headline does this.

**Generated artwork colors are independent of the app theme** — a palette applied to a design does not
re-derive from light/dark mode.

## Typography

Inter, loaded via Google Fonts with system-ui fallback stack. Editorial-weight headings, compact control
labels, generous line-height in body copy.

## Components (`components/ui/`)

Button, IconButton, Tooltip, Slider, Toggle, SegmentedControl, ColorSwatch, ColorPicker, Dropdown, Tabs,
Drawer/BottomSheet, Modal, Toast, Card. Built once, reused everywhere — no ad-hoc styled elements in feature
code.

## Motion

150-250ms for UI transitions, 300-600ms for creative/canvas transitions. All motion respects
`prefers-reduced-motion` via a shared `useReducedMotion` hook / CSS media guard.
