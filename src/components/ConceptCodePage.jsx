import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Layout from './Layout';
import { useCourse } from '../context/CourseContext';
import { findDocCourse, docProgressId } from './DocChapterPage';
import { resolveReferenceViewer } from '../utils/referenceViewers';
import { extractConcepts } from '../utils/conceptIndex';
import { fetchRepoBundle, fetchText, parseGitHubUrl, matchConceptToRepo } from '../utils/github';
import { highlightLine } from '../utils/syntaxHighlight';

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

  const [concepts, setConcepts] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [filter, setFilter] = useState('');
  const [refLink, setRefLink] = useState(null); // { url, Viewer, sha? }
  const [repoData, setRepoData] = useState({}); // url -> {owner,repo,branch,paths,commits,error}
  const [selFile, setSelFile] = useState(null); // {repoUrl,path,text,loading}

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
      const first = flat.find(c => c.codes.length) || flat[0];
      if (first) setActiveId(first.id);
    });
    return () => { cancelled = true; };
  }, [course, base]);

  const visible = useMemo(() => {
    if (!concepts) return [];
    const q = filter.trim().toLowerCase();
    return q ? concepts.filter(c => c.title.toLowerCase().includes(q)) : concepts;
  }, [concepts, filter]);

  const active = useMemo(() =>
    (concepts || []).find(c => c.id === activeId) || null, [concepts, activeId]);

  // When a concept links a repo, fetch its bundle and map the concept
  // title's keywords to the most relevant files and commits.
  useEffect(() => {
    if (!active?.repos?.length) { setSelFile(null); return; }
    let cancelled = false;
    setSelFile(null);
    active.repos.forEach(async (url) => {
      if (repoData[url]) return;
      const r = parseGitHubUrl(url);
      if (!r) return;
      try {
        const bundle = await fetchRepoBundle(r.owner, r.repo);
        if (!cancelled) setRepoData(d => ({ ...d, [url]: { ...r, ...bundle } }));
      } catch (e) {
        if (!cancelled) setRepoData(d => ({ ...d, [url]: { ...r, error: e.message } }));
      }
    });
    return () => { cancelled = true; };
  }, [active]);

  if (!course) return <Navigate to={`/courses/${categoryId}`} replace />;

  const openRef = (url, sha = null) => {
    const Viewer = resolveReferenceViewer(url);
    if (Viewer) setRefLink({ url, Viewer, sha });
    else window.open(url, '_blank', 'noopener');
  };

  const openRepoFile = async (repoInfo, path) => {
    setSelFile({ repoUrl: repoInfo.url || `${repoInfo.owner}/${repoInfo.repo}`, path, text: null, loading: true });
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
              {visible.map(c => (
                <button key={c.id} type="button"
                  className={`cc-item${c.id === activeId ? ' active' : ''}`}
                  onClick={() => setActiveId(c.id)}>
                  <span className="cc-item-ch">{c.chapterLabel}</span>
                  <span className="cc-item-title">{c.title}</span>
                  <span className="cc-item-meta">
                    {c.codes.length > 0 && <span className="cc-tag">{c.codes.length} code</span>}
                    {c.repos.length > 0 && <span className="cc-tag repo">⌥ repo</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* concept detail + code viewer */}
          <div className="cc-detail">
            {!active && <div className="cc-empty">Select a concept on the left.</div>}
            {active && (
              <>
                <div className="cc-detail-head">
                  <span className="cc-detail-ch">Chapter {active.chapterLabel}</span>
                  <h2 className="cc-detail-title">{active.title}</h2>
                  {active.summary && <p className="cc-detail-summary">{active.summary}</p>}
                  <Link className="cc-open-chapter"
                    to={`/courses/${categoryId}/${courseId}/${active.chapterId}`}>
                    Open full chapter →
                  </Link>
                </div>

                {active.repos.length > 0 && (
                  <div className="cc-repos">
                    <div className="cc-repos-title">📚 Linked references</div>
                    {active.repos.map(u => (
                      <button key={u} type="button" className="cc-repo-chip" onClick={() => openRef(u)}>
                        🐙 {u.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                      </button>
                    ))}
                  </div>
                )}

                {/* concept → repo mapping: only the files & commits that
                    match THIS concept's keywords */}
                {active.repos.map(u => {
                  const rd = repoData[u];
                  const m = rd?.paths ? matchConceptToRepo(active.title, rd.paths, rd.commits) : null;
                  const repoName = u.replace(/^https?:\/\/(www\.)?github\.com\//, '');
                  if (!rd) return null;
                  if (rd.error) return null;
                  return (
                    <div key={u} className="cc-mapped">
                      <div className="cc-mapped-repo">🐙 {repoName}</div>
                      {m.files.length > 0 && (
                        <div className="cc-mapped-row">
                            <span className="cc-mapped-label">📄 Relevant files</span>
                          <span className="cc-mapped-chips">
                            {m.files.map(f => (
                              <button key={f} type="button"
                                className={`ghx-concept-file${selFile?.path === f ? ' cc-sel' : ''}`}
                                onClick={() => openRepoFile(rd, f)}>{f.split('/').pop()}</button>
                            ))}
                          </span>
                        </div>
                      )}
                      {m.commits.length > 0 && (
                        <div className="cc-mapped-row">
                          <span className="cc-mapped-label">🕓 Related commits</span>
                          <span className="cc-mapped-chips">
                            {m.commits.map(cm => (
                              <button key={cm.sha} type="button" className="ghx-concept-commit"
                                title={cm.commit?.message?.split('\n')[0]}
                                onClick={() => openRef(u, cm.sha)}>
                                {cm.sha.slice(0, 7)} · {(cm.commit?.message || '').split('\n')[0].slice(0, 32)}
                              </button>
                            ))}
                          </span>
                        </div>
                      )}
                      {!m.files.length && !m.commits.length && (
                        <div className="cc-empty" style={{ padding: '8px 0' }}>No files/commits match this concept in {repoName}.</div>
                      )}
                    </div>
                  );
                })}

                {/* inline repo file viewer */}
                {selFile && (
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

                {active.codes.length === 0 && (
                  <div className="cc-empty">This concept has no code snippet — see the chapter for diagrams.</div>
                )}
                {active.codes.map((blk, i) => (
                  <div key={i} className="code-block cc-code">
                    <div className="code-block-header">
                      <span className="code-block-lang">{blk.lang || 'text'}</span>
                      <div className="code-block-actions">
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
              </>
            )}
          </div>
        </div>
      </div>

      {refLink && (
        <refLink.Viewer open url={refLink.url} initialSha={refLink.sha} onClose={() => setRefLink(null)} />
      )}
    </Layout>
  );
}
