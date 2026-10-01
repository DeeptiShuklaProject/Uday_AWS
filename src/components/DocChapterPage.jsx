import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useCourse } from '../context/CourseContext';
import Layout from './Layout';
import LessonViewer from './LessonViewer';
import ContextPanel from './ContextPanel';
import DetailedChapterModal from './DetailedChapterModal';
import LabNotesModal from './LabNotesModal';
import { resolveReferenceViewer } from '../utils/referenceViewers';
import docsRegistry from '../data/docsRegistry.json';
import { markdownToModule } from '../utils/moduleParser';

// Filesystem-safe ID — doubles as the lab-notes filename ({id}-lab.html)
// on the lab server, so no ':' separators.
export const docProgressId = (categoryId, courseId, chapterId) =>
  `${categoryId}-${courseId}-${chapterId}`;

// Chapter titles often carry their own "NN —" prefix (from filenames) —
// strip it so sidebar/topbar don't render "01. 01 — Title" twice.
const bareTitle = t => (t || '').replace(/^\d+\s*[—–.\-:]\s*/, '').trim() || t;

export function findDocCourse(categoryId, courseId) {
  const cat = docsRegistry.categories.find(c => c.id === categoryId);
  return cat ? { category: cat, course: cat.courses.find(c => c.id === courseId) } : {};
}

/**
 * DocChapterPage — /courses/:categoryId/:courseId/:chapterId
 *
 * A markdown chapter from any docs category (Bedrock, Linux, Docker, …)
 * runs through the SAME lesson pipeline as AWS modules: markdownToModule()
 * converts it into the {title, objectives, sections[]} shape, then
 * Layout + Sidebar (course chapters) + LessonViewer (slide engine) +
 * ContextPanel (On This Page) + DetailedChapterModal / LabNotesModal
 * render it identically.
 *
 * The chapter registers itself as an externalModule so TopBar, modals and
 * progress tracking treat it exactly like a registry module.
 */
