import { useState } from 'react';

/**
 * ChallengeSection — coding challenge with requirements, hints, starter code
 * and keyword-based test-case checks against the user's attempt.
 */
export default function ChallengeSection({ content = {}, checkLabel = 'Run checks' }) {
  const [attempt, setAttempt] = useState(content.starterCode || '');
  const [results, setResults] = useState(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const testCases = content.testCases || [];

  const runChecks = () => {
    setResults(testCases.map(tc => ({
      ...tc,
      pass: (tc.keywords || []).every(k => attempt.includes(k)),
    })));
  };

  return (
    <div className="card">
      <div className="card-body">
        {content.description && <p>{content.description}</p>}

        {Array.isArray(content.requirements) && content.requirements.length > 0 && (
          <>
            <h4 style={{ marginTop: 16, marginBottom: 8 }}>Requirements</h4>
            <ul>
              {content.requirements.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </>
        )}

        {content.starterCode && (
          <div className="code-block" style={{ marginTop: 16 }}>
            <div className="code-block-header">
              <span className="code-block-lang">{content.language || 'code'} — starter</span>
            </div>
            <pre><code>{content.starterCode}</code></pre>
          </div>
        )}

        <textarea
          className="challenge-editor"
          value={attempt}
          onChange={e => { setAttempt(e.target.value); setResults(null); }}
          spellCheck={false}
          aria-label="challenge code attempt"
        />

        {testCases.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={runChecks} style={{ marginTop: 12 }}>
            {checkLabel}
          </button>
        )}

        {results && (
          <div style={{ marginTop: 16 }}>
            {results.map((r, i) => (
              <div key={i} className={`quiz-result ${r.pass ? 'quiz-result-correct' : 'quiz-result-incorrect'}`} style={{ marginBottom: 6 }}>
                {r.pass ? '✅' : '❌'} {r.description}
              </div>
            ))}
          </div>
        )}

        {Array.isArray(content.hints) && content.hints.length > 0 && (
          <div className={`accordion-item${hintsOpen ? ' open' : ''}`} style={{ marginTop: 16 }}>
            <button type="button" className="accordion-header" onClick={() => setHintsOpen(s => !s)}>
              <span>💡 Hints ({content.hints.length})</span>
              <span className="chevron">▼</span>
            </button>
            <div className="accordion-body">
              <div className="accordion-body-inner">
                <ul>{content.hints.map((h, i) => <li key={i}>{h}</li>)}</ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
