import { matchConceptToRepo } from './github.js';

/**
 * referenceGraph — many-to-many concept ↔ reference index.
 *
 * Nodes:
 *   concept  — a chapter section (stable bookmarkable id)
 *   repo     — a github repository link
 *   file     — a file inside a repo (matched to the concept by keywords)
 *   commit   — a commit sha inside a repo (matched by message)
 *   image    — a chapter asset (screenshots/diagrams are references too)
 *   link     — any other external reference
 *
 * Edges are stored both directions so a single file/commit that serves
 * multiple concepts produces backlinks ("shared by N concepts"), and the
 * model scales to new reference kinds by appending add() calls — the UI
 * never hardcodes them.
 */

export const refId = {
  repo: (url) => `repo:${url}`,
  file: (owner, repo, path) => `file:${owner}/${repo}:${path}`,
  commit: (owner, repo, sha) => `commit:${owner}/${repo}@${sha}`,
  image: (chapterId, path) => `img:${chapterId}:${path}`,
  code: (blockId) => `code:${blockId}`,
  link: (url) => `link:${url}`,
};

const toRepoUrl = (s) => (/^https?:/.test(s) ? s : `https://github.com/${s}`);
const parseRepo = (s) => {
  const m = toRepoUrl(s).match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, ''), url: toRepoUrl(s) } : null;
};

export function buildReferenceGraph(concepts, repoData = {}, manifest = null) {
  const nodes = new Map();    // id -> node
  const outE = new Map();     // conceptId -> Set(refId)
  const inE = new Map();      // refId -> Set(conceptId)

  const edge = (cid, ref) => {
    nodes.set(ref.id, ref);
    if (!outE.has(cid)) outE.set(cid, new Set());
    outE.get(cid).add(ref.id);
    if (!inE.has(ref.id)) inE.set(ref.id, new Set());
    inE.get(ref.id).add(cid);
  };

  for (const c of concepts || []) {
    nodes.set(c.id, { id: c.id, kind: 'concept', title: c.title, chapterId: c.chapterId, chapterLabel: c.chapterLabel });
    (c.repos || []).forEach(u => edge(c.id, { id: refId.repo(u), kind: 'repo', url: u, label: u.split('github.com/')[1] || u }));

    // Authored manifest edges — explicit concept ↔ reference mappings
    // (files, commits, repos, links, future kinds). These are the precise
    // counterpart to the keyword auto-matching below.
    for (const r of manifest?.concepts?.[c.id]?.refs || []) {
      if (r.kind === 'repo') {
        const u = toRepoUrl(r.url || r.repo);
        edge(c.id, { id: refId.repo(u), kind: 'repo', url: u, label: r.title || u.split('github.com/')[1] || u, authored: true });
      } else if (r.kind === 'file' && r.repo && r.path) {
        const p = parseRepo(r.repo);
        if (p) edge(c.id, { id: refId.file(p.owner, p.repo, r.path), kind: 'file', path: r.path, title: r.title, owner: p.owner, repo: p.repo, repoUrl: p.url, authored: true });
      } else if (r.kind === 'commit' && r.repo && r.sha) {
        const p = parseRepo(r.repo);
        if (p) edge(c.id, { id: refId.commit(p.owner, p.repo, r.sha), kind: 'commit', sha: r.sha, msg: r.title || r.sha, repoUrl: p.url, authored: true });
      } else if (r.url) {
        edge(c.id, { id: refId.link(r.url), kind: r.kind || 'link', url: r.url, title: r.title, authored: true });
      }
    }
    (c.images || []).forEach(im => edge(c.id, { id: refId.image(c.chapterId, im.path || im), kind: 'image', path: im.path || im, chapterId: c.chapterId, elemId: im.id }));
    (c.codes || []).forEach(b => edge(c.id, { id: refId.code(b.id), kind: 'code', lang: b.lang, elemId: b.id, chapterId: c.chapterId }));
    (c.extLinks || []).forEach(u => edge(c.id, { id: refId.link(u), kind: 'link', url: u }));
    for (const u of c.repos || []) {
      const rd = repoData[u];
      if (!rd?.paths) continue;
      const m = matchConceptToRepo(c.title, rd.paths, rd.commits);
      m.files.forEach(f => edge(c.id, {
        id: refId.file(rd.owner, rd.repo, f), kind: 'file', path: f,
        owner: rd.owner, repo: rd.repo, branch: rd.branch, repoUrl: u,
      }));
      m.commits.forEach(cm => edge(c.id, {
        id: refId.commit(rd.owner, rd.repo, cm.sha), kind: 'commit', sha: cm.sha,
        msg: (cm.commit?.message || '').split('\n')[0], owner: rd.owner, repo: rd.repo, repoUrl: u,
      }));
    }
  }

  const refsFor = (cid) => [...(outE.get(cid) || [])].map(id => nodes.get(id));
  const conceptsFor = (rid) => [...(inE.get(rid) || [])].map(id => nodes.get(id)).filter(Boolean);
  return { nodes, refsFor, conceptsFor, shareCount: (rid) => (inE.get(rid) || new Set()).size };
}
