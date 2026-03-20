// js/cert-render.js
import { SIZE_MODES, PALETTES, FONT_PAIRS } from './config.js';
import { save } from './storage.js';

export function applyCSSVars(state) {
  const r = document.documentElement.style;
  r.setProperty('--font-scale',    state.fontScale);
  r.setProperty('--spacing-scale', state.spacingScale);
  r.setProperty('--border-margin', state.borderMargin + 'px');

  const p = PALETTES[state.paletteIndex];
  r.setProperty('--accent',    p.accent);
  r.setProperty('--accent-lt', p.accentLt);
  r.setProperty('--gold',      p.gold);
  // card stock overrides the palette cream
  r.setProperty('--cream',     state.cardStock || p.cream);
  r.setProperty('--ink',       p.ink);
  r.setProperty('--ink-mid',   p.inkMid);
  r.setProperty('--ink-muted', p.inkMuted);
}

export function applyFontPair(pair) {
  const r = document.documentElement.style;
  r.setProperty('--font-heading', `'${pair.heading}', Georgia, serif`);
  r.setProperty('--font-body-ff', `'${pair.bodyFf}', Georgia, serif`);
}

export function scaleCert(sizeMode) {
  const m      = SIZE_MODES[sizeMode];
  // Reserve 240px for the format panel on desktop (≥769px)
  const panelW = window.innerWidth >= 769 ? 240 : 0;
  const availW = window.innerWidth  - 40 - panelW;
  const availH = window.innerHeight - 54 - 76;
  const scale  = Math.min(availW / m.w, availH / m.h, 1);

  document.querySelector('.cert-scale').style.transform = 'scale(' + scale + ')';
  const outer = document.querySelector('.cert-outer');
  outer.style.width  = Math.round(m.w * scale) + 'px';
  outer.style.height = Math.round(m.h * scale) + 'px';
}

export function adjustSpacing() {
  const presentedTo = document.querySelector('.presented-to');
  const sigRule     = document.getElementById('sig-rule');

  presentedTo.style.marginTop = '0';
  sigRule.style.marginBottom  = '0';

  requestAnimationFrame(() => {
    const content = document.querySelector('.content');
    const cs      = getComputedStyle(content);
    const innerH  = content.offsetHeight
      - parseFloat(cs.paddingTop)
      - parseFloat(cs.paddingBottom);

    const topH = document.querySelector('.top-section').offsetHeight;
    const midH = document.querySelector('.mid-section').offsetHeight;
    const botH = document.querySelector('.bottom-section').offsetHeight;

    const available  = Math.max(0, innerH - topH - midH - botH);
    const forMargins = Math.max(0, available - 20);

    presentedTo.style.marginTop = Math.round(forMargins / 5) + 'px';
    sigRule.style.marginBottom  = Math.round((forMargins * 2) / 3) + 'px';
  });
}

export function renderSigs(data) {
  const block = document.querySelector('.sig-block');
  block.className = 'sig-block count-' + data.length;
  block.innerHTML = data.map(s => `
    <div class="sig-unit">
      <div class="sig-line"></div>
      <div class="sig-name"  contenteditable="true" spellcheck="false">${s.name}</div>
      <div class="sig-title" contenteditable="true" spellcheck="false">${s.title}</div>
    </div>`).join('');

  document.getElementById('sig-count').textContent = data.length;
  document.getElementById('sig-remove').disabled   = data.length <= 1;
  document.getElementById('sig-add').disabled      = data.length >= 3;
  adjustSpacing();
}
