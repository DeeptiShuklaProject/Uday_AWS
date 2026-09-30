/**
 * conceptIndex — derive a concept → code map from chapter markdown.
 *
 * Each `##` section becomes a concept card carrying the section's own
 * code fences and any reference links (github.com etc.) it contains.
 * This powers the Concept & Code page; no data is hardcoded — the map
 * is built from whatever chapters the registry lists.
 */

const SKIP_RE = /learning objectives|knowledge check|troubleshooting|chapter summary|interview|practical lab|hands?-?on|quiz/i;
const FENCE_RE = /```([A-Za-z0-9_-]*)\s*\n([\s\S]*?)```/g;
const GITHUB_LINK_RE = /https?:\/\/(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+/g;

/* Split markdown into ## chunks, ignoring heading lines inside fences. */
export function splitH2Sections(md) {
  const chunks = [];
  let cur = null;
  let inFence = false;
  for (const line of (md || '').split('\n')) {
    const isFence = /^(```|~~~)/.test(line.trim());
    const h = (!inFence && !isFence) ? line.match(/^(#{1,6})\s/) : null;
    if (h) {
      if (cur && h[1].length <= cur.level) { chunks.push(cur); cur = null; }
      if (!cur && h[1].length === 2) cur = { level: 2, title: line.trim().replace(/^#{2,6}\s+/, ''), lines: [] };
      else if (cur) cur.lines.push(line);
    } else if (cur) cur.lines.push(line);
    if (isFence) inFence = !inFence;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

const stripMd = (s) => s
  .replace(/`{3}[\s\S]*?`{3}/g, '')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[*_>#~`]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * @param {string} md - raw chapter markdown
 * @param {{chapterId:string, chapterLabel:string}} meta
 * @returns {Array<{id,chapterId,chapterLabel,title,summary,codes,repos}>}
 */
export function extractConcepts(md, meta) {
  return splitH2Sections(md)
    .filter(c => !SKIP_RE.test(c.title))
    .map((c, i) => {
      const body = c.lines.join('\n');
      const codes = [...body.matchAll(FENCE_RE)]
        .map(m => ({ lang: (m[1] || 'text').toLowerCase(), code: m[2].replace(/\n$/, '') }))
        .filter(x => x.code.trim());
      const repos = [...new Set(body.match(GITHUB_LINK_RE) || [])]
        .map(u => u.replace(/[),.\]]+$/, ''));
      // First real paragraph = concept summary.
      const summary = stripMd(
        body.split(/\n\s*\n/)
          .map(p => p.trim())
          .find(p => p && !p.startsWith('```') && !p.startsWith('![') && !p.startsWith('<') && !p.startsWith('###')) || ''
      ).slice(0, 300);
      return {
        id: `${meta.chapterId}::${i}`,
        chapterId: meta.chapterId,
        chapterLabel: meta.chapterLabel,
        title: c.title.trim(),
        summary,
        codes,
        repos,
      };
    });
}
