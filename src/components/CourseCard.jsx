/**
 * CourseCard — the shared card used for categories, course listings and
 * doc-chapter listings. Same markup/styles as the vanilla module-card.
 *
 * All content via props: icon/number/title/desc/meta rows are generic;
 * `progress` ({pct, complete}) renders the progress block only when given.
 */
export default function CourseCard({
  icon, iconBg, iconColor, number, title, description,
  progress, meta = [], onClick,
}) {
  return (
    <button type="button" className="card module-card hover-float"
      style={{ textDecoration: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
      onClick={onClick}>
      <div className="card-body" style={{ padding: 24 }}>
        {number != null && <div className="module-number">{number}</div>}
        <div className="module-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
        <div className="module-title">{title}</div>
        {description && <div className="module-desc">{description}</div>}
        {progress && (
          <div style={{ marginTop: 12 }}>
            <div className="progress-label">
              <span className="progress-label-title" style={{ fontSize: 12 }}>
                {progress.complete ? '✅ Complete' : 'Progress'}
              </span>
              <span className="progress-label-value" style={{ fontSize: 12 }}>{progress.pct}%</span>
            </div>
            <div className="progress-bar progress-bar-sm">
              <div className="progress-bar-fill" style={{ width: `${progress.pct}%` }} />
            </div>
          </div>
        )}
        {meta.length > 0 && (
          <div className="module-meta" style={{ marginTop: 12 }}>
            {meta.map((m, i) => (i === 0 && typeof m === 'object')
              ? <span key={i} className={`badge difficulty-${m.value}`}>{m.value}</span>
              : <span key={i}>{m}</span>)}
          </div>
        )}
      </div>
    </button>
  );
}
