# Certificate Data Structure & Save/Load Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor certificate content into a `DEFAULT_CERT_DATA` structure, give the Alpine store a canonical `content` object, collapse localStorage to one blob, and add Save/Load toolbar buttons.

**Architecture:** `DEFAULT_CERT_DATA` in `config.js` is the authoritative default. On init, the Alpine store reads a single `cert_state` blob from localStorage (or falls back to defaults), populates `store.cert.content` plus all format fields, and renders the DOM from those values. Save downloads the in-memory state as JSON; Load parses a JSON file and calls a `loadFromData()` store method that re-renders everything.

**Tech Stack:** Vanilla ES modules, Alpine.js v3 CDN, no build step, no test framework — verification is manual in-browser.

---

## File Map

| File | What changes |
|---|---|
| `js/config.js` | Replace `DEFAULT_BODY` + `DEFAULT_SIGS` with `DEFAULT_CERT_DATA` |
| `js/storage.js` | Add `persistState(blob)` + `loadState()`; keep `save`/`load` for logo only |
| `js/store.js` | Add `content`, `persistState()`, `saveCertToFile()`, `loadFromData()`; remove `sigData`; update `init()` and all setters |
| `js/body-text.js` | Add `onBodyChange` callback param; remove `save` import |
| `index.html` | Update toolbar (buttons + hidden input); update blur handlers; update `initBodyText` call |
| `css/toolbar.css` | Add `.action-btn` style for Save/Load buttons |

---

## Task 1: Replace `DEFAULT_BODY`/`DEFAULT_SIGS` with `DEFAULT_CERT_DATA` in `config.js`

**Files:**
- Modify: `js/config.js`

- [ ] **Step 1: Replace exports**

Open `js/config.js`. Remove the `DEFAULT_BODY` and `DEFAULT_SIGS` exports entirely. Add `DEFAULT_CERT_DATA` after the `PALETTES` constant, copying the exact `DEFAULT_BODY` string into the `body` field:

```js
export const DEFAULT_CERT_DATA = {
  content: {
    title:       'Certificate of Recognition',
    orgName:     'Springfield Volunteer Fire Department',
    recipient:   'Jimmy Smith',
    body:
      'In recognition of *exceptional service* and outstanding contributions to the community. ' +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ' +
      'ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco ' +
      'laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in ' +
      'voluptate velit esse cillum dolore eu fugiat nulla pariatur. *Excepteur sint occaecat* ' +
      'cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
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

- [ ] **Step 2: Verify no other exports remain**

The final `js/config.js` should export exactly: `SIZE_MODES`, `FONT_PAIRS`, `PALETTES`, `DEFAULT_CERT_DATA`. Confirm `DEFAULT_BODY` and `DEFAULT_SIGS` are gone.

> **Note:** The existing `DEFAULT_SIGS` had placeholder names `Clark Kent / Peter Parker`. The new `DEFAULT_CERT_DATA.sigs` uses generic `Name / Title, Springfield VFD`. This is an intentional default value change — existing users who have saved their own sig names in `cert_state` are unaffected.

- [ ] **Step 3: Commit**

```bash
git add js/config.js
git commit -m "refactor: replace DEFAULT_BODY/DEFAULT_SIGS with DEFAULT_CERT_DATA"
```

---

## Task 2: Add `persistState` and `loadState` to `storage.js`

**Files:**
- Modify: `js/storage.js`

- [ ] **Step 1: Add the two new functions**

Append to the bottom of `js/storage.js`:

```js
export function persistState(blob) {
  try { localStorage.setItem('cert_state', JSON.stringify(blob)); } catch(e) {}
}

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

The existing `save` and `load` functions are unchanged — they are still used for the logo key.

- [ ] **Step 2: Commit**

```bash
git add js/storage.js
git commit -m "feat: add persistState/loadState to storage"
```

---

## Task 3: Rewrite `store.js`

**Files:**
- Modify: `js/store.js`

This is the largest task. The full replacement for `js/store.js` is below.

