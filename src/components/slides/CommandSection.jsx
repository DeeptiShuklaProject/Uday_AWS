import { useState } from 'react';

function CommandBlock({ cmd, runLabel = 'Run', copyLabel = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState(null);
  const [showExpected, setShowExpected] = useState(false);
  const [errorsOpen, setErrorsOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd.command || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const run = () => {
    if (typeof cmd.onRun === 'function') {
      try { setOutput(String(cmd.onRun())); } catch (e) { setOutput(`Error: ${e.message}`); }
    } else if (cmd.expectedOutput) {
      setOutput(cmd.expectedOutput);
    }
  };

  return (
    <div>
      <div className="code-block">
        <div className="code-block-header">
          <span className="code-block-lang">{cmd.category || 'cli'}</span>
          <div className="code-block-actions">
            {(cmd.onRun || cmd.expectedOutput) && (
              <button type="button" className="btn btn-xs btn-ghost" onClick={run}>{runLabel}</button>
            )}
            <button type="button" className="btn btn-xs btn-ghost" onClick={copy}>
              {copied ? '✓ Copied' : copyLabel}
            </button>
          </div>
        </div>
        <pre><code>{cmd.command}</code></pre>
      </div>

      {cmd.explanation && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>{cmd.explanation}</p>
      )}

      {output !== null && (
        <div className="terminal" style={{ marginBottom: 12 }}>
          <div className="terminal-body"><div className="terminal-output">{output}</div></div>
        </div>
      )}

      {cmd.expectedOutput && !output && (
        <>
          <button type="button" className="btn btn-xs btn-secondary" onClick={() => setShowExpected(s => !s)}>
            {showExpected ? 'Hide expected output' : 'Show expected output'}
          </button>
          {showExpected && (
            <div className="terminal" style={{ marginTop: 8 }}>
              <div className="terminal-body"><div className="terminal-output">{cmd.expectedOutput}</div></div>
            </div>
          )}
        </>
      )}

      {Array.isArray(cmd.commonErrors) && cmd.commonErrors.length > 0 && (
        <div className={`accordion-item${errorsOpen ? ' open' : ''}`} style={{ marginTop: 12 }}>
          <button type="button" className="accordion-header" onClick={() => setErrorsOpen(s => !s)}>
            <span>⚠️ Common errors ({cmd.commonErrors.length})</span>
            <span className="chevron">▼</span>
          </button>
          <div className="accordion-body">
            <div className="accordion-body-inner">
              {cmd.commonErrors.map((err, i) => (
                <div key={i} style={{ marginBottom: 12, fontSize: 'var(--text-sm)' }}>
                  <strong>{err.error}</strong>
                  {err.cause && <div><strong>Cause:</strong> {err.cause}</div>}
                  {err.fix && <div><strong>Fix:</strong> {err.fix}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {cmd.interviewQ && (
        <div className="alert alert-info" style={{ marginTop: 12 }}>
          <span className="alert-icon">🎙️</span>
          <div className="alert-content">
            <div className="alert-title">Interview question</div>
            <div className="alert-text">{cmd.interviewQ}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/** CommandSection — copyable/runnable CLI command blocks. */
export default function CommandSection({ content }) {
  const commands = Array.isArray(content) ? content : content ? [content] : [];
  return (
    <div>
      {commands.map((cmd, i) => <CommandBlock key={i} cmd={cmd} />)}
    </div>
  );
}
