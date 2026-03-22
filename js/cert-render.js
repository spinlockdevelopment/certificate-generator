// js/cert-render.js
import { SIZE_MODES, PALETTES } from './config.js';

export function applyCSSVars(state) {
  const r = document.documentElement.style;

  // Individual font size scales
  const fs = state.fontSizes || {};
  r.setProperty('--logo-scale',            fs.logo        ?? 1);
  r.setProperty('--fs-org-scale',          fs.org         ?? 1);
  r.setProperty('--fs-title-scale',        fs.title       ?? 1);
  r.setProperty('--fs-recipient-scale',    fs.recipient   ?? 1);
  r.setProperty('--fs-body-scale',         fs.body        ?? 1);
  r.setProperty('--fs-presented-to-scale', fs.presentedTo ?? 1);
  r.setProperty('--fs-sig-scale',          fs.sig         ?? 1);
  r.setProperty('--fs-presented-by-scale', fs.presentedBy ?? 1);
  r.setProperty('--fs-date-scale',         fs.date        ?? 1);

  // Spacing (individual px values)
  const sp = state.spacing || {};
  const para = sp.paragraph ?? 16;
  r.setProperty('--sp-logo',              (sp.logo        ?? 20) + 'px');
  r.setProperty('--sp-org',               (sp.org         ?? 10) + 'px');
  r.setProperty('--sp-title',             (sp.title       ?? 12) + 'px');
  r.setProperty('--sp-presented-to-offset', (sp.presentedTo ?? 0) + 'px');
  r.setProperty('--sp-recipient',          (sp.recipient   ?? 6)  + 'px');
  r.setProperty('--sp-para-above-hr',      para + 'px');
  r.setProperty('--sp-para-below-hr',      para + 'px');
  r.setProperty('--sp-para-hr-below',      para + 'px');
  r.setProperty('--sp-sig',               (sp.sig         ?? 19) + 'px');
  r.setProperty('--sp-presented-by',      (sp.presentedBy ?? 12) + 'px');
  r.setProperty('--sp-date',              (sp.date        ?? 10) + 'px');

  // Border margin
  r.setProperty('--border-margin', (state.borderMargin ?? 63) + 'px');

  // Palette colors
  const p = PALETTES[state.paletteIndex];
  r.setProperty('--accent',    p.accent);
  r.setProperty('--accent-lt', p.accentLt);
  r.setProperty('--gold',      p.gold);
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
  const panelW = window.innerWidth >= 769 ? 240 : 0;
  const availW = window.innerWidth  - 40 - panelW;
  const availH = window.innerHeight - 54 - 76;
  const scale  = Math.min(availW / m.w, availH / m.h);

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

    // "Presented To (above)" offset from Spacing tab slider
    const offset = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--sp-presented-to-offset') || '0'
    );

    presentedTo.style.marginTop = Math.round(forMargins / 5 + offset) + 'px';
    sigRule.style.marginBottom  = Math.round((forMargins * 2) / 3 - offset) + 'px';
  });
}

export function renderSigs(data) {
  const block = document.querySelector('.sig-block');
  block.className = 'sig-block count-' + data.length;

  // Build sig units using DOM methods (safe text insertion)
  block.textContent = '';
  data.forEach(s => {
    const unit = document.createElement('div');
    unit.className = 'sig-unit';

    const line = document.createElement('div');
    line.className = 'sig-line';
    unit.appendChild(line);

    const name = document.createElement('div');
    name.className = 'sig-name';
    name.contentEditable = 'true';
    name.spellcheck = false;
    name.textContent = s.name;
    unit.appendChild(name);

    const title = document.createElement('div');
    title.className = 'sig-title';
    title.contentEditable = 'true';
    title.spellcheck = false;
    title.textContent = s.title;
    unit.appendChild(title);

    block.appendChild(unit);
  });

  adjustSpacing();
}