Key changes from the current version:
- Import `DEFAULT_CERT_DATA` from config (remove `DEFAULT_BODY`, `DEFAULT_SIGS`)
- Import `persistState as storagePersist, loadState` from storage (remove individual `save`/`load` for format fields)
- Remove `sigData`; use `content.sigs` throughout
- Add `persistState()` method on the store (zero-arg, builds blob from `this`)
- Add `saveCertToFile()` method
- Add `loadFromData(data)` method (used by Load Certificate)
- `init()` reads from `loadState()` or `DEFAULT_CERT_DATA`; removes all per-field `load()` calls for text content
- All format setters replace `save(key, val)` with `this.persistState()`
- Remove `getTodayDate()` (date is now in `DEFAULT_CERT_DATA`)

- [ ] **Step 1: Write the new `store.js`**

```js
// js/store.js
import { SIZE_MODES, FONT_PAIRS, PALETTES, DEFAULT_CERT_DATA } from './config.js';
import { save, load, persistState as storagePersist, loadState } from './storage.js';
import { applyCSSVars, applyFontPair, scaleCert, adjustSpacing, renderSigs } from './cert-render.js';
import { toHTML } from './body-text.js';

function applyMode(store, mode) {
  store.sizeMode = mode;
  const m = SIZE_MODES[mode];
  document.documentElement.style.setProperty('--w', m.w + 'px');
  document.documentElement.style.setProperty('--h', m.h + 'px');
  document.getElementById('print-size').textContent =
    '@page { size: 8.5in 11in; margin: ' + m.pageMargin + '; }\n' +
    '@media print {\n' +
    '  .cert-outer { width: ' + m.certW + ' !important; height: ' + m.certH + ' !important; }\n' +
    '  .cert        { width: ' + m.certW + ' !important; height: ' + m.certH + ' !important; }\n' +
    '}';
  scaleCert(mode);
  adjustSpacing();
  document.querySelectorAll('.size-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.size === mode);
  });
}

export function initStore() {
  Alpine.store('cert', {
    // ── Format state (top-level, unchanged by this refactor) ──
    fontScale:     DEFAULT_CERT_DATA.format.fontScale,
    spacingScale:  DEFAULT_CERT_DATA.format.spacingScale,
    borderMargin:  DEFAULT_CERT_DATA.format.borderMargin,
    fontPairIndex: DEFAULT_CERT_DATA.format.fontPairIndex,
    paletteIndex:  DEFAULT_CERT_DATA.format.paletteIndex,
    sizeMode:      DEFAULT_CERT_DATA.format.sizeMode,
    cardStock:     DEFAULT_CERT_DATA.format.cardStock,

    // ── Content state (canonical in-memory copy of all text fields) ──
    content: { ...DEFAULT_CERT_DATA.content, sigs: [...DEFAULT_CERT_DATA.content.sigs] },

    // ── UI state ──
    panelOpen: false,

    // ── Config arrays for Alpine x-for template loops ──
    fontPairs: FONT_PAIRS,
    palettes:  PALETTES,

    // ── Persist entire state to one localStorage blob ──
    persistState() {
      storagePersist({
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

    // ── Save current state to a .json file ──
    saveCertToFile() {
      const json = JSON.stringify({
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
      }, null, 2);
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificate.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    // ── Load state from a parsed JSON object (from file upload) ──
    loadFromData(data) {
      const c = { ...DEFAULT_CERT_DATA.content, ...data.content };
      const f = { ...DEFAULT_CERT_DATA.format,  ...data.format  };

      // Apply format fields — paletteIndex before cardStock (spec requirement)
      this.fontScale     = +f.fontScale;
      this.spacingScale  = +f.spacingScale;
      this.borderMargin  = +f.borderMargin;
      this.fontPairIndex = +f.fontPairIndex;
      this.paletteIndex  = +f.paletteIndex;
      this.sizeMode      = f.sizeMode;
      this.cardStock     = f.cardStock;

      applyCSSVars(this);
      applyFontPair(FONT_PAIRS[this.fontPairIndex]);
      applyMode(this, this.sizeMode);

      // Update content
      this.content = c;

      // Populate DOM
      document.querySelector('.doc-title').textContent      = c.title;
      document.querySelector('.recipient-name').textContent = c.recipient;
      document.querySelector('.org-name').textContent       = c.orgName;
      document.querySelector('.presented-by').textContent   = c.presentedBy;
      document.querySelector('.cert-date').textContent      = c.date;
      document.querySelector('.body-text').innerHTML        = toHTML(c.body);
      renderSigs(c.sigs);

      // Sync toolbar active states
      document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.size === this.sizeMode);
      });
      document.querySelectorAll('.color-btn[data-bg]').forEach(b => {
        b.classList.toggle('active', b.dataset.bg === this.cardStock);
      });

      this.persistState();
    },

    // ── Format panel methods ──
    setFontScale(v)    { this.fontScale = +v;    applyCSSVars(this); adjustSpacing(); this.persistState(); },
    setSpacing(v)      { this.spacingScale = +v; applyCSSVars(this); adjustSpacing(); this.persistState(); },
    setBorderMargin(v) { this.borderMargin = +v; applyCSSVars(this); adjustSpacing(); this.persistState(); },

    setPalette(i) {
      this.paletteIndex = +i;
      this.cardStock = PALETTES[i].cream;
      applyCSSVars(this);
      this.persistState();
      document.querySelectorAll('.color-btn[data-bg]').forEach(b => {
        b.classList.toggle('active', b.dataset.bg === this.cardStock);
      });
    },

    setFontPair(i) {
      this.fontPairIndex = +i;
      applyFontPair(FONT_PAIRS[i]);
      this.persistState();
    },

    setSizeMode(mode) { applyMode(this, mode); this.persistState(); },

    setCardStock(color) {
      this.cardStock = color;
      applyCSSVars(this);
      this.persistState();
    },

    togglePanel() { this.panelOpen = !this.panelOpen; },

    addSig() {
      if (this.content.sigs.length >= 3) return;
      this.content.sigs = [...this.content.sigs, { name: 'Name', title: 'Title, Springfield VFD' }];
      renderSigs(this.content.sigs);
      this.persistState();
    },

    removeSig() {
      if (this.content.sigs.length <= 1) return;
      this.content.sigs = this.content.sigs.slice(0, -1);
      renderSigs(this.content.sigs);
      this.persistState();
    },

    init() {
      const saved = loadState();
      if (saved) {
        // Merge saved state over defaults (handles partial files)
        this.content = { ...DEFAULT_CERT_DATA.content, ...saved.content };
        const f = { ...DEFAULT_CERT_DATA.format, ...saved.format };
        this.fontScale     = +f.fontScale;
        this.spacingScale  = +f.spacingScale;
        this.borderMargin  = +f.borderMargin;
        this.fontPairIndex = +f.fontPairIndex;
        this.paletteIndex  = +f.paletteIndex;
        this.sizeMode      = f.sizeMode;
        this.cardStock     = f.cardStock;
      }

      // Apply CSS and layout
      applyCSSVars(this);
      applyFontPair(FONT_PAIRS[this.fontPairIndex]);
      applyMode(this, this.sizeMode);

      // Populate DOM from content
      document.querySelector('.doc-title').textContent      = this.content.title;
      document.querySelector('.recipient-name').textContent = this.content.recipient;
      document.querySelector('.org-name').textContent       = this.content.orgName;
      document.querySelector('.presented-by').textContent   = this.content.presentedBy;
      document.querySelector('.cert-date').textContent      = this.content.date;
      document.querySelector('.body-text').innerHTML        = toHTML(this.content.body);
      renderSigs(this.content.sigs);

      // Logo (kept separate from cert_state)
      const savedLogo = load('logo');
      if (savedLogo) document.getElementById('logo-img').src = savedLogo;

      // Sync toolbar button active states
      document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.size === this.sizeMode);
      });
      document.querySelectorAll('.color-btn[data-bg]').forEach(b => {
        b.classList.toggle('active', b.dataset.bg === this.cardStock);
      });
    },
  });
}
```

