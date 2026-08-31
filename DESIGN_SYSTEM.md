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
--color-control-bg
--color-control-hover
```

Light mode: warm off-white surfaces (not pure white), restrained shadows, high contrast text.
Dark mode: charcoal (not pure black), slightly lighter elevated surfaces, restrained glow.

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
