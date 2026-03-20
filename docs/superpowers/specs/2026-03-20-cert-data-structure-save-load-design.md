# Certificate Data Structure & Save/Load — Design Spec

**Date:** 2026-03-20
**Branch:** components
**Status:** Approved for implementation

---

## Problem

Certificate content defaults are scattered across `config.js` (partial) and hardcoded strings inside `store.js` `init()`. There is no single authoritative data structure representing a complete certificate. localStorage uses per-field keys, making the state hard to serialize. There is no way to save a certificate to disk or restore one from a file.

---

## Goals

1. Introduce `DEFAULT_CERT_DATA` as the single source of default certificate state.
2. Add a `content` object to the Alpine store — in-memory canonical copy of all text fields.
3. Collapse localStorage to one JSON blob (`cert_state` key) minus the logo.
4. Add **Save Certificate** (download JSON) and **Load Certificate** (upload JSON) toolbar buttons.

---

## Data Structure

`DEFAULT_CERT_DATA` exported from `js/config.js`. The `body` field stores the raw markup string (using `*asterisks*` for italic emphasis — the same format as the existing `DEFAULT_BODY`). The existing `DEFAULT_BODY` and `DEFAULT_SIGS` exports are removed; their values move into `DEFAULT_CERT_DATA`.

```js
export const DEFAULT_CERT_DATA = {
  content: {
    title:       'Certificate of Recognition',
    orgName:     'Springfield Volunteer Fire Department',
    recipient:   'Jimmy Smith',
    body:        /* copy exact string from current DEFAULT_BODY */,
    presentedBy: 'Presented by the Volunteer Fire Department',
    date:        'March 18, 2026',
    sigs: [
      { name: 'Name', title: 'Title, Springfield VFD' },
      { name: 'Name', title: 'Title, Springfield VFD' },
    ],
    logoName:    'vfd_logo.png',
  },
  format: {
    fontScale:     1,
    spacingScale:  1,
    borderMargin:  63,
    fontPairIndex: 0,
    paletteIndex:  0,
    cardStock:     '#FDFAF2',
    sizeMode:      '85x11',
  },
};
```

`logoName` is descriptive only — stored for human readability when editing the JSON file, but never used by the application to load an image.

---

## Alpine Store Changes (`js/store.js`)

### New `content` property

The store gains a `content` property mirroring `DEFAULT_CERT_DATA.content`. The existing `sigData` top-level property is **removed**; all references (`addSig`, `removeSig`, `renderSigs` calls, the focusout handler) are updated to use `store.cert.content.sigs` instead.

All format fields (`fontScale`, `spacingScale`, `borderMargin`, `fontPairIndex`, `paletteIndex`, `cardStock`, `sizeMode`) remain as top-level store properties — no change to their getter/setter logic or CSS application.

### `persistState()` — zero-argument store method

A new `persistState()` method is added to the Alpine store. It reads `this.content` and all format fields from `this`, builds the two-section object, and calls `storage.persistState(blob)`. All individual `save()` call sites are replaced with `this.persistState()`.

```js
persistState() {
  storage.persistState({
    content: this.content,
    format: {
      fontScale:     this.fontScale,
      spacingScale:  this.spacingScale,
      borderMargin:  this.borderMargin,
      fontPairIndex: this.fontPairIndex,
      paletteIndex:  this.paletteIndex,
      cardStock:     this.cardStock,
      sizeMode:      this.sizeMode,
    },
  });
},
```

### Initialization priority (no migration)

1. Call `storage.loadState()`.
2. If a valid blob is returned (has both `content` and `format` keys), use it to populate the store and DOM.
3. Otherwise fall back to `DEFAULT_CERT_DATA`.
4. Apply DOM, CSS vars, fonts, size mode, and sigs exactly as today.

Old per-field localStorage keys are ignored on load. No migration.

### `addSig` / `removeSig`

Both methods update `this.content.sigs` (was `this.sigData`) and call `renderSigs(this.content.sigs)` followed by `this.persistState()`.

---

## Storage Changes (`js/storage.js`)

Two new functions added. The new blob uses the key `cert_state` (not following the existing `cert_default_<field>` pattern — the new key is intentionally shorter since it holds the entire state).

```js
// Saves the full { content, format } blob
export function persistState(blob) {
  try { localStorage.setItem('cert_state', JSON.stringify(blob)); } catch(e) {}
}

// Returns parsed { content, format } or null
export function loadState() {
  try {
    const v = localStorage.getItem('cert_state');
    if (!v) return null;
    const parsed = JSON.parse(v);
    if (!parsed.content || !parsed.format) return null;
    return parsed;
  } catch(e) { return null; }
}
```

The existing `save` and `load` helper functions are retained for the logo key only (`cert_default_logo`). All other call sites for `save`/`load` are removed.

---

## Blur Handler Changes (inline script in `index.html`)

The five `[selector, key]` blur listeners currently call `save(key, this.textContent.trim())`. They are replaced with writes to the store followed by `persistState()`:

```js
// example for .doc-title
document.querySelector('.doc-title').addEventListener('blur', function() {
  Alpine.store('cert').content.title = this.textContent.trim();
  Alpine.store('cert').persistState();
});
```

