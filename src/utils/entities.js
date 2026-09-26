/**
 * Decode HTML entities in plain-text strings (e.g. '&#9729;&#65039;' -> emoji).
 * Some generated module data files store icons as HTML entities rather than
 * literal characters; this decodes them safely via the DOM.
 */
const decoder = typeof document !== 'undefined' ? document.createElement('textarea') : null;

export function decodeEntities(str) {
  if (str == null || str === '') return '';
  if (!/&#?\w+;/.test(str)) return str; // fast path: nothing to decode
  decoder.innerHTML = str;
  return decoder.value;
}
