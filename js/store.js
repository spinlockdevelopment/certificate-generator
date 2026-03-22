// js/store.js
import { SIZE_MODES, FONT_PAIRS, PALETTES, DEFAULT_CERT_DATA, DEFAULT_SPACING } from './config.js';

const CARD_STOCK_LABELS = { '#FDFAF2': 'Ivory', '#FAFAF8': 'Paper White' };

function syncCardStockUI(bg) {
  const swatch = document.getElementById('cardstock-swatch');
  const label  = document.getElementById('cardstock-label');
  if (swatch) swatch.style.background = bg;
  if (label)  label.textContent = CARD_STOCK_LABELS[bg] ?? 'Custom';
  document.querySelectorAll('#cardstock-menu .tb-dropdown-item').forEach(b => {
    b.classList.toggle('active', b.dataset.bg === bg);
  });
}

import { load, persistState as storagePersist, loadState } from './storage.js';
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
}

export function initStore() {
  Alpine.store('cert', {
    // ── Format state ──
    fontSizes:     { ...DEFAULT_CERT_DATA.format.fontSizes },
    spacing:       { ...DEFAULT_SPACING },
    borderMargin:  DEFAULT_CERT_DATA.format.borderMargin,
    fontPairIndex: DEFAULT_CERT_DATA.format.fontPairIndex,
    paletteIndex:  DEFAULT_CERT_DATA.format.paletteIndex,
    sizeMode:      DEFAULT_CERT_DATA.format.sizeMode,
    cardStock:     DEFAULT_CERT_DATA.format.cardStock,

    // ── Content state ──
    content: { ...DEFAULT_CERT_DATA.content, sigs: [...DEFAULT_CERT_DATA.content.sigs] },

    // ── UI state ──
    panelOpen: false,
    activeTab: 'style',

    // ── Config arrays for Alpine template loops ──
    fontPairs: FONT_PAIRS,
    palettes:  PALETTES,

    // ── Persist entire state to one localStorage blob ──
    persistState() {
      storagePersist({ content: this.content, format: this._formatSnapshot() });
    },

    // ── Save current state to a .json file (Save As dialog) ──
    async saveCertToFile() {
      const blob = { content: this.content, format: this._formatSnapshot() };
      const json = JSON.stringify(blob, null, 2);

      const name = (this.content.recipient || 'certificate').replace(/\s+/g, '-');
      const today = new Date().toISOString().slice(0, 10);
      const defaultName = today + '_' + name + '.json';

      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: defaultName,
            types: [{ description: 'JSON Certificate', accept: { 'application/json': ['.json'] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(json);
          await writable.close();
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }
      // Fallback: trigger download
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    // ── Load state from a parsed JSON object (from file upload) ──
    loadFromData(data) {
      const c = { ...DEFAULT_CERT_DATA.content, ...data.content };
      const f = { ...DEFAULT_CERT_DATA.format,  ...data.format  };

      // Apply format fields
      this.fontSizes     = { ...DEFAULT_CERT_DATA.format.fontSizes, ...(f.fontSizes || {}) };
      this.spacing       = { ...DEFAULT_SPACING, ...(f.spacing || {}) };
      this.borderMargin  = +(f.borderMargin ?? 63);
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

      syncCardStockUI(this.cardStock);
      this.persistState();
    },

    // ── Size tab: individual font size scales ──
    setFontSize(key, v) {
      this.fontSizes = { ...this.fontSizes, [key]: +v };
      applyCSSVars(this);
      adjustSpacing();
      this.persistState();
    },

    // ── Spacing tab ──
    setSpacing(key, v) {
      this.spacing = { ...this.spacing, [key]: +v };
      applyCSSVars(this);
      adjustSpacing();
      this.persistState();
    },

    setBorderMargin(v) {
      this.borderMargin = +v;
      applyCSSVars(this);
      adjustSpacing();
      this.persistState();
    },

    // ── Reset just Size tab font sizes ──
    resetSizes() {
      this.fontSizes = { ...DEFAULT_CERT_DATA.format.fontSizes };
      applyCSSVars(this);
      adjustSpacing();
      this.persistState();
    },

    // ── Reset just Spacing tab values ──
    resetSpacing() {
      this.spacing = { ...DEFAULT_SPACING };
      this.borderMargin = DEFAULT_CERT_DATA.format.borderMargin;
      applyCSSVars(this);
      adjustSpacing();
      this.persistState();
    },

    // ── Reset everything (content + format) back to factory defaults ──
    resetAll() {
      // Format
      this.fontSizes     = { ...DEFAULT_CERT_DATA.format.fontSizes };
      this.spacing       = { ...DEFAULT_SPACING };
      this.borderMargin  = DEFAULT_CERT_DATA.format.borderMargin;
      this.fontPairIndex = DEFAULT_CERT_DATA.format.fontPairIndex;
      this.paletteIndex  = DEFAULT_CERT_DATA.format.paletteIndex;
      this.sizeMode      = DEFAULT_CERT_DATA.format.sizeMode;
      this.cardStock     = DEFAULT_CERT_DATA.format.cardStock;

      // Content
      this.content = { ...DEFAULT_CERT_DATA.content, sigs: [...DEFAULT_CERT_DATA.content.sigs] };

      applyCSSVars(this);
      applyFontPair(FONT_PAIRS[this.fontPairIndex]);
      applyMode(this, this.sizeMode);

      // Populate DOM
      document.querySelector('.doc-title').textContent      = this.content.title;
      document.querySelector('.recipient-name').textContent = this.content.recipient;
      document.querySelector('.org-name').textContent       = this.content.orgName;
      document.querySelector('.presented-by').textContent   = this.content.presentedBy;
      document.querySelector('.cert-date').textContent      = this.content.date;
      document.querySelector('.body-text').innerHTML        = toHTML(this.content.body);
      renderSigs(this.content.sigs);

      syncCardStockUI(this.cardStock);
      this.persistState();
    },

    // ── Style tab ──
    setPalette(i) {
      this.paletteIndex = +i;
      this.cardStock = PALETTES[i].cream;
      applyCSSVars(this);
      this.persistState();
      syncCardStockUI(this.cardStock);
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

    _formatSnapshot() {
      return {
        fontSizes:     { ...this.fontSizes },
        spacing:       { ...this.spacing },
        borderMargin:  this.borderMargin,
        fontPairIndex: this.fontPairIndex,
        paletteIndex:  this.paletteIndex,
        cardStock:     this.cardStock,
        sizeMode:      this.sizeMode,
      };
    },

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
        this.content = { ...DEFAULT_CERT_DATA.content, ...saved.content };
        const f = { ...DEFAULT_CERT_DATA.format, ...saved.format };
        this.fontSizes     = { ...DEFAULT_CERT_DATA.format.fontSizes, ...(f.fontSizes || {}) };
        this.spacing       = { ...DEFAULT_SPACING, ...(f.spacing || {}) };
        this.borderMargin  = +(f.borderMargin ?? 63);
        this.fontPairIndex = +f.fontPairIndex;
        this.paletteIndex  = +f.paletteIndex;
        this.sizeMode      = f.sizeMode;
        this.cardStock     = f.cardStock;
      }

      // Fallback for empty fields (stale localStorage)
      if (!this.content.body) this.content.body = DEFAULT_CERT_DATA.content.body;
      if (!this.content.date) this.content.date = DEFAULT_CERT_DATA.content.date;
      if (!this.content.sigs?.length) this.content.sigs = [...DEFAULT_CERT_DATA.content.sigs];

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

      // Sync card stock active state
      syncCardStockUI(this.cardStock);
    },
  });
}