- [ ] **Step 2: Open browser and verify**

Open `index.html` directly. Check the browser console (F12):
- No JS errors on load
- Certificate displays with Jimmy Smith, correct org name, body text, date March 18 2026
- Two signature blocks visible
- Changing font scale / palette / font pair still works
- Adding/removing a signature still works and the counter updates

- [ ] **Step 3: Verify localStorage**

In DevTools > Application > Local Storage:
- A `cert_state` key should appear after making any edit (e.g. click a font pair)
- Its value should be valid JSON with `content` and `format` sections
- Old per-field keys (`cert_default_title` etc.) are ignored if present

- [ ] **Step 4: Commit**

```bash
git add js/store.js
git commit -m "refactor: add content object and persistState to Alpine store"
```

---

## Task 4: Update `body-text.js` — add `onBodyChange` callback

**Files:**
- Modify: `js/body-text.js`

- [ ] **Step 1: Remove `save` import and add callback param**

Replace the entire file:

```js
// js/body-text.js

export function toHTML(raw) {
  return raw.replace(/\*(.*?)\*/g, '<em>$1</em>');
}

export function toRaw(html) {
  return html
    .replace(/<em>(.*?)<\/em>/gs, '*$1*')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g,  '<')
    .replace(/&gt;/g,  '>');
}

export function initBodyText(adjustSpacing, onBodyChange) {
  const p    = document.querySelector('.body-text');
  const hint = document.getElementById('hint-popup');

  p.addEventListener('focus', () => {
    p.textContent = toRaw(p.innerHTML);
    hint.classList.add('visible');
  });

  p.addEventListener('blur', () => {
    const raw = p.textContent;
    if (onBodyChange) onBodyChange(raw);
    p.innerHTML = toHTML(raw);
    hint.classList.remove('visible');
    adjustSpacing();
  });

  p.addEventListener('input', () => adjustSpacing());
}
```

