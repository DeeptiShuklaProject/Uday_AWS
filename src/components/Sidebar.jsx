import { useCourse } from '../context/CourseContext';

/**
 * Sidebar — chapter navigation list with per-chapter progress badges.
 * All data comes from CourseContext / props; no content is hardcoded.
 */
export default function Sidebar({ open, onClose, sectionTitle = 'Modules', footer }) {
  const { modules, currentModuleId, setCurrentModuleId, progress } = useCourse();

  const select = (id) => {
    setCurrentModuleId(id);
    onClose?.();
  };

  return (
    <nav className={`sidebar${open ? ' open' : ''}`} aria-label="Course chapters">
      <div className="sidebar-section">
        <div className="sidebar-section-title">{sectionTitle}</div>
        <ul className="sidebar-nav">
          {modules.map(mod => {
            const pct = progress.getModuleProgress(mod.id);
            const isComplete = progress.isModuleComplete(mod.id);
            const isActive = currentModuleId === mod.id;
            return (
              <li key={mod.id} className="sidebar-nav-item">
                <a
                  href={`/chapter/${mod.id}`}
                  className={`sidebar-nav-link${isActive ? ' active' : ''}`}
                  onClick={e => { e.preventDefault(); select(mod.id); }}
                >
                  <span className="nav-icon">{mod.icon}</span>
                  <span className="nav-label">{mod.number}. {mod.title}</span>
                  {isComplete
                    ? <span className="nav-badge nav-badge-complete">✓</span>
                    : pct > 0 && <span className="nav-badge nav-badge-progress">{pct}%</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      {footer && <div className="sidebar-footer">{footer}</div>}
    </nav>
  );
}
