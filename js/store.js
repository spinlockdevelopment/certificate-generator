// js/store.js
import { SIZE_MODES, FONT_PAIRS, PALETTES, DEFAULT_CERT_DATA } from './config.js';
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
      storagePersist({ content: this.content, format: this._formatSnapshot() });
    },

    // ── Save current state to a .json file ──
    saveCertToFile() {
      const json = JSON.stringify(
        { content: this.content, format: this._formatSnapshot() },
        null, 2
      );
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

      // Apply format fields — paletteIndex before cardStock (preserves custom card stock)
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

    _formatSnapshot() {
      return {
        fontScale:     this.fontScale,
        spacingScale:  this.spacingScale,
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

      // Sync card stock active state (size-btn state is handled by applyMode above)
      document.querySelectorAll('.color-btn[data-bg]').forEach(b => {
        b.classList.toggle('active', b.dataset.bg === this.cardStock);
      });
    },
  });
}
