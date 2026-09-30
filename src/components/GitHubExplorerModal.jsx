import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { highlightLine, escHtml } from '../utils/syntaxHighlight';
import { parseGitHubUrl, ghFetch, fetchText } from '../utils/github';

/**
 * GitHubExplorerModal — in-app preview for github.com links.
 *
 * Clicking a GitHub link inside a chapter opens this modal instead of
 * navigating away: repo metadata, an auto-derived "concept map" (entry
 * point, tools, config, docs), a browsable file tree and a syntax-
 * highlighted code viewer. Everything is fetched live from the public
 * GitHub API / raw host and cached in sessionStorage (unauthenticated
 * API is limited to ~60 req/hr, raw.githubusercontent.com is not).
 *
 * Fully data-driven: no repo names or course content is hardcoded.
 */

/* ── concept map: pick the files that explain how the repo works ── */
const CONCEPT_RULES = [
  { icon: '🚪', label: 'Entry point', re: /(^|\/)(main|app|agent|server|index|__main__)\.(py|js|ts|mjs|jsx|tsx)$/i },
  { icon: '🛠️', label: 'Tools / capabilities', re: /tool/i },
  { icon: '🌐', label: 'MCP integration', re: /mcp/i },
  { icon: '🔐', label: 'Auth / Identity', re: /oauth|auth|identity|token|credential/i },
  { icon: '🧠', label: 'Memory / state', re: /memory|state|dynamo|db|store/i },
  { icon: '📊', label: 'Observability', re: /observ|telemetry|trace|otel|opentelemetry|logging/i },
  { icon: '🚀', label: 'Deployment', re: /deploy|docker|cdk|fargate|lambda|launch/i },
  { icon: '⚙️', label: 'Config / deps', re: /(^|\/)(requirements\.txt|pyproject\.toml|package\.json|\.env\.example|Dockerfile)/i },
  { icon: '📖', label: 'Docs', re: /(^|\/)readme/i },
];

/* Each concept gets its relevant files AND the commits that touched that
   theme — files match on path, commits match on message. */
function conceptMap(treePaths, commits, rules) {
  return rules
    .map(rule => ({
      ...rule,
      files: treePaths.filter(p => rule.re.test(p)).slice(0, 4),
      commits: (commits || []).filter(c => rule.re.test(c.commit?.message || '')).slice(0, 4),
    }))
    .filter(c => c.files.length || c.commits.length);
}

/* ── file tree ── */
function buildTree(paths) {
  const root = { name: '', dirs: new Map(), files: [] };
  for (const p of paths) {
    const segs = p.split('/');
    let node = root;
    for (let i = 0; i < segs.length - 1; i++) {
      if (!node.dirs.has(segs[i])) node.dirs.set(segs[i], { name: segs[i], dirs: new Map(), files: [], full: segs.slice(0, i + 1).join('/') });
      node = node.dirs.get(segs[i]);
    }
    node.files.push({ name: segs[segs.length - 1], full: p });
  }
  return root;
}

function FileTree({ node, depth = 0, onPick, activePath }) {
  const dirs = [...node.dirs.values()].sort((a, b) => a.name.localeCompare(b.name));
  const files = [...node.files].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div>
      {dirs.map(d => (
        <TreeDir key={d.full} node={d} depth={depth} onPick={onPick} activePath={activePath} />
      ))}
      {files.map(f => (
        <button key={f.full} type="button"
          className={`ghx-file${activePath === f.full ? ' active' : ''}`}
          style={{ paddingLeft: 10 + depth * 14 }}
          onClick={() => onPick(f.full)}>
          <span className="ghx-file-ico">📄</span>{f.name}
        </button>
      ))}
    </div>
  );
}

function TreeDir({ node, depth, onPick, activePath }) {
  const [open, setOpen] = useState(depth < 1);
  return (
    <div>
      <button type="button" className="ghx-dir" style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => setOpen(o => !o)}>
        <span className="ghx-dir-arrow">{open ? '▾' : '▸'}</span>📁 {node.name}
      </button>
      {open && <FileTree node={node} depth={depth + 1} onPick={onPick} activePath={activePath} />}
    </div>
  );
}

