# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file HTML certificate of recognition for Jimmy Smith of the Springfield Volunteer Fire Department. Presentation date: **March 18, 2026**. Print target: **8.5" × 11"** (full-page) or **8" × 10"** (centered on 8.5×11 for mat framing), selectable via toolbar toggle.

**Deliverables:** `index.html` + `css/` + `js/` — no build step, no dependencies except Google Fonts CDN and Alpine.js CDN.

## Viewing & Printing

Open `index.html` directly in a browser. No server required.

**To print:** Select print size in toolbar → Chrome or Edge → Ctrl+P → More Settings → uncheck Headers and Footers → Margins: **None** → Print.

## Design System

All colors are CSS variables in `:root`:
- `--crimson: #8B0000` — primary accent (fire department identity)
- `--gold: #B8953A` — secondary accent (prestige)
- `--cream: #FDFAF2` — background (parchment feel)
- `--ink: #1A1A1A` — primary text

Fonts: **Cinzel** (display/headings, weights 400/600/700) + **EB Garamond** (body, regular + italic).

## Architecture

- Layout: `position: absolute` inside fixed `.cert` container — screen dimensions driven by `--w`/`--h` CSS variables set by JS
- Two size modes in `SIZE_MODES` (`js/config.js`): `85x11` (816×1056px) and `8x10` (768×960px); `applyMode()` in `js/store.js` handles CSS/scaling; `setSizeMode()` adds persistence
- **CSS variables:** All design tokens in `css/base.css` `:root`. Format panel sliders write `--font-scale`, `--spacing-scale`, `--border-margin` directly via `applyCSSVars()` in `js/cert-render.js`; derived `--fs-*` and `--mb-*` tokens update via `calc()` automatically
- **Alpine.js v3** (CDN): `Alpine.store('cert')` in `js/store.js` is the single source of truth for all state — format settings, toolbar controls, signatures, panel open state
- **File structure:** `css/` (base, cert, toolbar, panel, print) + `js/` (config, storage, cert-render, body-text, store)
- **Format panel:** Always-visible 240px right rail on desktop (≥769px); bottom sheet toggled by Format button on mobile (<769px). `scaleCert()` in `js/cert-render.js` subtracts panel width on desktop.
- **Color palettes** and **font pairs** defined in `js/config.js`. All 5 font pairs loaded upfront from Google Fonts to avoid FOUT on font swap.
- `@media print` static block in `css/print.css`; `@page` and cert print dimensions written dynamically to `<style id="print-size">` by `applyMode()` on each toggle
- `print-color-adjust: exact` applied to borders and corners for color-critical print rendering
- Parchment texture: inline SVG `feTurbulence` data URIs — renders on screen, stripped on print via `background-image: none !important`
- No external images (except optional `vfd_logo.png`). No build step. Works on GitHub Pages via ES modules served over HTTP.

## Logo

The logo is loaded from `vfd_logo.png` (place the file alongside `index.html`). It can also be swapped at runtime via the in-browser upload overlay (hover the logo and click "Change Logo"). The logo image is described as mostly circular with some elements extending horizontally past the circle edge. Adjust `margin-bottom` on `.cross-wrap` if the logo needs more breathing room.

## Pending Items

- [ ] Confirm body text is approved by presenting firefighters
- [ ] Test print on cream card stock — verify crimson and gold render correctly