- [ ] **Step 2: Verify in browser**

Edit the body text on the certificate and blur. Check DevTools > Local Storage: the `cert_state` blob should update with the new body text. No console errors.

- [ ] **Step 3: Commit**

```bash
git add js/body-text.js
git commit -m "refactor: decouple body-text from storage via onBodyChange callback"
```

---

## Task 5: Update `index.html` — wire everything up

**Files:**
- Modify: `index.html`
- Modify: `css/toolbar.css`

This task has several sub-steps but they're all in one file. Do them in order.

### 5a — Add toolbar buttons and hidden file input

- [ ] **Step 1: Add Save/Load buttons to toolbar**

In `index.html`, locate the `<button class="format-trigger-btn"` block. Add the Save and Load buttons **after** it and **before** the `<div class="print-btn-wrap">`:

```html
  <button class="action-btn" id="save-cert-btn">Save Certificate</button>
  <button class="action-btn" id="load-cert-btn">Load Certificate</button>
  <input type="file" id="load-cert-input" accept=".json" style="display:none;">
```

- [ ] **Step 2: Add `.action-btn` style in `css/toolbar.css`**

Append to `css/toolbar.css`:

```css
.action-btn {
  padding: 6px 14px;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  color: inherit;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.action-btn:hover { background: rgba(255,255,255,0.15); }
```

### 5b — Update the inline `<script>` imports

- [ ] **Step 3: Confirm imports in the inline script — no changes needed**

The inline `<script type="module">` currently imports:
```js
import { initStore } from './js/store.js';
import { initBodyText } from './js/body-text.js';
import { scaleCert, adjustSpacing } from './js/cert-render.js';
import { save } from './js/storage.js';
```

**Do not remove the `save` import.** It is still required for the logo upload handler (`save('logo', ev.target.result)` at the bottom of the script). No other import changes are needed.

### 5c — Update `initBodyText` call

- [ ] **Step 4: Pass the `onBodyChange` callback**

Find the line:
```js
initBodyText(adjustSpacing);
```

Replace with:
```js
initBodyText(adjustSpacing, raw => {
  Alpine.store('cert').content.body = raw;
  Alpine.store('cert').persistState();
});
```

### 5d — Replace text-field blur handlers

- [ ] **Step 5: Replace the forEach blur handler block**

Find and replace the current block:
```js
  [
    ['.doc-title',      'title'       ],
    ['.recipient-name', 'recipient'   ],
    ['.org-name',       'org_name'    ],
    ['.presented-by',   'presented_by'],
    ['.cert-date',      'date'        ],
  ].forEach(([sel, key]) => {
    document.querySelector(sel).addEventListener('blur', function() {
      save(key, this.textContent.trim());
    });
  });
```

