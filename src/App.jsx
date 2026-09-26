import { useEffect, useState } from 'react';
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
 * The route param is the single source of truth for the current chapter;
 * CourseContext.currentModuleId stays in sync in both directions.
 */
function ChapterPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { modules, currentModuleId, setCurrentModuleId, activeModal, closeModal } = useCourse();
  const { data: lesson, loading, error } = useModuleSlides(moduleId);
  const [slideIndex, setSlideIndex] = useState(0);

  const valid = modules.some(m => m.id === moduleId);

  // Route → context
  useEffect(() => {
    if (valid && moduleId !== currentModuleId) setCurrentModuleId(moduleId);
  }, [moduleId, valid, currentModuleId, setCurrentModuleId]);

  // Context → route (covers in-app jumps like NextSection)
  useEffect(() => {
    if (currentModuleId && currentModuleId !== moduleId && modules.some(m => m.id === currentModuleId)) {
      navigate(`/chapter/${currentModuleId}`);
    }
  }, [currentModuleId, moduleId, modules, navigate]);

  // Reset the slide pointer when the chapter changes.
  useEffect(() => { setSlideIndex(0); window.scrollTo(0, 0); }, [moduleId]);

  if (!valid) return <Navigate to={`/chapter/${FIRST_MODULE}`} replace />;

  return (
    <Layout
      contextPanel={
        lesson && (
          <ContextPanel
            sections={lesson.sections || []}
            currentIndex={slideIndex}
            onSelect={setSlideIndex}
          />
        )
      }
    >
      {loading && <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Loading chapter…</p></div>}
      {error && <div className="empty-state"><div className="empty-state-icon">⚠️</div><p>Failed to load chapter data.</p></div>}
      {lesson && (
        <LessonViewer
          key={moduleId}
          lesson={lesson}
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

export default function App() {
  return (
    <BrowserRouter>
      <CourseProvider
        registry={registry}
        progressStorageKey="aws-masterclass-progress"
        themeStorageKey="masterclass-theme"
        config={{ notesEndpoint: '/api/lab', chapterBaseUrl: '/chapters' }}
      >
        <Routes>
          <Route path="/" element={<Navigate to={`/chapter/${FIRST_MODULE}`} replace />} />
          <Route path="/chapter/:moduleId" element={<ChapterPage />} />
          <Route path="*" element={<Navigate to={`/chapter/${FIRST_MODULE}`} replace />} />
        </Routes>
      </CourseProvider>
    </BrowserRouter>
  );
}
