import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { CourseProvider, useCourse } from './context/CourseContext';
import Layout from './components/Layout';
import LessonViewer from './components/LessonViewer';
import ContextPanel from './components/ContextPanel';
import DetailedChapterModal from './components/DetailedChapterModal';
import LabNotesModal from './components/LabNotesModal';
import { useModuleSlides } from './hooks/useModuleSlides';
import registry from './data/courseRegistry.json';

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
  const { modules, currentModuleId, setCurrentModuleId, activeModal, closeModal } = useCourse();
  const { data: lesson, loading, error } = useModuleSlides(moduleId);
  const [slideIndex, setSlideIndex] = useState(0);

  const valid = modules.some(m => m.id === moduleId);

  // Route → context (one direction only)
  useEffect(() => {
    if (valid && moduleId !== currentModuleId) setCurrentModuleId(moduleId);
  }, [moduleId, valid, currentModuleId, setCurrentModuleId]);

  // Reset the slide pointer when the chapter changes. Instant scroll —
  // the design system sets `scroll-behavior: smooth`, which would otherwise
  // animate the jump and look like flickering on every chapter switch.
  useEffect(() => {
    setSlideIndex(0);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [moduleId]);

  if (!valid) return <Navigate to={`/chapter/${FIRST_MODULE}`} replace />;

  // Never paint the previous chapter's slides while the next chunk loads —
  // stale data + the spinner mounting/unmounting is what causes the flicker.
  const current = lesson && lesson.moduleId === moduleId ? lesson : null;

  return (
    <Layout
      contextPanel={
        current && (
          <ContextPanel
            sections={current.sections || []}
            currentIndex={slideIndex}
            onSelect={setSlideIndex}
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
          slideIndex={slideIndex}
          onSlideChange={setSlideIndex}
          modalOpen={!!activeModal}
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
          <Route path="/" element={<Navigate to={`/chapter/${FIRST_MODULE}`} replace />} />
          <Route path="/chapter/:moduleId" element={<ChapterPage />} />
          <Route path="*" element={<Navigate to={`/chapter/${FIRST_MODULE}`} replace />} />
        </Routes>
      </RoutedCourseProvider>
    </BrowserRouter>
  );
}
