// Export a <FlowDiagram> tag's SVG rendering to a standalone .svg file.
// Mirrors FlowDiagramSection.jsx output — same palette, bezier edges, node cards.
// Usage: node scripts/export-flow-diagram.mjs <mdFile> <outSvg>
import fs from 'node:fs';

const [,, mdPath, outPath] = process.argv;
const md = fs.readFileSync(mdPath, 'utf-8');

const tag = md.match(/<FlowDiagram[\s\S]*?\/>/);
if (!tag) { console.error('No <FlowDiagram> tag found'); process.exit(1); }
const attrStr = tag[0];

const grab = (name) => {
  const m = attrStr.match(new RegExp(name + '\\s*=\\s*(["{])'));
  if (!m) return null;
  if (m[1] === '"') return attrStr.match(new RegExp(name + '="([^"]*)"'))[1];
  const i = attrStr.indexOf(m[0]) + m[0].length;
  let depth = 0, quote = null;
  for (let j = i; j < attrStr.length; j++) {
    const ch = attrStr[j];
    if (quote) { if (ch === quote && attrStr[j - 1] !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') { depth--; if (!depth) return attrStr.slice(i, j + 1); }
  }
  return null;
};
const evalLit = (s) => { try { return new Function(`return (${s});`)(); } catch { return undefined; } };

const title = grab('title') || 'Architecture';
const viewBox = evalLit(grab('viewBox')) || { w: 920, h: 560 };
const nodes = evalLit(grab('nodes')) || [];
const edges = evalLit(grab('edges')) || [];

const PALETTE = {
  trigger: { stroke: '#f59e0b', glow: '#f59e0b33', icon: '🎯' },
  compute: { stroke: '#fb923c', glow: '#fb923c33', icon: '⚙️' },
  security: { stroke: '#f87171', glow: '#f8717133', icon: '🔒' },
  storage: { stroke: '#60a5fa', glow: '#60a5fa33', icon: '🗄️' },
  event: { stroke: '#34d399', glow: '#34d39933', icon: '⚡' },
  output: { stroke: '#818cf8', glow: '#818cf833', icon: '📤' },
  monitoring: { stroke: '#e879f9', glow: '#e879f933', icon: '📊' },
  network: { stroke: '#38bdf8', glow: '#38bdf833', icon: '🌐' },
  client: { stroke: '#94a3b8', glow: '#94a3b833', icon: '🖥️' },
  group: { stroke: '#475569', glow: 'transparent', icon: '' },
};
const bg = '#0b1220', dot = '#1e293b', nodeBg = '#0f172acc', textCol = '#e2e8f0';
const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

const anchor = (n, side) => {
  const w = n.w || 190, h = n.h || 60;
  return {
    l: { x: n.x, y: n.y + h / 2 }, r: { x: n.x + w, y: n.y + h / 2 },
    t: { x: n.x + w / 2, y: n.y }, b: { x: n.x + w / 2, y: n.y + h },
  }[side];
};

const edgePath = (e) => {
  const a = byId[e.from], b = byId[e.to];
  if (!a || !b) return null;
  const aCx = a.x + (a.w || 190) / 2, bCx = b.x + (b.w || 190) / 2;
  const aCy = a.y + (a.h || 60) / 2, bCy = b.y + (b.h || 60) / 2;
  let p1, p2, c1, c2;
  if (Math.abs(bCx - aCx) >= Math.abs(bCy - aCy)) {
    const d = bCx > aCx ? ['r', 'l', 1] : ['l', 'r', -1];
    p1 = anchor(a, d[0]); p2 = anchor(b, d[1]);
    const dx = Math.max(40, Math.abs(p2.x - p1.x) / 2) * d[2];
    c1 = { x: p1.x + dx, y: p1.y }; c2 = { x: p2.x - dx, y: p2.y };
  } else {
    const d = bCy > aCy ? ['b', 't', 1] : ['t', 'b', -1];
    p1 = anchor(a, d[0]); p2 = anchor(b, d[1]);
    const dy = Math.max(40, Math.abs(p2.y - p1.y) / 2) * d[2];
    c1 = { x: p1.x, y: p1.y + dy }; c2 = { x: p2.x, y: p2.y - dy };
  }
  return { d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`, from: p1, to: p2,
    mid: { x: (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8, y: (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8 } };
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -30 ${viewBox.w} ${viewBox.h + 40}" font-family="Inter, sans-serif">
<defs>
  <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" fill="${dot}"/></pattern>
</defs>
<rect x="0" y="-30" width="${viewBox.w}" height="${viewBox.h + 40}" fill="${bg}"/>
<text x="14" y="-10" fill="#fb923c" font-size="13" font-weight="700">${esc(title)}</text>
<rect x="0" y="0" width="${viewBox.w}" height="${viewBox.h}" fill="url(#dots)"/>`;

for (const e of edges) {
  const p = edgePath(e); if (!p) continue;
  s += `<g><path d="${p.d}" fill="none" stroke="${e.color || '#64748b'}" stroke-width="1.8"${e.dashed || e.animated ? ' stroke-dasharray="6 5"' : ''}/>`
    + `<circle cx="${p.from.x}" cy="${p.from.y}" r="4" fill="${e.color || '#64748b'}"/><circle cx="${p.to.x}" cy="${p.to.y}" r="4" fill="${e.color || '#64748b'}"/>`
    + (e.label ? `<text x="${p.mid.x}" y="${p.mid.y - 8}" text-anchor="middle" fill="#94a3b8" font-size="11" style="paint-order:stroke;stroke:${bg};stroke-width:4">${esc(e.label)}</text>` : '')
    + `</g>`;
}

for (const n of nodes) {
  const pal = PALETTE[n.type] || PALETTE.client;
  const w = n.w || 190, h = n.h || 60;
  if (n.group) {
    s += `<g><rect x="${n.x}" y="${n.y}" width="${w}" height="${h}" rx="14" fill="${pal.glow}" stroke="${pal.stroke}" stroke-width="1.4" stroke-dasharray="5 4"/>`
      + `<text x="${n.x + 16}" y="${n.y + 26}" fill="${pal.stroke}" font-size="13" font-weight="700">${esc((n.icon ? n.icon + ' ' : '') + n.label)}</text></g>`;
    continue;
  }
  s += `<g><rect x="${n.x}" y="${n.y}" width="${w}" height="${h}" rx="12" fill="${nodeBg}" stroke="${pal.stroke}" stroke-width="1.6"/>`
    + `<circle cx="${n.x + 20}" cy="${n.y + h / 2}" r="13" fill="${pal.glow}" stroke="${pal.stroke}" stroke-width="1"/>`
    + `<text x="${n.x + 20}" y="${n.y + h / 2 + 4}" text-anchor="middle" font-size="13">${esc(n.icon || pal.icon)}</text>`
    + `<text x="${n.x + 40}" y="${n.y + (n.sub ? h / 2 - 2 : h / 2 + 5)}" fill="${textCol}" font-size="12.5" font-weight="600">${esc(n.label)}</text>`
    + (n.sub ? `<text x="${n.x + 40}" y="${n.y + h / 2 + 14}" fill="#94a3b8" font-size="10.5">${esc(n.sub)}</text>` : '')
    + `</g>`;
}
s += '</svg>';

fs.mkdirSync(outPath.replace(/[/\\][^/\\]*$/, ''), { recursive: true });
fs.writeFileSync(outPath, s);
console.log('Wrote', outPath, `${(s.length / 1024).toFixed(1)} KB`);
