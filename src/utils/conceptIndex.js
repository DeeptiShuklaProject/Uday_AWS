/**
 * conceptIndex — derive a concept tree + reference edges from chapter
 * markdown. Each `##` section is a tree node with a STABLE, bookmarkable
 * id ({chapterId}#{slug} — slug comes from the section number when one
 * exists, so ids survive cosmetic title edits). `###` headings become
 * child nodes. Every chunk also emits its reference edges: repos,
 * images, mermaid diagrams and other external links — all fed into
 * referenceGraph.js as a many-to-many concept ↔ reference index.
 */

const SKIP_RE = /learning objectives|knowledge check|troubleshooting|chapter[\s\d]*summary|interview|practical lab|hands?-?on|quiz/i;
const FENCE_RE = /```([A-Za-z0-9_-]*)\s*\n([\s\S]*?)```/g;
const GITHUB_LINK_RE = /https?:\/\/(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+/g;
const LINK_RE = /https?:\/\/[^\s)\]"']+/g;
const IMG_RE = /!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g;

export const slugify = (s) => (s || '')
  .toLowerCase()
  .replace(/[^\w\s.-]/g, '')
  .trim()
  .replace(/[\s_]+/g, '-')
  .replace(/\.+/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 48);

/* Stable slug: prefer the authored section number ("3.9 …" → "3-9"). */
function sectionId(chapterId, title, fallbackIdx) {
  const num = title.match(/^(\d+(?:\.\d+)*)/)?.[1];
  return `${chapterId}#${num ? num.replace(/\./g, '-') : slugify(title) || `sec-${fallbackIdx}`}`;
}

/* Split markdown into heading chunks, ignoring heading lines inside
   fenced code blocks. level<childLevel keeps nested ### children. */
export function splitSections(md) {
  const chunks = [];
  let cur = null;
  let inFence = false;
  for (const line of (md || '').split('\n')) {
    const isFence = /^(```|~~~)/.test(line.trim());
    const h = (!inFence && !isFence) ? line.match(/^(#{1,6})\s/) : null;
    if (h) {
      // H1–H3 headings always start a new chunk (## = concept,
      // ### = sub-concept); #### and deeper stay inside the body.
      const boundary = cur && h[1].length <= 3;
      if (boundary) { chunks.push(cur); cur = null; }
      if (!cur && h[1].length <= 3) cur = { level: h[1].length, title: line.trim().replace(/^#{1,6}\s+/, ''), lines: [] };
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

function chunkToConcept(chunk, meta, idx) {
  const id = sectionId(meta.chapterId, chunk.title, idx);
  const body = chunk.lines.join('\n');
  // Sub-element ids: a code block / image inside a section is itself a
  // bookmarkable node — `${sectionId}:code-N`, `${sectionId}:img-<file>`
  const codes = [...body.matchAll(FENCE_RE)]
    .map((m, i) => ({
      id: `${id}:code-${i}`,
      lang: (m[1] || 'text').toLowerCase(),
      code: m[2].replace(/\n$/, ''),
    }))
    .filter(x => x.code.trim());
  const links = body.match(LINK_RE) || [];
  const repos = [...new Set(body.match(GITHUB_LINK_RE) || [])].map(u => u.replace(/[),.\]]+$/, ''));
  const extLinks = [...new Set(links.filter(u => !/github\.com/.test(u)))].map(u => u.replace(/[),.\]]+$/, ''));
  const images = [...body.matchAll(IMG_RE)]
    .map(m => ({ id: `${id}:img-${slugify(m[1].split('/').pop().replace(/\.\w+$/, '')) || 'x'}`, path: m[1] }));
  const diagrams = codes.filter(x => x.lang === 'mermaid').length;
  const summary = stripMd(
    body.split(/\n\s*\n/)
      .map(p => p.trim())
      .find(p => p && !p.startsWith('```') && !p.startsWith('![') && !p.startsWith('<') && !/^#{1,6}\s/.test(p)) || ''
  ).slice(0, 300);
  return {
    id,
    chapterId: meta.chapterId,
    chapterLabel: meta.chapterLabel,
    level: chunk.level,           // 2 = concept, 3 = sub-concept
    title: chunk.title.trim(),
    summary,
    codes,
    repos,
    extLinks,
    images,
    diagrams,
  };
}

/**
 * @returns {Array} flat list of concept nodes (level 2 parents followed
 *          by their level 3 children — callers can group by chapterLabel
 *          and indent on level).
 */
export function extractConcepts(md, meta) {
  const out = [];
  const seen = new Set();
  let skipChildren = false; // ### children of skipped ## sections (labs, quizzes)
  splitSections(md).forEach((c, i) => {
    if (c.level < 2) return;          // chapter H1 title — not a concept
    if (c.level === 2) skipChildren = SKIP_RE.test(c.title);
    if (skipChildren) return;
    const node = chunkToConcept(c, meta, i);
    if (seen.has(node.id)) node.id = `${node.id}-${i}`;
    seen.add(node.id);
    out.push(node);
  });
  return out;
}
