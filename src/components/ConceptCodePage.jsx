import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from './Layout';
import { useCourse } from '../context/CourseContext';
import { findDocCourse, docProgressId } from './DocChapterPage';
import { resolveReferenceViewer } from '../utils/referenceViewers';
import { extractConcepts } from '../utils/conceptIndex';
import { fetchRepoBundle, fetchText, parseGitHubUrl, matchConceptToRepo } from '../utils/github';
import { buildReferenceGraph, refId } from '../utils/referenceGraph';
import { highlightLine } from '../utils/syntaxHighlight';
import GitHubPreciseCodeExplorerModal from './GitHubPreciseCodeExplorerModal';

/**
 * ConceptCodePage — /courses/:categoryId/:courseId/concept-code
 *
 * A concept → code map across the whole course: every `##` section of
 * every chapter becomes a concept card; clicking it shows the concept's
 * summary, its own code blocks (syntax highlighted) and any linked
 * reference repos — which open the same in-app explorer used by
 * DocChapterPage. Fully data-driven; works for any docs course.
 */
export default function ConceptCodePage({
  pageTitle = 'Concept & Code',
  pageSubtitle = 'Every concept in the course mapped to the code that implements it.',
  searchPlaceholder = 'Filter concepts…',
  codeIcon = '🧩',
}) {
  const { categoryId, courseId } = useParams();
  const navigate = useNavigate();
  const { setExternalModule } = useCourse();
  const { category, course } = findDocCourse(categoryId, courseId);
  const base = course?.contentBase || category?.contentBase || '/';

  const [searchParams, setSearchParams] = useSearchParams();
  const [concepts, setConcepts] = useState(null);
  const [activeId, setActiveId] = useState(searchParams.get('c'));
  const [filter, setFilter] = useState('');
  const [refLink, setRefLink] = useState(null); // { url, Viewer, sha? }
  const [repoData, setRepoData] = useState({}); // url -> {owner,repo,branch,paths,commits,error}
  const [manifest, setManifest] = useState(null); // references.json — authored concept↔ref edges
  const [selFile, setSelFile] = useState(null); // {repoUrl,path,text,loading,conceptId}
  const [explorerSpec, setExplorerSpec] = useState(null); // code-explorer ref spec → precise modal
  const detailRef = useRef(null);
  const activeRef = useRef(activeId);
  const pendingScroll = useRef(searchParams.get('c')); // deep-link target

  // This page has no chapter module — clear any stale one so the TopBar
  // shows its defaults instead of a leftover chapter title.
  useEffect(() => {
    setExternalModule({ id: `${categoryId}-${courseId}-concept-code`, title: pageTitle, number: 'CC', sectionCount: 0 });
    return () => setExternalModule(null);
  }, [categoryId, courseId, pageTitle, setExternalModule]);

  // Fetch every chapter's markdown and extract its concept sections.
  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    setConcepts(null);
    // Authored reference manifest — the many-to-many map keyed by
    // concept id (missing file is fine; auto-matching still runs).
    fetch(`${base}references.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(m => { if (!cancelled) setManifest(m); })
      .catch(() => {});

    Promise.all(course.chapters.map((ch, i) =>
      fetch(`${base}${ch.file}`)
        .then(r => (r.ok ? r.text() : ''))
        .then(md => extractConcepts(md, {
          chapterId: ch.id,
          chapterLabel: String(i + 1).padStart(2, '0'),
        }))
        .catch(() => [])
    )).then(all => {
      if (cancelled) return;
      const flat = all.flat();
      setConcepts(flat);
      // Deep-link ?c=<conceptId> wins; else first concept with code.
      const fromUrl = flat.find(c => c.id === searchParams.get('c'));
      const first = fromUrl || flat.find(c => c.codes.length) || flat[0];
      if (first) setActiveId(first.id);
    });
    return () => { cancelled = true; };
  }, [course, base]);

  // Prefetch bundles for every repo referenced anywhere — concept links
  // AND manifest refs — needed for the many-to-many backlink counts.
  useEffect(() => {
    if (!concepts) return;
    const urls = new Set(concepts.flatMap(c => c.repos));
    for (const mc of Object.values(manifest?.concepts || {})) {
      for (const r of mc.refs || []) {
        const repo = r.kind === 'repo' ? (r.url || r.repo) : (r.repo || null);
        if (repo) urls.add(/^https?:/.test(repo) ? repo : `https://github.com/${repo}`);
      }
    }
    urls.forEach(async (u) => {
      if (repoData[u]) return;
      const r = parseGitHubUrl(u);
      if (!r) return;
      try {
        const bundle = await fetchRepoBundle(r.owner, r.repo);
        setRepoData(d => ({ ...d, [u]: { ...r, url: u, ...bundle } }));
      } catch (e) {
        setRepoData(d => ({ ...d, [u]: { ...r, url: u, error: e.message } }));
      }
    });
  }, [concepts, manifest, repoData]);

  const visible = useMemo(() => {
    if (!concepts) return [];
    const q = filter.trim().toLowerCase();
    return q ? concepts.filter(c => c.title.toLowerCase().includes(q)) : concepts;
  }, [concepts, filter]);

  // The many-to-many index — rebuilt when concepts, repo data or the
  // authored manifest arrive.
  const graph = useMemo(() => buildReferenceGraph(concepts, repoData, manifest), [concepts, repoData, manifest]);

  // Scroll-spy: the detail pane is a continuous scroll of every visible
  // concept — the URL bookmark (?c=) and tree highlight follow the
  // section currently at the top of the viewport.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const secs = detailRef.current?.querySelectorAll('[data-cid]');
        if (!secs?.length) return;
        let cur = secs[0];
        for (const s of secs) {
          if (s.getBoundingClientRect().top <= 150) cur = s;
          else break;
        }
        const id = cur.dataset.cid;
        if (id && id !== activeRef.current) {
          activeRef.current = id;
          setActiveId(id);
          setSearchParams({ c: id }, { replace: true });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [setSearchParams]);

  // Deep-link: scroll to the ?c= target once concepts render. Lazy images
  // shift layout as they load, so retry the scroll a few times to settle.
  useEffect(() => {
    if (!concepts || !pendingScroll.current) return;
    const el = document.getElementById(pendingScroll.current);
    if (el) {
      pendingScroll.current = null;
      [80, 400, 1200].forEach(ms =>
        setTimeout(() => el.scrollIntoView({ block: 'start' }), ms));
    }
  }, [concepts]);

  // Keep the tree item for the active concept inside the list viewport.
  useEffect(() => {
    const item = document.querySelector('.cc-item.active');
    const box = item?.closest('.cc-items');
    if (!item || !box) return;
    if (item.offsetTop < box.scrollTop || item.offsetTop + item.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = item.offsetTop - box.clientHeight / 2;
    }
  }, [activeId]);

  // Filtering changes the stack — restart at the top.
  useEffect(() => { window.scrollTo(0, 0); }, [filter]);

  if (!course) return <Navigate to={`/courses/${categoryId}`} replace />;

  const selectConcept = (id) => {
    activeRef.current = id;
    setActiveId(id);
    setSearchParams({ c: id }, { replace: true }); // bookmarkable
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openRef = (url, sha = null) => {
    const Viewer = resolveReferenceViewer(url);
    if (Viewer) setRefLink({ url, Viewer, sha });
    else window.open(url, '_blank', 'noopener');
  };

  const openRepoFile = async (repoInfo, path, conceptId) => {
    setSelFile({ repoUrl: repoInfo.url || `${repoInfo.owner}/${repoInfo.repo}`, path, text: null, loading: true, conceptId });
    try {
      const text = await fetchText(
        `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${repoInfo.branch}/${path}`,
        `file:${repoInfo.owner}/${repoInfo.repo}@${repoInfo.branch}:${path}`);
      setSelFile(s => (s?.path === path ? { ...s, text, loading: false } : s));
    } catch {
      setSelFile(s => (s?.path === path ? { ...s, loading: false } : s));
    }
  };

  const sidebarItems = course.chapters.map((ch, i) => ({
    id: ch.id,
    icon: '📄',
    number: String(i + 1).padStart(2, '0'),
    title: (ch.title || '').replace(/^\d+\s*[—–.\-:]\s*/, '').trim() || ch.title,
    to: `/courses/${categoryId}/${courseId}/${ch.id}`,
    progressId: docProgressId(categoryId, courseId, ch.id),
  }));

  return (
    <Layout
      topBarProps={{ onLogoClick: () => navigate('/') }}
      sideBarProps={{
        sectionTitle: course.title,
        items: sidebarItems,
        activeId: '__concept-code',
        onSelectItem: id => navigate(`/courses/${categoryId}/${courseId}/${id}`),
        footer: (
          <>
            <Link to={`/courses/${categoryId}/${courseId}/concept-code`}
              className="btn btn-sm btn-ghost"
              style={{ width: '100%', textDecoration: 'none', color: 'var(--color-primary-500)', fontWeight: 700 }}>
              {codeIcon} {pageTitle}
            </Link>
            <Link to={`/courses/${categoryId}`} className="btn btn-sm btn-ghost"
              style={{ width: '100%', textDecoration: 'none', color: 'var(--color-neutral-400)' }}>
              ← Back to {category.title}
            </Link>
          </>
        ),
      }}
    >
      <div className="cc-page">
        <header className="cc-head">
          <h1 className="cc-title">{codeIcon} {pageTitle}</h1>
          <p className="cc-sub">{pageSubtitle}</p>
        </header>

        <div className="cc-split">
          {/* concept index */}
          <div className="cc-list">
            <input
              className="cc-search" type="search" value={filter}
              placeholder={searchPlaceholder}
              onChange={e => setFilter(e.target.value)}
            />
            <div className="cc-items">
              {!concepts && <div className="cc-empty">Loading concepts…</div>}
              {concepts && visible.length === 0 && <div className="cc-empty">No matching concepts.</div>}
              {visible.map((c, i) => {
                const showGroup = i === 0 || visible[i - 1].chapterLabel !== c.chapterLabel;
                return (
                  <div key={c.id}>
                    {showGroup && <div className="cc-group">Chapter {c.chapterLabel}</div>}
                    <button type="button"
                      className={`cc-item${c.id === activeId ? ' active' : ''}${c.level === 3 ? ' cc-child' : ''}`}
                      onClick={() => selectConcept(c.id)}
                      title={`id: ${c.id}`}>
                      <span className="cc-item-ch">{c.chapterLabel}</span>
                      <span className="cc-item-title">{c.title}</span>
                      <span className="cc-item-meta">
                        {c.codes.length > 0 && <span className="cc-tag">{c.codes.length} code</span>}
                        {c.repos.length > 0 && <span className="cc-tag repo">⌥ repo</span>}
                        {c.images.length > 0 && <span className="cc-tag">🖼 {c.images.length}</span>}
                        {c.diagrams > 0 && <span className="cc-tag">◈ {c.diagrams} diagram{c.diagrams > 1 ? 's' : ''}</span>}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* concept detail + code viewer — continuous scroll, every
              visible concept is a bookmarkable section (id = concept id) */}
          <div className="cc-detail" ref={detailRef}>
            {!concepts && <div className="cc-empty">Loading concepts…</div>}
            {concepts && visible.map(c => (
              <section key={c.id} id={c.id} data-cid={c.id}
                className={`cc-sec${c.id === activeId ? ' active' : ''}`}>
                <div className="cc-detail-head">
                  <span className="cc-detail-ch">Chapter {c.chapterLabel}</span>
                  <h2 className="cc-detail-title">{c.title}</h2>
                  {c.summary && <p className="cc-detail-summary">{c.summary}</p>}
                  <Link className="cc-open-chapter"
                    to={`/courses/${categoryId}/${courseId}/${c.chapterId}`}>
                    Open full chapter →
                  </Link>
                </div>

                {c.repos.length > 0 && (
                  <div className="cc-repos">
                    <div className="cc-repos-title">📚 Linked references</div>
                    {c.repos.map(u => {
                      const sharers = graph.conceptsFor(refId.repo(u)).filter(n => n.id !== c.id);
                      return (
                        <button key={u} type="button" className="cc-repo-chip"
                          title={sharers.length ? `Also referenced by: ${sharers.map(n => `${n.chapterLabel} · ${n.title}`).join(', ')}` : u}
                          onClick={() => openRef(u)}>
                          🐙 {u.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                          {sharers.length > 0 && <em className="cc-shared">⇄{sharers.length + 1}</em>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* authored manifest refs (references.json) — the precise
                    concept ↔ knowledge-base mapping */}
                {(() => {
                  const authored = graph.refsFor(c.id).filter(r => r.authored);
                  if (!authored.length) return null;
                  return (
                    <div className="cc-mapped cc-authored">
                      <div className="cc-mapped-repo">📌 Mapped references</div>
                      <div className="cc-mapped-row">
                        <span className="cc-mapped-chips">
                          {authored.map(r => {
                            if (r.kind === 'repo') return (
                              <button key={r.id} type="button" className="cc-repo-chip"
                                title={r.title || r.url} onClick={() => openRef(r.url)}>🐙 {r.label}</button>
                            );
                            if (r.kind === 'file') return (
                              <button key={r.id} type="button"
                                className={`ghx-concept-file${selFile?.path === r.path ? ' cc-sel' : ''}`}
                                title={`${r.repo}: ${r.path}`}
                                onClick={() => openRepoFile(
                                  { owner: r.owner, repo: r.repo, url: r.repoUrl, branch: repoData[r.repoUrl]?.branch || 'main' },
                                  r.path, c.id)}>
                                📄 {r.title || r.path.split('/').pop()}
                              </button>
                            );
                            if (r.kind === 'commit') return (
                              <button key={r.id} type="button" className="ghx-concept-commit"
                                title={r.title || r.sha}
                                onClick={() => openRef(r.repoUrl, r.sha)}>
                                🕓 {r.sha.slice(0, 7)} · {(r.title || r.msg || '').slice(0, 34)}
                              </button>
                            );
                            if (r.kind === 'code-explorer') return (
                              <button key={r.id} type="button" className="cc-repo-chip cc-xplr-chip"
                                title={`${r.spec.files.length} curated files @ ${r.spec.ref || 'HEAD'}`}
                                onClick={() => setExplorerSpec(r.spec)}>
                                🧭 {r.title || 'Code walkthrough'} <em className="cc-shared">{r.spec.files.length} files</em>
                              </button>
                            );
                            return (
                              <a key={r.id} className="ghx-concept-file" href={r.url}
                                target="_blank" rel="noreferrer"
                                onClick={e => { if (resolveReferenceViewer(r.url)) { e.preventDefault(); openRef(r.url); } }}>
                                🔗 {r.title || r.url}
                              </a>
                            );
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* concept → repo mapping: only the files & commits that
                    match THIS concept's keywords */}
                {c.repos.map(u => {
                  const rd = repoData[u];
                  const m = rd?.paths ? matchConceptToRepo(c.title, rd.paths, rd.commits) : null;
                  const repoName = u.replace(/^https?:\/\/(www\.)?github\.com\//, '');
                  if (!rd || rd.error) return null;
                  return (
                    <div key={u} className="cc-mapped">
                      <div className="cc-mapped-repo">🐙 {repoName}</div>
                      {m.files.length > 0 && (
                        <div className="cc-mapped-row">
                            <span className="cc-mapped-label">📄 Relevant files</span>
                          <span className="cc-mapped-chips">
                            {m.files.map(f => {
                              const sharers = graph.conceptsFor(refId.file(rd.owner, rd.repo, f)).filter(n => n.id !== c.id);
                              return (
                                <button key={f} type="button"
                                  className={`ghx-concept-file${selFile?.path === f ? ' cc-sel' : ''}`}
                                  title={sharers.length ? `Also referenced by: ${sharers.map(n => n.title).join(', ')}` : f}
                                  onClick={() => openRepoFile(rd, f, c.id)}>
                                  {f.split('/').pop()}
                                  {sharers.length > 0 && <em className="cc-shared">⇄{sharers.length + 1}</em>}
                                </button>
                              );
                            })}
                          </span>
                        </div>
                      )}
                      {m.commits.length > 0 && (
                        <div className="cc-mapped-row">
                          <span className="cc-mapped-label">🕓 Related commits</span>
                          <span className="cc-mapped-chips">
                            {m.commits.map(cm => {
                              const sharers = graph.conceptsFor(refId.commit(rd.owner, rd.repo, cm.sha)).filter(n => n.id !== c.id);
                              return (
                                <button key={cm.sha} type="button" className="ghx-concept-commit"
                                  title={`${cm.commit?.message?.split('\n')[0]}${sharers.length ? `\nAlso referenced by: ${sharers.map(n => n.title).join(', ')}` : ''}`}
                                  onClick={() => openRef(u, cm.sha)}>
                                  {cm.sha.slice(0, 7)} · {(cm.commit?.message || '').split('\n')[0].slice(0, 32)}
                                  {sharers.length > 0 && <em className="cc-shared">⇄{sharers.length + 1}</em>}
                                </button>
                              );
                            })}
                          </span>
                        </div>
                      )}
                      {!m.files.length && !m.commits.length && (
                        <div className="cc-empty" style={{ padding: '8px 0' }}>No files/commits match this concept in {repoName}.</div>
                      )}
                    </div>
                  );
                })}

                {/* inline repo file viewer — anchored to this section */}
                {selFile && selFile.conceptId === c.id && (
                  <div className="code-block cc-code">
                    <div className="code-block-header">
                      <span className="code-block-lang">{selFile.path}</span>
                      <div className="code-block-actions">
                        <button type="button" className="ghx-mini-btn" onClick={() => setSelFile(null)}>✕</button>
                      </div>
                    </div>
                    {selFile.loading && <div className="ghx-loading">Loading file…</div>}
                    {!selFile.loading && selFile.text != null && (
                      <pre className="ghx-code cc-code-body">
                        {selFile.text.split('\n').map((l, li) => (
                          <div key={li} className="ghx-line">
                            <span className="ghx-ln">{li + 1}</span>
                            <span className="ghx-lc" dangerouslySetInnerHTML={{ __html: highlightLine(l) || '&nbsp;' }} />
                          </div>
                        ))}
                      </pre>
                    )}
                    {!selFile.loading && selFile.text == null && (
                      <div className="ghx-loading">Could not load this file — open the repo to view it.</div>
                    )}
                  </div>
                )}

                {/* diagram/screenshot references — part of the concept's
                    knowledge base, rendered inline without leaving the page */}
                {c.images.length > 0 && (
                  <div className="cc-images">
                    {c.images.map(im => (
                      <img key={im.id} id={im.id} src={`${base}${im.path}`} alt={c.title}
                        loading="lazy" className="cc-img" />
                    ))}
                  </div>
                )}

                {c.codes.length === 0 && c.images.length === 0 && c.repos.length === 0 && (
                  <div className="cc-empty">This concept has no code snippet — see the chapter for diagrams.</div>
                )}
                {c.codes.map((blk, i) => (
                  <div key={blk.id} id={blk.id} className="code-block cc-code">
                    <div className="code-block-header">
                      <span className="code-block-lang">{blk.lang || 'text'}</span>
                      <div className="code-block-actions">
                        <button type="button" className="ghx-mini-btn" title="Copy link to this block"
                          onClick={() => navigator.clipboard?.writeText(
                            `${location.origin}${location.pathname}?c=${encodeURIComponent(blk.id)}`)}>🔗</button>
                        <button type="button" className="ghx-mini-btn"
                          onClick={() => navigator.clipboard?.writeText(blk.code)}>Copy</button>
                      </div>
                    </div>
                    <pre className="ghx-code cc-code-body">
                      {blk.code.split('\n').map((l, li) => (
                        <div key={li} className="ghx-line">
                          <span className="ghx-ln">{li + 1}</span>
                          <span className="ghx-lc" dangerouslySetInnerHTML={{ __html: highlightLine(l) || '&nbsp;' }} />
                        </div>
                      ))}
                    </pre>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>

      {refLink && (
        <refLink.Viewer open url={refLink.url} initialSha={refLink.sha} onClose={() => setRefLink(null)} />
      )}
      {explorerSpec && (
        <GitHubPreciseCodeExplorerModal open spec={explorerSpec} onClose={() => setExplorerSpec(null)} />
      )}
    </Layout>
  );
}
