import { useEffect } from 'react';

/**
 * Modal — generic overlay dialog matching the masterclass popup geometry
 * (88vw / max 1600px / 90vh). Fully prop-driven.
 */
export default function Modal({
  open,
  onClose,
  icon,
  title,
  subtitle,
  toolbar,
  footer,
  children,
  closeLabel = 'Close',
}) {
  // Esc to close + lock body scroll
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('modal-open');
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="mc-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="mc-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mc-modal-header">
          <div className="mc-modal-header-left">
            {icon && <div className="mc-modal-icon">{icon}</div>}
            <div>
              <div className="mc-modal-title">{title}</div>
              {subtitle && <div className="mc-modal-subtitle">{subtitle}</div>}
            </div>
          </div>
          <button type="button" className="mc-modal-close" title={closeLabel} onClick={onClose}>×</button>
        </div>
        {toolbar}
        <div className="mc-modal-body">{children}</div>
        {footer && <div className="mc-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
