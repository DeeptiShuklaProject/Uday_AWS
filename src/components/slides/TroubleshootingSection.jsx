import { useState } from 'react';

/**
 * TroubleshootingSection — accordion of common issues.
 * items: [{ error|title, cause, fix, prevention }]
 */
export default function TroubleshootingSection({ content = {} }) {
  const items = content.items || (Array.isArray(content) ? content : []);
  const [open, setOpen] = useState({});

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className={`accordion-item${open[i] ? ' open' : ''}`}>
          <button type="button" className="accordion-header"
            onClick={() => setOpen(o => ({ ...o, [i]: !o[i] }))}>
            <span>⚠️ {item.error || item.title || `Issue ${i + 1}`}</span>
            <span className="chevron">▼</span>
          </button>
          <div className="accordion-body">
            <div className="accordion-body-inner">
              {item.cause && <p><strong>Cause:</strong> {item.cause}</p>}
              {item.fix && <p><strong>Fix:</strong> {item.fix}</p>}
              {item.prevention && <p><strong>Prevention:</strong> {item.prevention}</p>}
              {item.html && <div dangerouslySetInnerHTML={{ __html: item.html }} />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
