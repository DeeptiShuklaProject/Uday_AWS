import { useCourse } from '../context/CourseContext';

/**
 * Sidebar — chapter navigation list with per-chapter progress badges.
 * All data comes from CourseContext / props; no content is hardcoded.
 */
export default function Sidebar({ open, onClose, sectionTitle = 'Modules', footer, items, activeId, onSelectItem }) {
  const { modules, currentModuleId, goToModule, progress } = useCourse();

  // Defaults come from the AWS registry; doc-library pages pass their own
  // items (chapters) + selection handler, reusing the exact same UI.
  const list = items || modules;
  const active = activeId ?? currentModuleId;
  const select = (id) => {
    if (onSelectItem) onSelectItem(id);
    else goToModule(id);
    onClose?.();
  };

  return (
    <nav className={`sidebar${open ? ' open' : ''}`} aria-label="Course chapters">
      <div className="sidebar-section">
        <div className="sidebar-section-title">{sectionTitle}</div>
        <ul className="sidebar-nav">
          {list.map(mod => {
            const pid = mod.progressId || mod.id;
            const pct = progress.getModuleProgress(pid);
            const isComplete = progress.isModuleComplete(pid);
            const isActive = active === mod.id;
            return (
              <li key={mod.id} className="sidebar-nav-item">
                <a
                  href={mod.to || `/chapter/${mod.id}`}
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
