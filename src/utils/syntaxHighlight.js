/**
 * Lightweight regex syntax highlighting — comments, strings, keywords,
 * numbers, decorators. Emits span markup with .tok-* classes (styles in
 * app.css). Dependency-free on purpose: this app has no highlighter lib.
 */

const LANG_KW = /\b(import|from|def|class|return|if|elif|else|for|while|try|except|finally|with|as|async|await|not|and|or|in|is|None|True|False|self|const|let|var|function|export|new|typeof|echo|cd|pip|npm|curl)\b/g;

export function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Highlight one line of source. Order matters — comments/strings are
   tokenised first so keywords inside them don't get tagged. */
export function highlightLine(line) {
  const esc = escHtml(line);
  const parts = [];
  let rest = esc, i = 0;
  const re = /(#.*$|\/\/.*$|&quot;.*?&quot;|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/;
  while (rest && i < 200) { // safety bound
    const m = rest.match(re);
    if (!m || m.index == null) { parts.push({ t: 'code', s: rest }); break; }
    if (m.index > 0) parts.push({ t: 'code', s: rest.slice(0, m.index) });
    const tok = m[0];
    parts.push({ t: tok.startsWith('#') || tok.startsWith('//') ? 'com' : 'str', s: tok });
    rest = rest.slice(m.index + tok.length);
    i++;
  }
  return parts.map(p => {
    if (p.t === 'com') return `<span class="tok-com">${p.s}</span>`;
    if (p.t === 'str') return `<span class="tok-str">${p.s}</span>`;
    return p.s
      .replace(LANG_KW, '<span class="tok-kw">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>')
      .replace(/(@\w+)/g, '<span class="tok-dec">$1</span>');
  }).join('');
}
