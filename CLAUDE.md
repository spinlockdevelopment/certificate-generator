# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file HTML certificate of recognition for Jimmy Smith of the Springfield Volunteer Fire Department. Presentation date: **March 18, 2026**. Print target: **8.5" × 11"** full-page, no margins, on cream/ivory card stock.

**Single deliverable:** `index.html` — no build system, no dependencies except Google Fonts CDN.

## Viewing & Printing

Open `index.html` directly in a browser. No server required.

**To print:** Chrome or Edge → Ctrl+P → More Settings → uncheck Headers and Footers → Margins: **None** → Print.

## Design System

All colors are CSS variables in `:root`:
- `--crimson: #8B0000` — primary accent (fire department identity)
- `--gold: #B8953A` — secondary accent (prestige)
- `--cream: #FDFAF2` — background (parchment feel)
- `--ink: #1A1A1A` — primary text

Fonts: **Cinzel** (display/headings, weights 400/600/700) + **EB Garamond** (body, regular + italic).

## Architecture

- Layout: `position: absolute` inside fixed `.cert` container (`816px × 1056px` on screen, `8.5in × 11in` on print)
- Parchment texture: inline SVG `feTurbulence` data URIs — renders on screen, stripped on print via `background-image: none !important`
- `@media print` block handles all print overrides including `@page` size/margins and `print-color-adjust: exact` for color-critical elements
- No JavaScript. No external images. No frameworks.

## Logo

The logo is loaded from `vfd_logo.png` (place the file alongside `index.html`). It can also be swapped at runtime via the in-browser upload overlay (hover the logo and click "Change Logo"). The logo image is described as mostly circular with some elements extending horizontally past the circle edge. Adjust `margin-bottom` on `.cross-wrap` if the logo needs more breathing room.

## Pending Items

- [ ] Confirm body text is approved by presenting firefighters
- [ ] Test print on cream card stock — verify crimson and gold render correctly
