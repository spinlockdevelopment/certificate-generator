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
