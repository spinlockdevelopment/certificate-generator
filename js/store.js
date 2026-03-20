// js/store.js
import { SIZE_MODES, FONT_PAIRS, PALETTES, DEFAULT_SIGS, DEFAULT_BODY } from './config.js';
import { save, load } from './storage.js';
import { applyCSSVars, applyFontPair, scaleCert, adjustSpacing, renderSigs } from './cert-render.js';
import { toHTML } from './body-text.js';

function getTodayDate() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

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
    // ── Format panel state ──
    fontScale:     parseFloat(load('fontScale',    '1')),
    spacingScale:  parseFloat(load('spacingScale', '1')),
    borderMargin:  parseInt(load('borderMargin',   '63'), 10),
    fontPairIndex: parseInt(load('fontPairIndex',  '0'),  10),
    paletteIndex:  parseInt(load('paletteIndex',   '0'),  10),

    // ── Toolbar state (migrated from inline script) ──
    sizeMode:  load('size_mode', '85x11'),
    cardStock: load('bg',        PALETTES[0].cream),
    sigData:   JSON.parse(load('sigs', JSON.stringify(DEFAULT_SIGS))),
    panelOpen: false,

    // ── Expose config arrays for Alpine x-for template loops ──
    fontPairs: FONT_PAIRS,
    palettes:  PALETTES,

    // ── Format panel methods ──
    setFontScale(v)    { this.fontScale = +v;    applyCSSVars(this); save('fontScale', v);    adjustSpacing(); },
    setSpacing(v)      { this.spacingScale = +v; applyCSSVars(this); save('spacingScale', v); adjustSpacing(); },
    setBorderMargin(v) { this.borderMargin = +v; applyCSSVars(this); save('borderMargin', v); adjustSpacing(); },

    setPalette(i) {
      this.paletteIndex = +i;
      this.cardStock = PALETTES[i].cream;
      applyCSSVars(this);
      save('paletteIndex', i);
      save('bg', this.cardStock);
      document.querySelectorAll('.color-btn[data-bg]').forEach(b => {
        b.classList.toggle('active', b.dataset.bg === this.cardStock);
      });
    },

    setFontPair(i) {
      this.fontPairIndex = +i;
      applyFontPair(FONT_PAIRS[i]);
      save('fontPairIndex', i);
    },

    setSizeMode(mode) { applyMode(this, mode); save('size_mode', mode); },

    setCardStock(color) {
      this.cardStock = color;
      applyCSSVars(this);
      save('bg', color);
    },

    togglePanel() { this.panelOpen = !this.panelOpen; },

    addSig() {
      if (this.sigData.length >= 3) return;
      this.sigData.push({ name: 'Name', title: 'Title, Springfield VFD' });
      renderSigs(this.sigData);
      save('sigs', JSON.stringify(this.sigData));
    },

    removeSig() {
      if (this.sigData.length <= 1) return;
      this.sigData.pop();
      renderSigs(this.sigData);
      save('sigs', JSON.stringify(this.sigData));
    },

    init() {
      // Apply all persisted format settings
      applyCSSVars(this);
      applyFontPair(FONT_PAIRS[this.fontPairIndex]);
      applyMode(this, this.sizeMode);
      renderSigs(this.sigData);

      // Restore text content fields
      document.querySelector('.doc-title').textContent      = load('title',        'Certificate of Recognition');
      document.querySelector('.recipient-name').textContent = load('recipient',    'Jimmy Smith');
      document.querySelector('.org-name').textContent       = load('org_name',     'Springfield Volunteer Fire Department');
      document.querySelector('.presented-by').textContent   = load('presented_by', 'Presented by the Volunteer Fire Department');
      document.querySelector('.cert-date').textContent      = load('date',         getTodayDate());

      const savedBody = load('body_raw');
      document.querySelector('.body-text').innerHTML = toHTML(savedBody ?? DEFAULT_BODY);

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
