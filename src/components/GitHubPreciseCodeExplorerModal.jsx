import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import Editor from '@monaco-editor/react';
import '../utils/monacoSetup.js';
import { resolveFetcher } from '../utils/codeSources.js';

/**
 * GitHubPreciseCodeExplorerModal — a curated, multi-file code walkthrough.
 *
 * Unlike GitHubExplorerModal (which browses a whole repo), this takes a
 * precise spec and shows ONLY those files — as an IDE-style view:
 * file tree on the left, tab strip + prev/next arrows on top, Monaco
 * editor (read-only) for the code, optional highlighted line ranges and
 * a per-file teaching note.
 *
 * Spec shape (data — nothing domain-specific lives in this component):
 *   {
 *     repo:  "owner/name" | "https://github.com/owner/name",
 *     ref:   "main" | "v1.2.0" | "abc1234",   // any git ref; default HEAD
 *     title: "Deploy a Strands agent",
 *     files: [{ path, label, highlights: [[start,end],…], note }, …]
 *   }
 *
 * Fully data-driven: fetchFile prop accepts any (ref, path) → text
 * adapter (see utils/codeSources.js) so other providers slot in.
 */

const LANG_BY_EXT = {
  py: 'python', js: 'javascript', mjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript', json: 'json', md: 'markdown',
  yml: 'yaml', yaml: 'yaml', sh: 'shell', bash: 'shell', tf: 'hcl',
  dockerfile: 'dockerfile', txt: 'plaintext', html: 'html', css: 'css',
};
const langFor = (path) =>
  LANG_BY_EXT[(path.split('/').pop().split('.').pop() || '').toLowerCase()]
  || (/dockerfile$/i.test(path) ? 'dockerfile' : 'plaintext');

/* Collapse the files[] paths into a folder tree (view of the same data). */
function treeFromPaths(files) {
  const root = { name: '', dirs: new Map(), files: [] };
  files.forEach((f, i) => {
    const segs = f.path.split('/');
    let node = root;
    for (let s = 0; s < segs.length - 1; s++) {
      if (!node.dirs.has(segs[s])) node.dirs.set(segs[s], { name: segs[s], dirs: new Map(), files: [] });
      node = node.dirs.get(segs[s]);
    }
    node.files.push({ name: segs[segs.length - 1], idx: i });
  });
  return root;
}

function TreeNode({ node, depth, active, onPick }) {
  const dirs = [...node.dirs.values()];
  return (
    <div>
      {dirs.map(d => <TreeDir key={d.name + depth} node={d} depth={depth} active={active} onPick={onPick} />)}
      {node.files.map(f => (
        <button key={f.idx} type="button"
          className={`ghx-file${active === f.idx ? ' active' : ''}`}
          style={{ paddingLeft: 10 + depth * 14 }} onClick={() => onPick(f.idx)}>
          <span className="ghx-file-ico">📄</span>{f.name}
        </button>
      ))}
    </div>
  );
}
function TreeDir({ node, depth, active, onPick }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button type="button" className="ghx-dir" style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => setOpen(o => !o)}>
        <span className="ghx-dir-arrow">{open ? '▾' : '▸'}</span>📁 {node.name}
      </button>
      {open && <TreeNode node={node} depth={depth + 1} active={active} onPick={onPick} />}
    </div>
  );
}

/**
 * PreciseCodeExplorer — the explorer body (tree + tabs + Monaco + notes),
 * usable inline in a page OR inside a modal. All fetch/state logic lives
 * here so both surfaces behave identically.
 */
