import { useCourse } from '../../context/CourseContext';

/**
 * NextSection — prev/next chapter navigation card.
 * Vanilla URLs look like 'module-02.html' or '../index.html'; we map them
 * onto React Router chapter routes via CourseContext.
 */
export default function NextSection({ content = {} }) {
  const { modules, goToModule } = useCourse();

  const toModuleId = (url) => {
    if (!url) return null;
    const m = url.match(/module-(\d+)/);
    return m ? `module-${m[1]}` : null;
  };

  const target = (entry) => {
    const id = toModuleId(entry?.url || entry?.href);
    if (id && modules.some(m => m.id === id)) return () => goToModule(id);
    return null;
  };

  const prev = content.prev;
  const next = content.next || content.nextModule;

  return (
    <div>
      {content.message && (
        <div className="alert alert-success">
          <span className="alert-icon">🎉</span>
          <div className="alert-content"><div className="alert-text">{content.message}</div></div>
        </div>
      )}
      <div className="lesson-nav">
        {prev && (
          <button type="button" className="lesson-nav-btn prev" onClick={target(prev) || undefined}
            disabled={!target(prev)} style={{ textAlign: 'left' }}>
            <span className="lesson-nav-btn-label">← Previous Chapter</span>
            <span className="lesson-nav-btn-title">{prev.title}</span>
          </button>
        )}
        {next && (
          <button type="button" className="lesson-nav-btn next" onClick={target(next) || undefined}
            disabled={!target(next)}>
            <span className="lesson-nav-btn-label">Next Chapter →</span>
            <span className="lesson-nav-btn-title">{next.title}</span>
          </button>
        )}
      </div>
    </div>
  );
}
