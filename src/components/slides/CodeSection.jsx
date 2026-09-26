import { useState } from 'react';

/**
 * CodeSection — multi-language code viewer with per-line explanations
 * and expected output. Read-only rendering of the vanilla code editor data.
 */
export default function CodeSection({ content = {} }) {
  const languages = content.languages || [];
  const [activeLang, setActiveLang] = useState(content.defaultLang || languages[0]?.id);
  const [showOutput, setShowOutput] = useState(false);
  const [explanationsOpen, setExplanationsOpen] = useState(true);
  const lang = languages.find(l => l.id === activeLang) || languages[0];

  return (
    <div>
      <div className="code-block">
        <div className="code-block-header">
          <span className="code-block-lang">{content.title || lang?.label || 'code'}</span>
          <div className="code-block-actions">
            {languages.map(l => (
              <button
                key={l.id}
                type="button"
                className={`btn btn-xs ${l.id === lang?.id ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setActiveLang(l.id)}
              >{l.label}</button>
            ))}
          </div>
        </div>
        <pre><code>{lang?.code || ''}</code></pre>
      </div>

      {Array.isArray(lang?.explanations) && lang.explanations.length > 0 && (
        <div className={`accordion-item${explanationsOpen ? ' open' : ''}`}>
          <button type="button" className="accordion-header" onClick={() => setExplanationsOpen(s => !s)}>
            <span>📖 Line-by-line explanation ({lang.explanations.length})</span>
            <span className="chevron">▼</span>
          </button>
          <div className="accordion-body">
            <div className="accordion-body-inner">
              {lang.explanations.map((ex, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 'var(--text-sm)' }}>
                  <code style={{ flexShrink: 0 }}>L{ex.line}</code>
                  <span>{ex.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {content.expectedOutput && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-xs btn-secondary" onClick={() => setShowOutput(s => !s)}>
            {showOutput ? 'Hide expected output' : 'Show expected output'}
          </button>
          {showOutput && (
            <div className="terminal" style={{ marginTop: 8 }}>
              <div className="terminal-body"><div className="terminal-output">{content.expectedOutput}</div></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
