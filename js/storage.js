// js/storage.js
const SLOT = 'default';
const key  = f => 'cert_' + SLOT + '_' + f;

export function save(field, value) {
  try { localStorage.setItem(key(field), value); } catch(e) {}
}

export function load(field, fallback = null) {
  const v = localStorage.getItem(key(field));
  return v !== null ? v : fallback;
}

// Persists full { content, format } state — matches DEFAULT_CERT_DATA shape.
// Caller is responsible for merging field-level defaults before passing the blob.
export function persistState(blob) {
  if (blob == null) return;
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
