import { useCourse } from '../context/CourseContext';

/**
 * TopBar — fixed header with brand, current chapter title, modal triggers
 * and overall progress. All labels arrive via props.
 */
export default function TopBar({
  logo = '🚀 Masterclass',
  detailsLabel = '📄 Detailed Chapter',
  labNotesLabel = '🧪 Lab Notes',
  themeLabels = { light: '🌙', dark: '☀️' },
  onMenuToggle,
  onLogoClick,
}) {
  const { currentModule, progress, openModal, notesStatus, theme, toggleTheme } = useCourse();
  const overall = progress.getOverallProgress();
  const hasNotes = !!(currentModule && notesStatus[currentModule.id]);

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <button className="topbar-menu-btn" aria-label="Toggle navigation" onClick={onMenuToggle}>☰</button>
        {onLogoClick
          ? <button type="button" className="topbar-logo" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onLogoClick}>{logo}</button>
          : <span className="topbar-logo">{logo}</span>}
        <div className="topbar-divider" />
        <span className="topbar-title">
          {currentModule ? `Chapter ${currentModule.number}: ${currentModule.title}` : ''}
        </span>
      </div>
      <div className="topbar-actions">
        <button type="button" className="topbar-btn topbar-btn-details" onClick={() => openModal('details')}>
          {detailsLabel}
        </button>
        <button type="button" className="topbar-btn topbar-btn-labs" onClick={() => openModal('labs')}>
          {labNotesLabel}
          {hasNotes && <span className="topbar-btn-dot" />}
        </button>
        <button type="button" className="topbar-btn topbar-btn-theme" onClick={toggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {themeLabels[theme] || '🌙'}
        </button>
        <div className="topbar-progress">
          <span>{overall}%</span>
          <div className="topbar-progress-bar">
            <div className="topbar-progress-fill" style={{ width: `${overall}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}
