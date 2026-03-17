# Certificate Generator

A single-file HTML certificate of recognition for the Springfield Volunteer Fire Department. No build tools, no server, no dependencies beyond Google Fonts.

## Usage

1. Place `index.html` and `vfd_logo.png` in the same folder.
2. Open `index.html` in Chrome or Edge.
3. Edit any field directly on the certificate — all text is click-to-edit.
4. Adjust card stock color, number of signatures, and print size using the toolbar.
5. Print when ready.

All edits are saved automatically to `localStorage` and restored on next open.

## Editing the Certificate

| Field | How to edit |
|---|---|
| Recipient name | Click the name and type |
| Body text | Click the paragraph; wrap words in `*asterisks*` for italic emphasis |
| Org name, title, date, signatures | Click any field and type |
| Logo | Hover the logo and click **Change Logo** to upload a file |

## Print Sizes

Use the **Print Size** toggle in the toolbar to choose between two modes:

| Mode | Output | Intended use |
|---|---|---|
| **8.5 × 11** | Fills the full page, no margin | Frameless or trim-to-edge |
| **8 × 10** | Centered on 8.5×11 paper (0.25in sides, 0.5in top/bottom) | Standard mat-framed presentation |

The selected size is saved and restored automatically.

## Printing

**Chrome or Edge recommended.**

1. Select the desired print size in the toolbar.
2. Click **Print Certificate** (or Ctrl+P).
3. In the print dialog: **More settings** → uncheck **Headers and footers** → Margins: **None**.
4. Print onto cream/ivory card stock.

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
