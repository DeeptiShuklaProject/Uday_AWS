import { useEffect, useRef, useState } from 'react';
import { renderMermaidDiagrams } from '../hooks/useMermaid';

/**
 * LabAccordion — single-open accordion of lab sections.
 * All sections start collapsed; opening one closes the others and
 * lazy-renders any mermaid diagrams inside that section once.
 *
 * @param {Array<{title:string, html:string}>} sections
 */
export default function LabAccordion({ sections = [], emptyMessage = 'No practical lab content found for this chapter.' }) {
  const [openIndex, setOpenIndex] = useState(-1);
  const mermaidDone = useRef(new Set());
  const containerRef = useRef(null);

  // Lazy-render mermaid diagrams the first time a section is expanded.
  useEffect(() => {
    if (openIndex === -1 || mermaidDone.current.has(openIndex)) return;
    mermaidDone.current.add(openIndex);
    const el = containerRef.current?.querySelectorAll('.lab-accordion-item')[openIndex];
    if (el) renderMermaidDiagrams(el);
  }, [openIndex]);

  if (sections.length === 0) {
    return <div className="lab-content-empty">{emptyMessage}</div>;
  }

  return (
    <div ref={containerRef}>
      {sections.map((s, i) => (
        <div key={i} className={`lab-accordion-item${openIndex === i ? ' open' : ''}`}>
          <button
            type="button"
            className="lab-accordion-header"
            onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
            aria-expanded={openIndex === i}
          >
            <span className="lab-accordion-title">🔬 {s.title.replace(/^🔬\s*/, '')}</span>
            <span className="lab-accordion-arrow">▶</span>
          </button>
          {openIndex === i && (
            <div className="lab-accordion-content">
              <div className="lab-content-body" dangerouslySetInnerHTML={{ __html: s.html }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
