# Certificate Generator

A single-file HTML certificate of recognition for the Springfield Volunteer Fire Department. No build tools, no server, no dependencies beyond Google Fonts.

## Usage

1. Place `index.html` and `vfd_logo.png` in the same folder.
2. Open `index.html` in Chrome or Edge.
3. Edit any field directly on the certificate — all text is click-to-edit.
4. Adjust card stock color and number of signatures using the toolbar.
5. Print when ready.

All edits are saved automatically to `localStorage` and restored on next open.

## Editing the Certificate

| Field | How to edit |
|---|---|
| Recipient name | Click the name and type |
| Body text | Click the paragraph; wrap words in `*asterisks*` for italic emphasis |
| Org name, title, date, signatures | Click any field and type |
| Logo | Hover the logo and click **Change Logo** to upload a file |

## Printing

**Chrome or Edge recommended.**

1. Click **Print Certificate** in the toolbar (or Ctrl+P).
2. In the print dialog: **More settings** → uncheck **Headers and footers** → Margins: **None**.
3. Print onto cream/ivory card stock.

Target size: **8.5" × 11"**, full page, no margin.

## Files

| File | Purpose |
|---|---|
| `index.html` | Entire application — certificate, toolbar, styles, and logic |
| `vfd_logo.png` | Department logo displayed at the top of the certificate |

## Design Notes

- Colors and fonts are defined as CSS variables in `:root` at the top of the `<style>` block.
- Primary accent: crimson `#8B0000` / secondary: gold `#B8953A` / background: cream `#FDFAF2`.
- Fonts: **Cinzel** (headings) + **EB Garamond** (body), loaded from Google Fonts CDN.
- The parchment texture is a pure-CSS SVG `feTurbulence` filter — it is suppressed automatically on print.