The sig focusout handler updates `Alpine.store('cert').content.sigs` (was `store.sigData`) then calls `store.persistState()`.

Format setter methods (`setFontScale`, `setSpacing`, `setBorderMargin`, `setPalette`, `setFontPair`, `setSizeMode`, `setCardStock`) replace their individual `save()` calls with `this.persistState()`.

**`setPalette` note:** `setPalette(i)` sets both `this.paletteIndex` and `this.cardStock` to `PALETTES[i].cream`, then calls `this.persistState()`. Both `paletteIndex` and `cardStock` are stored independently in the format blob so that a custom card stock color (set via `setCardStock`) is preserved. When loading from file, `format.cardStock` is applied **after** `format.paletteIndex` so that a custom card stock is not overwritten by the palette default.

---

## Body Field: Raw Markup vs HTML

The `content.body` field always stores the **raw markup string** (asterisk syntax). It is never stored as HTML.

- On `init()` and on Load Certificate, the body is rendered to the DOM via `toHTML(content.body)` assigned to `.body-text.innerHTML`.
- `body-text.js` must not import Alpine or the store directly. Instead, `initBodyText` gains a second parameter — an `onBodyChange(raw)` callback. The blur handler calls `onBodyChange(raw)` instead of `save('body_raw', raw)`.
- The caller in `index.html` passes the callback: `raw => { Alpine.store('cert').content.body = raw; Alpine.store('cert').persistState(); }`.
- The `import { save }` in `body-text.js` is removed.

---

## Signature Counter Display

`renderSigs(data)` in `js/cert-render.js` already updates `#sig-count`, disables `#sig-remove` when count ≤ 1, and disables `#sig-add` when count ≥ 3. Migrating `sigData` → `content.sigs` and calling `renderSigs(this.content.sigs)` in `addSig`/`removeSig` is sufficient — no additional counter update logic is needed.

---

## Save Certificate (download)

`saveCertToFile()` method on the Alpine store:

1. Build the blob from `this.content` and the format fields (same shape as `persistState`).
2. JSON-stringify with 2-space indent.
3. Create a Blob, generate an object URL, **create a temporary `<a>` element dynamically** (not pre-existing in HTML), set `href` and `download="certificate.json"`, append to body, click, remove, revoke URL.

Wired to the **Save Certificate** toolbar button via a click listener in the inline script.

---

## Load Certificate (upload)

A hidden `<input type="file" accept=".json" id="load-cert-input">` is added to `index.html` (outside the certificate markup).

**Load Certificate** toolbar button triggers `.click()` on this input.

On file selection:
1. Read file as text, parse JSON.
2. Validate: must have both `content` and `format` keys. For any missing sub-field within `content` or `format`, fall back to the corresponding value from `DEFAULT_CERT_DATA` (merge with defaults, don't abort on partial files).
3. Apply format: call `applyMode(store, format.sizeMode)`, `applyFontPair(FONT_PAIRS[format.fontPairIndex])`, `applyCSSVars(store)` after writing format fields to the store. Apply `format.cardStock` **after** `format.paletteIndex` so custom card stock is not overwritten.
4. Write content fields to the DOM:
   - Text fields (title, orgName, recipient, presentedBy, date): `element.textContent = value`
   - Body: `element.innerHTML = toHTML(content.body)` — **must go through `toHTML()`**
   - Sigs: `store.cert.content.sigs = content.sigs; renderSigs(content.sigs)`
5. Update `store.cert.content` with the merged content object.
6. Call `store.cert.persistState()` to sync localStorage.
7. Logo is untouched — current displayed logo remains as-is.

---

## Toolbar UI

Two buttons added between the **Format** button and the **Print Certificate** button:

- **Save Certificate** — secondary button style (sibling of `.print-btn`)
- **Load Certificate** — secondary button style

No new CSS files required. If visual differentiation between Save/Load and Print is desired, a `.secondary-btn` class can be added to `css/toolbar.css`.

---

## Files Changed

| File | Change |
|---|---|
| `js/config.js` | Add `DEFAULT_CERT_DATA` (body copied from `DEFAULT_BODY`); remove `DEFAULT_BODY`, `DEFAULT_SIGS` exports |
| `js/storage.js` | Add `persistState(blob)`, `loadState()`; retain `save`/`load` for logo key only |
| `js/store.js` | Add `content` to store; remove `sigData`, update all references to `content.sigs`; replace individual `save()` calls with `this.persistState()`; add `persistState()` method; add `saveCertToFile()` method; update `init()` to use `loadState()` → `DEFAULT_CERT_DATA` |
| `js/body-text.js` | Add `onBodyChange` callback param to `initBodyText`; call it on blur instead of `save()`; remove `save` import |
| `index.html` | Add Save/Load toolbar buttons; add hidden `<input type="file" id="load-cert-input">`; update blur handlers to write to store + call `persistState()` |

No new files. No build step changes.

---

## Out of Scope

- Multiple named certificate slots
- Auto-export on change
- Logo included in save file
- Migration of existing localStorage per-field keys
