/**
 * Shared GitHub fetch helpers — used by GitHubExplorerModal and any
 * component that needs repo data (concept-code page, future viewers).
 * Responses are cached in sessionStorage (unauthenticated API ≈60 req/hr;
 * raw.githubusercontent.com file fetches don't count against it).
 */

const GH_CACHE_TTL = 10 * 60 * 1000; // 10 min

export function parseGitHubUrl(url, hostRe = /(^|\.)github\.com$/) {
  try {
    const u = new URL(url);
    if (!hostRe.test(u.hostname)) return null;
    const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length < 2) return null;
    const [owner, repoRaw] = parts;
    const repo = repoRaw.replace(/\.git$/, '');
    let branch = null, path = '';
    if (parts[2] === 'blob' || parts[2] === 'tree') {
      branch = parts[3];
      path = parts.slice(4).join('/');
    }
    return { owner, repo, branch, path, kind: parts[2] === 'blob' ? 'file' : 'repo' };
  } catch { return null; }
}

const cacheGet = (key) => {
  try {
    const raw = sessionStorage.getItem(`ghx:${key}`);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    return Date.now() - ts < GH_CACHE_TTL ? data : null;
  } catch { return null; }
};
const cacheSet = (key, data) => {
  try { sessionStorage.setItem(`ghx:${key}`, JSON.stringify({ ts: Date.now(), data })); } catch { /* quota */ }
};

export async function ghFetch(url, cacheKey) {
  const hit = cacheGet(cacheKey ?? url);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(res.status === 403 ? 'rate-limit' : `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  cacheSet(cacheKey ?? url, data);
  return data;
}

export async function fetchText(url, cacheKey) {
  const hit = cacheGet(cacheKey ?? url);
  if (hit != null) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  cacheSet(cacheKey ?? url, text);
  return text;
}

/* ── repo content bundle: meta + file paths + recent commits ── */
export async function fetchRepoBundle(owner, repo, apiBase = 'https://api.github.com') {
  const meta = await ghFetch(`${apiBase}/repos/${owner}/${repo}`, `meta:${owner}/${repo}`);
  const branch = meta.default_branch || 'main';
  const [tree, commits] = await Promise.all([
    ghFetch(`${apiBase}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, `tree:${owner}/${repo}@${branch}`),
    ghFetch(`${apiBase}/repos/${owner}/${repo}/commits?per_page=30`, `commits30:${owner}/${repo}`).catch(() => []),
  ]);
  return {
    meta,
    branch,
    paths: (tree.tree || [])
      .filter(n => n.type === 'blob' && !n.path.startsWith('.git'))
      .map(n => n.path)
      .slice(0, 4000),
    commits: Array.isArray(commits) ? commits : [],
  };
}

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'your', 'what', 'how', 'why', 'when', 'are', 'you', 'that', 'this', 'first', 'using', 'use', 'get', 'chapter', 'deep', 'dive']);

/** Keywords pulled from a concept title ("2.9 🚀 Deploy — agentcore launch" → [deploy, agentcore, launch]). */
export function conceptKeywords(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

/**
 * Map a concept to the repo files and commits most relevant to it.
 * Score = number of distinct concept keywords present (path or message).
 */
export function matchConceptToRepo(title, paths, commits, { maxFiles = 8, maxCommits = 5 } = {}) {
  const kws = conceptKeywords(title);
  if (!kws.length) return { files: [], commits: [] };
  const score = (text) => {
    const t = text.toLowerCase();
    return kws.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0);
  };
  const files = (paths || [])
    .filter(p => score(p) > 0 && /\.(py|js|ts|jsx|tsx|mjs|sh|yaml|yml|json|toml|md|Dockerfile)$/i.test(p))
    .sort((a, b) => score(b) - score(a) || a.length - b.length)
    .slice(0, maxFiles);
  const matchedCommits = (commits || [])
    .filter(c => score(c.commit?.message || '') > 0)
    .sort((a, b) => score(b.commit?.message) - score(a.commit?.message))
    .slice(0, maxCommits);
  return { files, commits: matchedCommits };
}