export function PreciseCodeExplorer({
  spec,                        // { repo, ref, title, files[] }
  fetchFile,                   // optional (ref, file) → text adapter
  webBase = 'https://github.com',
  keysActive = true,           // ← → key nav — callers disable when a modal of the same spec is open
}) {
  const files = spec?.files || [];
  const ref = spec?.ref || 'HEAD';
  // IDE-style "resume where you left off" — last-viewed file per spec.
  const memKey = `ghpx:last:${spec?.repo}@${ref}:${files.map(f => f.path).join(',').length}:${files[0]?.path || ''}`;
  const [idx, setIdx] = useState(() => {
    const saved = Number(sessionStorage.getItem(memKey));
    return Number.isInteger(saved) && saved >= 0 && saved < files.length ? saved : 0;
  });
  const [code, setCode] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState(null); // onMount is async (loader.init)
  const decoRef = useRef(null); // monaco.IDecorationsCollection

  const file = files[idx];
  const fetcher = useMemo(() => resolveFetcher(spec, { fetchFile }), [spec, fetchFile]);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setLoading(true); setError(null); setCode(null);
    fetcher(ref, file)
      .then(t => { if (!cancelled) { setCode(t); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(`HTTP ${e.message || e}`); setLoading(false); } });
    return () => { cancelled = true; };
  }, [idx, spec]);

  useEffect(() => { sessionStorage.setItem(memKey, String(idx)); }, [idx]);

  // ← → arrow keys move through the authored file order (wraps around).
  // Skipped when focus is inside Monaco or an editable field so cursor
  // keys keep working there.
  useEffect(() => {
    if (!keysActive || files.length < 2) return;
    const onKey = (e) => {
      if (e.defaultPrevented) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.target?.closest?.('input, textarea, [contenteditable="true"], .monaco-editor')) return;
      e.preventDefault();
      setIdx(i => (((i + (e.key === 'ArrowRight' ? 1 : -1)) % files.length) + files.length) % files.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keysActive, files.length]);

  // Highlight ranges → Monaco line decorations. Runs when code lands,
  // when the editor finishes mounting (onMount resolves after
  // loader.init), and after model swaps — a language change between
  // files replaces the model, which clears model-bound decorations.
  // Highlight ranges → Monaco line decorations. Decorations live on the
  // model — a language change between files swaps models, so track which
  // model the collection was created on and rebuild on mismatch.
  const applyHighlights = () => {
    if (!editor || code == null) return;
    const model = editor.getModel();
    if (!model) return;
    const ranges = (file?.highlights || []).map(([a, b]) => ({
      range: { startLineNumber: a, startColumn: 1, endLineNumber: b, endColumn: 1 },
      options: { isWholeLine: true, className: 'ghpx-hl-line', linesDecorationsClassName: 'ghpx-hl-gutter' },
    }));
    if (!decoRef.current || decoRef.current.m !== model) {
      decoRef.current?.c?.clear?.();
      decoRef.current = { c: editor.createDecorationsCollection(), m: model };
    }
    decoRef.current.c.set(ranges); // set() replaces the whole collection
    if (ranges.length) editor.revealLineInCenter(ranges[0].range.startLineNumber);
  };
  useEffect(applyHighlights, [code, idx, editor]);
  useEffect(() => {
    if (!editor) return;
    const d = editor.onDidChangeModel(() => applyHighlights());
    return () => d.dispose();
  }, [editor, code, idx]);

  if (!spec || !files.length) return null;

  const repoSlug = (spec.repo || '').replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '');
  // External link only makes sense for repo files — local src/content
  // entries (generated artifacts) have no GitHub URL.
  const isRepoFile = !!file?.path && !file.src && file.content == null;
  const webUrl = spec.repo?.startsWith('http')
    ? `${spec.repo.replace(/\.git$/, '')}/tree/${ref}/${file?.path || ''}`
    : `${webBase}/${repoSlug}/blob/${ref}/${file?.path || ''}`;
  const tree = treeFromPaths(files);
  const pick = (i) => setIdx(((i % files.length) + files.length) % files.length);

  return (
    <div className="ghpx-wrap">
      {/* Left — file tree derived from the curated paths */}
      <div className="ghpx-tree">
        <TreeNode node={tree} depth={0} active={idx} onPick={pick} />
      </div>

      {/* Right — tab strip + arrows + Monaco */}
      <div className="ghpx-main">
        <div className="ghpx-tabs">
          <button type="button" className="ghpx-nav" onClick={() => pick(idx - 1)} title="Previous file (←)">◀</button>
          <div className="ghpx-tabrow">
            {files.map((f, i) => (
              <button key={i} type="button"
                className={`ghpx-tab${i === idx ? ' active' : ''}`}
                title={f.path || f.src} onClick={() => pick(i)}>
                {f.label || (f.path || f.src || '').split('/').pop()}
              </button>
            ))}
          </div>
          <button type="button" className="ghpx-nav" onClick={() => pick(idx + 1)} title="Next file (→)">▶</button>
        </div>

        <div className="ghpx-path">{file?.path || file?.src} <span className="ghpx-refchip">@{ref}</span></div>

        <div className="ghpx-editor">
          {loading && <div className="ghx-loading">Loading {file?.path || file?.src}…</div>}
          {error && (
            <div className="ghx-error">Could not load <code>{file?.path || file?.src}</code> at <code>{ref}</code> —{' '}
              {isRepoFile && <a href={webUrl} target="_blank" rel="noreferrer">view on GitHub</a>}</div>
          )}
          {code != null && (
            <Editor
              height="100%"
              language={langFor(file.path || file.src || '')}
              value={code}
              theme="vs-dark"
              onMount={(ed) => setEditor(ed)}
              options={{
                readOnly: true, domReadOnly: true, minimap: { enabled: false },
                fontSize: 12.5, lineNumbers: 'on', scrollBeyondLastLine: false,
                wordWrap: 'off', folding: true, renderLineHighlight: 'none',
                automaticLayout: true, contextmenu: false,
              }}
            />
          )}
        </div>

        <div className="ghpx-foot">
          {file?.note && <span className="ghpx-note">💡 {file.note}</span>}
          <span className="ghpx-dots">
            {files.map((_, i) => (
              <button key={i} type="button" className={`ghpx-dot${i === idx ? ' active' : ''}`}
                onClick={() => pick(i)} aria-label={`file ${i + 1}`} />
            ))}
          </span>
          <span className="ghpx-keys" title="Arrow keys switch files"><kbd>←</kbd><kbd>→</kbd></span>
          <span className="ghpx-pos">{idx + 1}/{files.length}</span>
          {isRepoFile && (
            <a className="ghpx-openlink" href={webUrl} target="_blank" rel="noreferrer"
              title="Open this file on GitHub">GitHub ↗</a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal wrapper — same explorer, in overlay chrome with a hint footer.
 */
export default function GitHubPreciseCodeExplorerModal({
  open,
  onClose,
  spec,
  fetchFile,
  webBase = 'https://github.com',
  hint = 'Curated walkthrough — switch files with the tabs, ◀ ▶, or ← → keys.',
}) {
  if (!open || !spec?.files?.length) return null;
  const repoSlug = (spec.repo || '').replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '');
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="🧭"
      title={spec.title || repoSlug}
      subtitle={`${repoSlug} @ ${spec.ref || 'HEAD'}`}
      footer={<div className="ghx-footer"><span className="ghx-hint">{hint}</span></div>}
    >
      <PreciseCodeExplorer spec={spec} fetchFile={fetchFile} webBase={webBase} />
    </Modal>
  );
}