export default function GitHubExplorerModal({
  open,
  url,
  onClose,
  apiBase = 'https://api.github.com',
  rawBase = 'https://raw.githubusercontent.com',
  webBase = 'https://github.com',
  conceptRules = CONCEPT_RULES,
  conceptsTitle = '⚡ How this repo is organised',
  hint = 'Preview stays inside the course — click files on the left to explore.',
  openLabel = 'Open on GitHub ↗',
  initialSha = null,
}) {
  const hostRe = useMemo(() => {
    try { return new RegExp(`(^|\\.)${new URL(webBase).hostname.replace(/\./g, '\\.')}$`); }
    catch { return /(^|\.)github\.com$/; }
  }, [webBase]);
  const repo = useMemo(() => parseGitHubUrl(url || '', hostRe), [url, hostRe]);
  const [meta, setMeta] = useState(null);
  const [tree, setTree] = useState(null);        // array of blob paths
  const [commits, setCommits] = useState(null);  // recent commit history
  const [tab, setTab] = useState('files');       // files | commits
  const [activeSha, setActiveSha] = useState(null);
  const [commitDetail, setCommitDetail] = useState(null);
  const [commitLoading, setCommitLoading] = useState(false);
  const [fileRef, setFileRef] = useState(null);  // null = default branch
  const [error, setError] = useState(null);
  const [filePath, setFilePath] = useState(null);
  const [fileText, setFileText] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  const branch = meta?.default_branch || repo?.branch || 'main';

  useEffect(() => {
    if (!open || !repo) return;
    let cancelled = false;
    setMeta(null); setTree(null); setCommits(null); setError(null);
    setTab(initialSha ? 'commits' : 'files');
    setActiveSha(initialSha || null); setCommitDetail(null); setFileRef(null);
    setFilePath(repo.kind === 'file' && repo.path ? repo.path : null);
    setFileText(null);

    (async () => {
      try {
        const m = await ghFetch(`${apiBase}/repos/${repo.owner}/${repo.repo}`, `meta:${repo.owner}/${repo.repo}`);
        if (cancelled) return;
        setMeta(m);
        const br = repo.branch || m.default_branch || 'main';
        const t = await ghFetch(`${apiBase}/repos/${repo.owner}/${repo.repo}/git/trees/${br}?recursive=1`, `tree:${repo.owner}/${repo.repo}@${br}`);
        if (cancelled) return;
        const paths = (t.tree || [])
          .filter(n => n.type === 'blob' && !n.path.startsWith('.git'))
          .map(n => n.path)
          .slice(0, 4000);
        setTree(paths);
        ghFetch(`${apiBase}/repos/${repo.owner}/${repo.repo}/commits?per_page=15`,
          `commits:${repo.owner}/${repo.repo}`)
          .then(c => { if (!cancelled) setCommits(c); })
          .catch(() => {}); // commits are supplementary — never block the viewer
        // Auto-open the most instructive file if none was deep-linked.
        if (!repo.path) {
          const concepts = conceptMap(paths, null, conceptRules);
          const first = concepts.find(c => c.icon === '🚪')?.files[0]
            || paths.find(p => /(^|\/)readme\.(md|mdx|rst|txt)$/i.test(p))
            || paths[0];
          if (first) setFilePath(first);
        }
      } catch (e) {
        if (!cancelled) setError(e.message === 'rate-limit' ? 'rate-limit' : e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [open, url]);

  useEffect(() => {
    if (!open || !repo || !filePath || !meta) return;
    let cancelled = false;
    setFileText(null); setFileLoading(true);
    const ref = fileRef || branch;
    fetchText(`${rawBase}/${repo.owner}/${repo.repo}/${ref}/${filePath}`,
      `file:${repo.owner}/${repo.repo}@${ref}:${filePath}`)
      .then(t => { if (!cancelled) { setFileText(t); setFileLoading(false); } })
      .catch(() => { if (!cancelled) { setFileText(null); setFileLoading(false); } });
    return () => { cancelled = true; };
  }, [open, filePath, fileRef, meta]);

  // Commit → files-changed detail (diff patches included by the API).
  useEffect(() => {
    if (!open || !repo || !activeSha) return;
    let cancelled = false;
    setCommitDetail(null); setCommitLoading(true);
    ghFetch(`${apiBase}/repos/${repo.owner}/${repo.repo}/commits/${activeSha}`,
      `commit:${repo.owner}/${repo.repo}@${activeSha}`)
      .then(d => { if (!cancelled) { setCommitDetail(d); setCommitLoading(false); } })
      .catch(() => { if (!cancelled) setCommitLoading(false); });
    return () => { cancelled = true; };
  }, [open, activeSha, repo]);

  if (!open || !repo) return null;

  const root = tree ? buildTree(tree) : null;
  const concepts = tree ? conceptMap(tree, commits, conceptRules) : [];
  const isBinary = filePath && /\.(png|jpe?g|gif|svg|ico|woff2?|zip|pdf|ipynb)$/i.test(filePath);
  const lines = fileText ? fileText.split('\n') : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="🐙"
      title={`${repo.owner}/${repo.repo}`}
      subtitle={meta?.description || 'Loading repository…'}
      footer={
        <div className="ghx-footer">
          <span className="ghx-hint">{hint}</span>
          <a className="lab-btn lab-btn-primary" href={url} target="_blank" rel="noreferrer">{openLabel}</a>
        </div>
      }
    >
      {error ? (
        <div className="ghx-error">
          {error === 'rate-limit'
            ? 'GitHub API rate limit reached — open the repository directly instead.'
            : `Could not load repository (${error}).`}
          {' '}<a href={url} target="_blank" rel="noreferrer">{openLabel}</a>
        </div>
      ) : (
        <>
          {meta && (
            <div className="ghx-meta">
              <span className="ghx-chip">⭐ {meta.stargazers_count?.toLocaleString() ?? 0}</span>
              {meta.language && <span className="ghx-chip">🔤 {meta.language}</span>}
              <span className="ghx-chip">🌿 {branch}</span>
              {(meta.topics || []).slice(0, 4).map(t => <span key={t} className="ghx-chip">#{t}</span>)}
            </div>
          )}

          {concepts.length > 0 && (
            <div className="ghx-concepts">
              <div className="ghx-concepts-title">{conceptsTitle}</div>
              <div className="ghx-concept-list">
                {concepts.map(c => (
                  <div key={c.label} className="ghx-concept">
                    <span className="ghx-concept-label">{c.icon} {c.label}</span>
                    <span className="ghx-concept-files">
                      {c.files.map(f => (
                        <button key={f} type="button" className="ghx-concept-file"
                          onClick={() => { setFileRef(null); setFilePath(f); setTab('files'); }}>{f.split('/').pop()}</button>
                      ))}
                      {c.commits.map(cm => (
                        <button key={cm.sha} type="button" className="ghx-concept-commit"
                          title={cm.commit?.message?.split('\n')[0]}
                          onClick={() => { setActiveSha(cm.sha); setTab('commits'); }}>
                          🕓 {cm.sha.slice(0, 7)} · {(cm.commit?.message || '').split('\n')[0].slice(0, 32)}
                        </button>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ghx-tabs">
            <button type="button" className={`ghx-tab${tab === 'files' ? ' active' : ''}`}
              onClick={() => setTab('files')}>📂 Files</button>
            <button type="button" className={`ghx-tab${tab === 'commits' ? ' active' : ''}`}
              onClick={() => setTab('commits')}>🕓 Commits{commits ? ` (${commits.length})` : ''}</button>
          </div>

          {tab === 'commits' && (
            <div className="ghx-commits-split">
              <div className="ghx-commits">
                {!commits && <div className="ghx-loading">Loading commit history…</div>}
                {commits && commits.length === 0 && <div className="ghx-loading">No commits found.</div>}
                {commits?.map(c => (
                  <button key={c.sha} type="button"
                    className={`ghx-commit${activeSha === c.sha ? ' active' : ''}`}
                    onClick={() => setActiveSha(c.sha)}>
                    <span className="ghx-commit-sha">{c.sha.slice(0, 7)}</span>
                    <span className="ghx-commit-msg">{(c.commit?.message || '').split('\n')[0]}</span>
                    <span className="ghx-commit-meta">
                      {c.commit?.author?.name} · {c.commit?.author?.date ? new Date(c.commit.author.date).toLocaleDateString() : ''}
                    </span>
                  </button>
                ))}
              </div>
              <div className="ghx-commit-detail">
                {!activeSha && <div className="ghx-loading">Pick a commit — see exactly what changed.</div>}
                {commitLoading && <div className="ghx-loading">Loading commit…</div>}
                {commitDetail && (
                  <>
                    <div className="ghx-cd-head">
                      <div className="ghx-cd-msg">{commitDetail.commit?.message?.split('\n')[0]}</div>
                      <div className="ghx-cd-meta">
                        <span className="ghx-commit-sha">{commitDetail.sha.slice(0, 7)}</span>
                        {commitDetail.commit?.author?.name} · {commitDetail.commit?.author?.date ? new Date(commitDetail.commit.author.date).toLocaleDateString() : ''}
                        {commitDetail.stats && <> · <span className="diff-add">+{commitDetail.stats.additions}</span> <span className="diff-del">−{commitDetail.stats.deletions}</span></>}
                        <a className="ghx-mini-btn" target="_blank" rel="noreferrer"
                          href={`${webBase}/${repo.owner}/${repo.repo}/commit/${commitDetail.sha}`}>GitHub ↗</a>
                      </div>
                    </div>
                    {(commitDetail.files || []).map(f => (
                      <div key={f.filename} className="ghx-cfile">
                        <div className="ghx-cfile-head">
                          <span className={`ghx-cfile-status s-${f.status}`}>
                            {f.status === 'added' ? 'A' : f.status === 'removed' ? 'D' : 'M'}
                          </span>
                          <button type="button" className="ghx-cfile-name"
                            onClick={() => { setFileRef(commitDetail.sha); setFilePath(f.filename); setTab('files'); }}>
                            {f.filename}
                          </button>
                          <span className="ghx-cfile-stats">
                            <span className="diff-add">+{f.additions}</span>{' '}
                            <span className="diff-del">−{f.deletions}</span>
                          </span>
                        </div>
                        {f.patch && (
                          <pre className="ghx-diff">
                            {f.patch.split('\n').slice(0, 200).map((l, i) => (
                              <div key={i} className={`ghx-line ${l.startsWith('+') ? 'diff-add-bg' : l.startsWith('-') ? 'diff-del-bg' : l.startsWith('@@') ? 'diff-hunk' : ''}`}>
                                <span className="ghx-lc">{escHtml(l) || ' '}</span>
                              </div>
                            ))}
                          </pre>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'files' && (
          <div className="ghx-split">
            <div className="ghx-tree">
              {root
                ? <FileTree node={root} onPick={setFilePath} activePath={filePath} />
                : <div className="ghx-loading">Loading file tree…</div>}
            </div>
            <div className="ghx-viewer">
              {fileRef && (
                <div className="ghx-refbar">
                  Viewing snapshot @ {fileRef.slice(0, 7)}
                  <button type="button" className="ghx-mini-btn" onClick={() => setFileRef(null)}>
                    back to {branch}
                  </button>
                </div>
              )}
              {filePath && (
                <div className="ghx-viewer-header">
                  <span className="ghx-viewer-path">{filePath}</span>
                  <div className="ghx-viewer-actions">
                    <button type="button" className="ghx-mini-btn"
                      onClick={() => navigator.clipboard?.writeText(fileText || '')}>Copy</button>
                    <a className="ghx-mini-btn" target="_blank" rel="noreferrer"
                      href={`${webBase}/${repo.owner}/${repo.repo}/blob/${fileRef || branch}/${filePath}`}>{openLabel.replace('Open', 'View')}</a>
                  </div>
                </div>
              )}
              {fileLoading && <div className="ghx-loading">Loading file…</div>}
              {!fileLoading && fileText != null && !isBinary && (
                <pre className="ghx-code">
                  {lines.map((l, i) => (
                    <div key={i} className="ghx-line">
                      <span className="ghx-ln">{i + 1}</span>
                      <span className="ghx-lc" dangerouslySetInnerHTML={{ __html: highlightLine(l) || '&nbsp;' }} />
                    </div>
                  ))}
                </pre>
              )}
              {!fileLoading && filePath && isBinary && (
                <div className="ghx-loading">Binary file — <a target="_blank" rel="noreferrer"
                  href={`${webBase}/${repo.owner}/${repo.repo}/blob/${branch}/${filePath}`}>{openLabel.replace('Open', 'view')}</a></div>
              )}
              {!fileLoading && !filePath && <div className="ghx-loading">Pick a file on the left.</div>}
            </div>
          </div>
          )}
        </>
      )}
    </Modal>
  );
}