export default function DocChapterPage() {
  const { categoryId, courseId, chapterId } = useParams();
  const navigate = useNavigate();
  const { activeModal, closeModal, setExternalModule, registerModule } = useCourse();

  const { category, course } = findDocCourse(categoryId, courseId);
  const base = course?.contentBase || category?.contentBase || '/';
  const index = course?.chapters.findIndex(c => c.id === chapterId) ?? -1;
  const chapter = index >= 0 ? course.chapters[index] : null;
  const progressId = chapter ? docProgressId(categoryId, courseId, chapter.id) : null;

  const [markdown, setMarkdown] = useState(null);
  // Reference links (GitHub now; docker/k8s/terraform viewers can register
  // in referenceViewers.js) open an in-app preview instead of navigating.
  const [refLink, setRefLink] = useState(null); // { url, Viewer }
  const onContentClick = (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const Viewer = resolveReferenceViewer(a.href);
    if (!Viewer) return;
    e.preventDefault();
    setRefLink({ url: a.href, Viewer });
  };
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Deep-linked section anchor from the URL fragment (#<sectionId>).
  const pendingAnchor = useRef(window.location.hash.slice(1));

  // Fetch the chapter markdown (path is relative to the content base).
  useEffect(() => {
    if (!chapter) return;
    let cancelled = false;
    setMarkdown(null);
    setError(false);
    fetch(`${base}${chapter.file}`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
      .then(t => { if (!cancelled) setMarkdown(t); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [chapter, base]);

  // Register every chapter's sectionCount so sidebar progress badges work
  // for chapters that haven't been opened yet.
  useEffect(() => {
    if (!course) return;
    course.chapters.forEach(ch =>
      registerModule({
        id: docProgressId(categoryId, courseId, ch.id),
        sectionCount: ch.sectionCount || 0,
      }));
  }, [course, courseId, categoryId, registerModule]);

  // Markdown → lesson module (same shape as generated AWS module data).
  const lesson = useMemo(
    () => (markdown ? markdownToModule(markdown, {
      id: progressId,
      title: bareTitle(chapter.title),
      imageBaseUrl: base,
      codeExamples: chapter.codeExamples,
      quiz: chapter.quiz,
      interview: chapter.interviewQuestions,
      topic: bareTitle(chapter.title),
      prog: /program|adventure/i.test(categoryId),
    }) : null),
    [markdown, progressId, chapter, base, course]
  );

  // Expose the chapter as the "current module" while this page is mounted —
  // TopBar, DetailedChapterModal and LabNotesModal all key off it.
  useEffect(() => {
    if (!chapter) return;
    setExternalModule({
      id: progressId,
      title: bareTitle(chapter.title),
      number: String(index + 1).padStart(2, '0'),
      mdFile: `${base}${chapter.file}`,
      imageBaseUrl: base,
      sectionCount: lesson?.sections.length || chapter.sectionCount || 0,
    });
    return () => setExternalModule(null);
  }, [chapter, index, progressId, base, lesson, setExternalModule]);

  // Scroll-spy → URL bookmark: as the reader scrolls, the fragment keeps
  // pointing at the section in view so a copied URL restores position.
  const handleActiveSection = useCallback((i) => {
    setActiveIndex(i);
    const sid = lesson?.sections?.[i]?.id;
    if (sid && window.location.hash !== `#${sid}`) {
      window.history.replaceState(null, '', `#${sid}`);
    }
  }, [lesson]);

  // Restore a #section deep-link once the lesson renders. Retry while
  // lazy images/markdown settle the layout.
  useEffect(() => {
    if (!lesson || !pendingAnchor.current) return;
    const el = document.getElementById(pendingAnchor.current);
    if (!el) return;
    pendingAnchor.current = null;
    [80, 400, 1200].forEach(ms =>
      setTimeout(() => el.scrollIntoView({ block: 'start' }), ms));
  }, [lesson]);

  // Jump to top on chapter switch (instant — global smooth-scroll would
  // animate and look like flicker). Drop the previous chapter's hash —
  // but keep it on first mount so a deep-linked section survives.
  const didMount = useRef(false);
  useEffect(() => {
    setActiveIndex(0);
    if (didMount.current && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    didMount.current = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [chapterId, courseId]);

  if (!course) return <Navigate to={`/courses/${categoryId}`} replace />;
  if (!chapter) return <Navigate to={`/courses/${categoryId}/${course.id}`} replace />;

  const sidebarItems = course.chapters.map((ch, i) => ({
    id: ch.id,
    icon: '📄',
    number: String(i + 1).padStart(2, '0'),
    title: bareTitle(ch.title),
    to: `/courses/${categoryId}/${courseId}/${ch.id}`,
    progressId: docProgressId(categoryId, courseId, ch.id),
  }));

  return (
    <Layout
      topBarProps={{ onLogoClick: () => navigate('/') }}
      sideBarProps={{
        sectionTitle: course.title,
        items: sidebarItems,
        activeId: chapterId,
        onSelectItem: id => navigate(`/courses/${categoryId}/${courseId}/${id}`),
        footer: (
          <>
            <Link to={`/courses/${categoryId}/${courseId}/concept-code`}
              className="btn btn-sm btn-ghost"
              style={{ width: '100%', textDecoration: 'none', color: 'var(--color-primary-500)', fontWeight: 700 }}>
              🧩 Concept & Code
            </Link>
            <Link to={`/courses/${categoryId}`} className="btn btn-sm btn-ghost"
              style={{ width: '100%', textDecoration: 'none', color: 'var(--color-neutral-400)' }}>
              ← Back to {category.title}
            </Link>
          </>
        ),
      }}
      contextPanel={
        lesson && (
          <ContextPanel
            sections={lesson.sections || []}
            currentIndex={activeIndex}
            onSelect={i => {
              const el = document.getElementById(lesson.sections[i]?.id);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )
      }
    >
      <div style={{ display: 'contents' }} onClick={onContentClick}>
        {!lesson && !error && (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Loading chapter…</p></div>
        )}
        {error && <div className="empty-state"><div className="empty-state-icon">⚠️</div><p>Failed to load chapter.</p></div>}
        {lesson && (
          <LessonViewer
            key={progressId}
            lesson={lesson}
            onActiveSection={handleActiveSection}
            moduleId={progressId}
            compact
          />
        )}
        <DetailedChapterModal open={activeModal === 'details'} onClose={closeModal} />
        <LabNotesModal open={activeModal === 'labs'} onClose={closeModal} />
      </div>
      {refLink && (
        <refLink.Viewer open url={refLink.url} onClose={() => setRefLink(null)} />
      )}
    </Layout>
  );
}
