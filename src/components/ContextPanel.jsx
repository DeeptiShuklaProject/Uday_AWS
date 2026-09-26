/**
 * ContextPanel — right-hand slide navigator ("On This Page").
 * Lists every slide title; clicking jumps straight to that slide.
 */
export default function ContextPanel({ sections = [], currentIndex = 0, onSelect, title = 'On This Page' }) {
  const items = sections.filter(s => s.title);
  if (items.length === 0) return null;

  return (
    <aside className="context-panel">
      <div className="context-panel-title">{title}</div>
      <ul className="toc-list">
        {sections.map((s, i) =>
          s.title ? (
            <li key={s.id || i} className="toc-item">
              <a
                className={`toc-link${i === currentIndex ? ' active' : ''}`}
                href={`#${s.id}`}
                onClick={e => { e.preventDefault(); onSelect?.(i); }}
              >{s.title}</a>
            </li>
          ) : null
        )}
      </ul>
    </aside>
  );
}