Replace with:
```js
  [
    ['.doc-title',      'title'      ],
    ['.recipient-name', 'recipient'  ],
    ['.org-name',       'orgName'    ],
    ['.presented-by',   'presentedBy'],
    ['.cert-date',      'date'       ],
  ].forEach(([sel, key]) => {
    document.querySelector(sel).addEventListener('blur', function() {
      Alpine.store('cert').content[key] = this.textContent.trim();
      Alpine.store('cert').persistState();
    });
  });
```

Note the key name changes: `org_name` → `orgName`, `presented_by` → `presentedBy` (matching `content` object fields).

### 5e — Update sig focusout handler

- [ ] **Step 6: Update the sig focusout handler**

Find:
```js
  document.querySelector('.cert').addEventListener('focusout', e => {
    if (e.target.matches('.sig-name, .sig-title')) {
      const store = Alpine.store('cert');
      const units = document.querySelectorAll('.sig-unit');
      store.sigData = Array.from(units).map(u => ({
        name:  u.querySelector('.sig-name').textContent.trim(),
        title: u.querySelector('.sig-title').textContent.trim(),
      }));
      save('sigs', JSON.stringify(store.sigData));
    }
  });
```

Replace with:
```js
  document.querySelector('.cert').addEventListener('focusout', e => {
    if (e.target.matches('.sig-name, .sig-title')) {
      const store = Alpine.store('cert');
      const units = document.querySelectorAll('.sig-unit');
      store.content.sigs = Array.from(units).map(u => ({
        name:  u.querySelector('.sig-name').textContent.trim(),
        title: u.querySelector('.sig-title').textContent.trim(),
      }));
      store.persistState();
    }
  });
```

### 5f — Wire Save/Load buttons

- [ ] **Step 7: Add Save Certificate button listener**

After the `// Print button` listener block, add:

```js
  // Save certificate to file
  document.getElementById('save-cert-btn').addEventListener('click', () => {
    Alpine.store('cert').saveCertToFile();
  });

  // Load certificate from file
  document.getElementById('load-cert-btn').addEventListener('click', () => {
    document.getElementById('load-cert-input').click();
  });

  document.getElementById('load-cert-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      let parsed;
      try { parsed = JSON.parse(ev.target.result); } catch(err) { return; }
      if (!parsed.content || !parsed.format) return;
      Alpine.store('cert').loadFromData(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  });
```

- [ ] **Step 8: Confirm `save` import is still present**

Verify `import { save } from './js/storage.js'` is still at the top of the inline script. It must remain — the logo upload handler uses `save('logo', ev.target.result)`. Do not remove it.

### 5g — Final browser verification

- [ ] **Step 9: Full end-to-end test in browser**

Open `index.html`. Run through each scenario:

**Defaults:** Reload with no `cert_state` in localStorage — certificate shows Jimmy Smith, March 18 2026, default body, two sigs.

**Edits persist:** Edit the recipient name → blur → reload. Name should be restored from `cert_state`.

**Save to file:** Click "Save Certificate". A `certificate.json` file downloads. Open it in a text editor — confirm it has `content` and `format` sections with the current values.

**Load from file:** Edit the recipient name to something different. Click "Load Certificate" and select the downloaded `certificate.json`. The certificate should revert to the saved values. Logo should remain unchanged.

**Sigs:** Add a sig via the toolbar counter → blur edit name → save → reload → confirm name and count persisted.

**Format settings:** Change palette → save → reload → palette restored.

- [ ] **Step 10: Commit**

```bash
git add index.html css/toolbar.css
git commit -m "feat: add Save/Load Certificate buttons and wire content persistence"
```

---

## Task 6: Clean up (optional smoke check)

- [ ] **Step 1: Clear localStorage and reload**

In DevTools > Application > Local Storage > right-click > Clear. Reload the page. Confirm the certificate renders cleanly from `DEFAULT_CERT_DATA` with no errors.

- [ ] **Step 2: Verify no dead imports**

Check that `js/store.js` no longer imports `DEFAULT_BODY` or `DEFAULT_SIGS`. Check that `js/body-text.js` no longer imports `save`. If either is still present, remove them and commit.

```bash
git add js/config.js js/storage.js js/store.js js/body-text.js index.html css/toolbar.css
git commit -m "chore: remove dead imports after cert data structure refactor" --allow-empty
```

(Use `--allow-empty` only if nothing was actually missed; otherwise stage and commit real changes.)
