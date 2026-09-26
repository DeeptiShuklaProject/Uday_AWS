import { useEffect, useRef, useState } from 'react';
import { useCourse } from '../../context/CourseContext';

/**
 * TerminalSection — simulated CLI terminal.
 * Looks up submitted commands in content.commands { cmd: { text, type } }.
 */
export default function TerminalSection({ content = {}, promptLabel = '›' }) {
  const { progress } = useCourse();
  const commands = content.commands || {};
  const [lines, setLines] = useState(() =>
    content.initialText ? [{ kind: 'output', text: content.initialText }] : []
  );
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  const submit = (e) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    const next = [...lines, { kind: 'prompt', text: cmd }];
    if (cmd === 'clear') {
      setLines([]);
    } else if (cmd === 'help') {
      next.push({ kind: 'output', text: 'Available commands:\n' + Object.keys(commands).join('\n') });
      setLines(next);
    } else if (commands[cmd]) {
      progress.incrementCommands();
      const resp = commands[cmd];
      next.push({ kind: resp.type === 'error' ? 'error' : resp.type === 'success' ? 'success' : 'output', text: resp.text });
      if (resp.explanation) next.push({ kind: 'output', text: `ℹ ${resp.explanation}` });
      setLines(next);
    } else {
      next.push({ kind: 'error', text: `command not found: ${cmd} — type "help" for available commands` });
      setLines(next);
    }
    setInput('');
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="terminal-dot terminal-dot-red" />
        <span className="terminal-dot terminal-dot-yellow" />
        <span className="terminal-dot terminal-dot-green" />
        <span className="terminal-title">{content.title || 'terminal'}</span>
        <span className="terminal-badge terminal-badge-sim">{content.mode || 'simulated'}</span>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {lines.map((l, i) => (
          <div key={i} className={
            l.kind === 'prompt' ? 'terminal-prompt'
            : l.kind === 'error' ? 'terminal-error'
            : l.kind === 'success' ? 'terminal-success'
            : 'terminal-output'
          }>{l.text}</div>
        ))}
        <form className="terminal-input-line" onSubmit={submit}>
          <span className="terminal-prompt">{promptLabel}</span>
          <input
            className="terminal-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="terminal input"
          />
        </form>
      </div>
    </div>
  );
}
