import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { CourseProvider, useCourse } from './context/CourseContext';
import Layout from './components/Layout';
import LessonViewer from './components/LessonViewer';
import ContextPanel from './components/ContextPanel';
import DetailedChapterModal from './components/DetailedChapterModal';
import LabNotesModal from './components/LabNotesModal';
import LandingPage from './components/LandingPage';
import CategoryPage from './components/CategoryPage';
import DocCoursePage from './components/DocCoursePage';
import DocChapterPage from './components/DocChapterPage';
import { useModuleSlides } from './hooks/useModuleSlides';
import registry from './data/courseRegistry.json';
import { categories } from './data/categories';
import { landingContent } from './data/landingContent';

const FIRST_MODULE = registry.modules[0]?.id;

/**
 * ChapterPage — /chapter/:moduleId
 * The route param is the single source of truth for the current chapter.
 * Context follows the route (route → context). Components that jump
 * chapters call `goToModule`, which sets context and navigates atomically —
 * there is intentionally NO context → route sync effect (it ping-pongs).
 */
function ChapterPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { modules, currentModuleId, setCurrentModuleId, activeModal, closeModal } = useCourse();
  const { data: lesson, loading, error } = useModuleSlides(moduleId);
  const [activeIndex, setActiveIndex] = useState(0);

  const valid = modules.some(m => m.id === moduleId);

  // Route → context (one direction only)
  useEffect(() => {
    if (valid && moduleId !== currentModuleId) setCurrentModuleId(moduleId);
  }, [moduleId, valid, currentModuleId, setCurrentModuleId]);

  // Jump to top on chapter change. Instant scroll — the design system sets
  // `scroll-behavior: smooth`, which would otherwise animate the jump and
  // look like flickering on every chapter switch.
  useEffect(() => {
    setActiveIndex(0);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [moduleId]);

  if (!valid) return <Navigate to={`/chapter/${FIRST_MODULE}`} replace />;

  // Never paint the previous chapter's slides while the next chunk loads —
  // stale data + the spinner mounting/unmounting is what causes the flicker.
  const current = lesson && lesson.moduleId === moduleId ? lesson : null;

  return (
    <Layout
      topBarProps={{ onLogoClick: () => navigate('/') }}
      sideBarProps={{
        footer: (
          <Link to="/" className="btn btn-sm btn-ghost"
            style={{ width: '100%', textDecoration: 'none', color: 'var(--color-neutral-400)' }}>
            ← Back to Course
          </Link>
        ),
      }}
      contextPanel={
        current && (
          <ContextPanel
            sections={current.sections || []}
            currentIndex={activeIndex}
            onSelect={i => {
              const el = document.getElementById(current.sections[i]?.id);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )
      }
    >
      {!current && !error && (
        <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Loading chapter…</p></div>
      )}
      {error && <div className="empty-state"><div className="empty-state-icon">⚠️</div><p>Failed to load chapter data.</p></div>}
      {current && (
        <LessonViewer
          key={moduleId}
          lesson={current}
          onActiveSection={setActiveIndex}
        />
      )}
      <DetailedChapterModal open={activeModal === 'details'} onClose={closeModal} />
      <LabNotesModal open={activeModal === 'labs'} onClose={closeModal} />
    </Layout>
  );
}

/**
 * RoutedCourseProvider — lives inside BrowserRouter so goToModule can
 * navigate client-side. The provider itself stays router-agnostic.
 */
function RoutedCourseProvider({ children }) {
  const navigate = useNavigate();
  const onModuleSelect = useCallback(id => navigate(`/chapter/${id}`), [navigate]);
  return (
    <CourseProvider
      registry={registry}
      progressStorageKey="aws-masterclass-progress"
      themeStorageKey="masterclass-theme"
      config={{ notesEndpoint: '/api/lab', chapterBaseUrl: '/chapters' }}
      onModuleSelect={onModuleSelect}
    >
      {children}
    </CourseProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RoutedCourseProvider>
        <Routes>
          <Route path="/" element={<LandingPage content={landingContent} categories={categories} />} />
          <Route path="/courses/:categoryId" element={<CategoryPage categories={categories} />} />
          <Route path="/courses/:categoryId/:courseId" element={<DocCoursePage />} />
          <Route path="/courses/:categoryId/:courseId/:chapterId" element={<DocChapterPage />} />
          <Route path="/chapter/:moduleId" element={<ChapterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RoutedCourseProvider>
    </BrowserRouter>
  );
}
