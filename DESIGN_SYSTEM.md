# OpenBacklog Design System

Base design system for `openbacklog.app`, extracted from Stitch:

- Name: `Ghost in the Machine`
- Asset: `assets/c32667b6dc604eb780304cb4567450b5`
- Source JSON: [`docs/design-systems/ghost-in-the-machine.json`](./docs/design-systems/ghost-in-the-machine.json)

## Creative Direction

North star: **Terminal Industrialism** (`The Kinetic Console`).

Design intent:

- Hard-edged UI (no soft rounded look).
- Strong tonal layering instead of visible separators.
- Functional, high-contrast, data-first presentation.
- Gaming backlog experience with premium "control panel" tone.

## Typography

- Headline font: `Manrope`
- Body/Label font: `Space Grotesk`

Usage baseline:

- Headlines and key hierarchy in `Manrope`.
- Interface and dense information in `Space Grotesk`.

## Core Theme Tokens

- `colorMode`: `DARK`
- `customColor`: `#8bac0f`
- `primary`: `#b1d43d`
- `primary_container`: `#8bac0f`
- `secondary`: `#9dd496`
- `secondary_container`: `#1f5121`
- `surface`: `#131313`
- `surface_container_low`: `#1c1b1b`
- `surface_container`: `#201f1f`
- `surface_container_high`: `#2a2a2a`
- `surface_container_highest`: `#353534`
- `outline_variant`: `#454936`
- `on_surface`: `#e5e2e1`
- `on_surface_variant`: `#c5c9b1`

## Rules to Preserve in Implementation

1. Avoid classic 1px section dividers as primary separation method.
2. Build depth with `surface_*` token steps.
3. Keep corners neutral/sharp; avoid friendly pill-heavy visuals by default.
4. Use monochromatic green accents for priority and interaction emphasis.
5. Prefer compact, technical composition over decorative UI.

## Initial CSS Variable Mapping (Web)

Defined in [`src/app/globals.css`](./src/app/globals.css):

- `--ob-surface`
- `--ob-surface-container-low`
- `--ob-surface-container`
- `--ob-surface-container-high`
- `--ob-surface-card`
- `--ob-outline`
- `--ob-primary`
- `--ob-on-primary`
- `--ob-on-surface`
- `--ob-on-surface-muted`

## Open Decisions

1. Degree of strictness for "no border radius" in public marketing pages.
2. Whether to define component-level tokens now (`button.primary`, `tag.playing`, etc.) or after first real UI flows.
3. Motion style baseline for hover/transition behavior in backlog cards.

## Landing Navigation Pattern

- Shared top navigation lives in `src/components/landing/header.tsx`.
- Header arrangement:
  - Left: wordmark/title.
  - Center: section anchors for landing navigation.
  - Right: register CTA, GitHub link with stars, and locale dropdown (`shadcn` `dropdown-menu`).
