/**
 * ============================================================
 * MARKDOWN UTILITIES
 * Chapter markdown <-> practical lab extraction helpers.
 * Ports the exact semantics of the vanilla details-popup.js /
 * lab-popup.js implementations.
 * ============================================================
 */

const LAB_HEADING_RE = /^#\s+.*Practical\s+Lab\s/i;

/**
 * Strip the Practical Lab sections from chapter markdown.
 * Labs begin at the first H1 matching "# ... Practical Lab ..." —
 * everything from that heading onwards is removed, along with any
 * blank lines / horizontal rules immediately preceding it.
 */
export function stripPracticalLabs(md) {
  if (!md) return '';
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (LAB_HEADING_RE.test(lines[i].trim())) {
      let cutPoint = i;
      while (cutPoint > 0 && /^(|---+)$/.test(lines[cutPoint - 1].trim())) {
        cutPoint--;
      }
      return lines.slice(0, cutPoint).join('\n');
    }
  }
  return md;
}

/**
 * Extract only the Practical Lab portion of chapter markdown —
 * everything from the first "# ... Practical Lab ..." H1 onwards.
 */
export function extractPracticalLabs(md) {
  if (!md) return '';
  const lines = md.split('\n');
  const startIdx = lines.findIndex(l => LAB_HEADING_RE.test(l.trim()));
  return startIdx === -1 ? '' : lines.slice(startIdx).join('\n');
}

/**
 * Rewrite relative media URLs in rendered HTML against a base URL.
 * `<img src="image-3.png">` inside markdown resolves against the page
 * URL by default — chapter assets live under the chapters base URL
 * (e.g. /chapters/), so relative src/href values are prefixed.
 */
export function resolveMediaUrls(html, baseUrl) {
  if (!html || !baseUrl) return html;
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const doc = new DOMParser().parseFromString(`<div id="__wrap">${html}</div>`, 'text/html');
  const wrap = doc.getElementById('__wrap');
  if (!wrap) return html;
  const origin = window.location.origin;
  const isRelative = v => v && !/^(https?:|\/|data:|blob:|#|mailto:)/i.test(v);
  wrap.querySelectorAll('img[src], source[src], video[src]').forEach(el => {
    const src = el.getAttribute('src');
    // URL() resolves ./ and ../ segments against the base.
    if (isRelative(src)) el.setAttribute('src', new URL(src, origin + base).pathname);
  });
  return wrap.innerHTML;
}

/**
 * Split rendered lab HTML into accordion sections grouped by
 * top-level <h1> elements.
 *
 * IMPORTANT: operates on the *rendered* HTML (like the vanilla
 * implementation) rather than the raw markdown, so `#` comment lines
 * inside fenced code blocks never trigger a false split.
 *
 * @param {string} html - HTML produced by marked.parse()
 * @returns {Array<{title: string, html: string}>}
 */
export function splitLabsIntoSections(html) {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(`<div id="__wrap">${html}</div>`, 'text/html');
  const wrap = doc.getElementById('__wrap');
  if (!wrap) return [];

  const groups = [];
  let current = null;
  for (const node of Array.from(wrap.childNodes)) {
    if (node.nodeType === 1 && node.tagName === 'H1') {
      current = { title: node.textContent.trim(), html: '' };
      groups.push(current);
    } else if (current) {
      current.html += node.nodeType === 1 ? node.outerHTML : (node.textContent || '');
    }
  }
  return groups;
}
