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
