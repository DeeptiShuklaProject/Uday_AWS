import { useEffect, useRef } from 'react';
import { useCourse } from '../context/CourseContext';
import SlideRenderer from './SlideRenderer';

/**
 * LessonViewer — continuous-scroll course page. Renders the lesson header
 * plus EVERY section stacked vertically (no slide pagination) — matching
 * the reference course UX: scroll from top to bottom through the whole
 * chapter.
 *
 * Scroll behavior:
 *   - IntersectionObserver tracks which section is in view → reports the
 *     active index upward (On-This-Page highlight) via onActiveSection.
 *   - A section counts as "read" once it has scrolled into view —
 *     feeds the same per-section progress model as before.
 */
export default function LessonViewer({
  lesson,
  onActiveSection,
  moduleId: moduleIdProp,
}) {
  const { progress, currentModuleId } = useCourse();
  const modId = moduleIdProp || currentModuleId;
  const rootRef = useRef(null);
  const sections = lesson?.sections || [];

  // Scroll-spy + auto-read marking. Re-binds when the section list changes.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !sections.length) return;
    const els = [...root.querySelectorAll('[data-section-id]')];

    // Track visibility for both active-section reporting and read marking.
    const seen = new Set();
    const ratios = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        const idx = els.indexOf(en.target);
        if (idx === -1) return;
        ratios.set(idx, en.isIntersecting ? en.intersectionRatio : 0);
        if (en.isIntersecting && en.intersectionRatio >= 0.25) {
          const sid = en.target.dataset.sectionId;
          if (sid && !seen.has(sid)) {
            seen.add(sid);
            progress.markSectionComplete(modId, sid, true);
          }
        }
      });
      // Active = first in-view section (topmost), else last fully passed.
      const visible = els
        .map((el, i) => ({ i, top: el.getBoundingClientRect().top }))
        .filter(v => v.top < window.innerHeight * 0.45);
      if (visible.length) onActiveSection?.(visible[visible.length - 1].i);
    }, { threshold: [0, 0.25, 0.6] });

    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [sections, modId, onActiveSection, progress]);

  if (!lesson) return null;

  return (
    <div ref={rootRef}>
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

      {sections.map(sec => (
        <section key={sec.id} id={sec.id} data-section-id={sec.id} className="lesson-anchor">
          <SlideRenderer section={sec} />
        </section>
      ))}
    </div>
  );
}
