import { useCallback, useEffect } from 'react';
import { useCourse } from '../context/CourseContext';
import SlideRenderer from './SlideRenderer';

function isTypingTarget(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

/**
 * LessonViewer — slide engine. Renders the lesson header plus ONE section
 * ("slide") at a time, with Prev/Next buttons, a "Slide X of N" counter and
 * arrow-key navigation. Slide index + progress come via props/context.
 */
export default function LessonViewer({
  lesson,
  slideIndex,
  onSlideChange,
  modalOpen,
  labels = {},
}) {
  const { progress, currentModuleId } = useCourse();
  const {
    prev = '← Previous', next = 'Next →', slideOf = 'Slide',
    of = 'of', markRead = '☐ Mark as Read', markedRead = '✅ Section Complete',
  } = labels;

  const sections = lesson?.sections || [];
  const total = sections.length;
  const section = sections[slideIndex] || null;

  const go = useCallback((dir) => {
    onSlideChange(i => Math.min(Math.max(i + dir, 0), total - 1));
  }, [onSlideChange, total]);

  // Keyboard navigation (arrow keys) — disabled while a modal is open or
  // focus is inside an editable element.
  useEffect(() => {
    const onKey = (e) => {
      if (modalOpen || isTypingTarget(e)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, modalOpen]);

  if (!lesson) return null;
  const isRead = section ? progress.isSectionComplete(currentModuleId, section.id) : false;

  return (
    <div>
      <div className="lesson-header">
        <div className="breadcrumbs">
          <span className="current">{lesson.title}</span>
        </div>
        <div className="lesson-header-meta">
          <span className={`badge difficulty-${lesson.difficulty || 'beginner'}`}>{lesson.difficulty || 'beginner'}</span>
          <span className="badge badge-neutral">⏱ {lesson.duration || ''}</span>
          {lesson.prerequisites?.length > 0 && (
            <span className="badge badge-accent">Requires: {lesson.prerequisites.join(', ')}</span>
          )}
        </div>
        <h1>{lesson.title}</h1>
        {lesson.description && <p className="lesson-header-desc">{lesson.description}</p>}
        {lesson.objectives?.length > 0 && (
          <div className="lesson-objectives">
            <h4>🎯 Learning Objectives</h4>
            <ul>{lesson.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
          </div>
        )}
      </div>

      <SlideRenderer section={section} />

      {total > 0 && (
        <div className="slide-nav">
          <button type="button" className="btn btn-secondary" disabled={slideIndex <= 0}
            onClick={() => go(-1)}>{prev}</button>
          <div className="slide-nav-center">
            <span className="slide-counter">{slideOf} {slideIndex + 1} {of} {total}</span>
            {section && (
              <button
                type="button"
                className="btn btn-xs btn-ghost slide-mark-read"
                style={isRead ? { color: 'var(--color-success-500)' } : undefined}
                onClick={() => progress.markSectionComplete(currentModuleId, section.id, !isRead)}
              >{isRead ? markedRead : markRead}</button>
            )}
          </div>
          <button type="button" className="btn btn-primary" disabled={slideIndex >= total - 1}
            onClick={() => go(1)}>{next}</button>
        </div>
      )}
    </div>
  );
}
