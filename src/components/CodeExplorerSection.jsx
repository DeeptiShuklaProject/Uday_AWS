import { useState } from 'react';
import GitHubPreciseCodeExplorerModal, { PreciseCodeExplorer } from './GitHubPreciseCodeExplorerModal';

/**
 * CodeExplorerSection — inline chapter widget for a curated code
 * walkthrough. The card expands in place (▾) to show the explorer
 * inline — arrow keys work there too — or zooms (⤢) into the modal.
 * Data-driven: the whole spec arrives via content.spec.
 */
export default function CodeExplorerSection({
  content,
  openLabel = 'Open walkthrough',
  expandLabel = 'Expand inline',
}) {
  const spec = content?.spec;
  const [open, setOpen] = useState(false);       // modal
  const [expanded, setExpanded] = useState(!!content?.expanded); // inline — optionally open by default
  if (!spec?.files?.length) return null;
  return (
    <div className="ghpx-card">
      <div className="ghpx-card-head ghpx-card-toggle" role="button" tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded(x => !x)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(x => !x); } }}>
        <span className="ghpx-card-ico">🧭</span>
        <div className="ghpx-card-head-main">
          <div className="ghpx-card-title">{spec.title || 'Code Walkthrough'}</div>
          <div className="ghpx-card-sub">
            {spec.repo} <span className="ghpx-refchip">@{spec.ref || 'HEAD'}</span>
            {' · '}{spec.files.length} curated file{spec.files.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="ghpx-card-actions">
          <button type="button" className="ghpx-card-btn" title={`${openLabel} (fullscreen)`}
            onClick={e => { e.stopPropagation(); setOpen(true); }}>⛶</button>
          <span className={`ghpx-chevron${expanded ? ' up' : ''}`} aria-hidden="true">▾</span>
        </div>
      </div>
      <div className="ghpx-card-files">
        {spec.files.map((f, i) => (
          <span key={i} className="ghpx-card-file" title={f.path || f.src}>
            {i + 1}. {f.label || (f.path || f.src || '').split('/').pop()}
          </span>
        ))}
      </div>
      {expanded && (
        <PreciseCodeExplorer spec={spec} keysActive={!open} />
      )}
      <GitHubPreciseCodeExplorerModal open={open} spec={spec} onClose={() => setOpen(false)} />
    </div>
  );
}
