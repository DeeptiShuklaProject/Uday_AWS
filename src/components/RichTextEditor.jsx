import { useEffect, useRef } from 'react';

const DEFAULT_COMMANDS = [
  { cmd: 'bold', icon: '<b>B</b>', title: 'Bold (Ctrl+B)' },
  { cmd: 'italic', icon: '<i>I</i>', title: 'Italic (Ctrl+I)' },
  { cmd: 'underline', icon: '<u>U</u>', title: 'Underline (Ctrl+U)' },
  { sep: true },
  { cmd: 'formatBlock', val: 'H2', icon: 'H2', title: 'Heading 2' },
  { cmd: 'formatBlock', val: 'H3', icon: 'H3', title: 'Heading 3' },
  { cmd: 'formatBlock', val: 'P', icon: '¶', title: 'Paragraph' },
  { sep: true },
  { cmd: 'insertUnorderedList', icon: '•≡', title: 'Bullet List' },
  { cmd: 'insertOrderedList', icon: '1.', title: 'Numbered List' },
  { sep: true },
  { cmd: 'formatBlock', val: 'BLOCKQUOTE', icon: '❝', title: 'Quote' },
  { cmd: 'codeBlock', icon: '&lt;/&gt;', title: 'Code Block' },
  { cmd: 'link', icon: '🔗', title: 'Insert Link' },
  { cmd: 'insertHorizontalRule', icon: '―', title: 'Divider' },
  { cmd: 'removeFormat', icon: '🚫', title: 'Clear Format' },
];

/**
 * RichTextEditor — contenteditable editor wrapped in React.
 * Toolbar commands are data-driven (`commands` prop, defaults provided);
 * content flows out through `onChange(html)`; initial content via `initialHtml`.
 */
export default function RichTextEditor({
  initialHtml = '',
  onChange,
  onShortcutSave,
  commands = DEFAULT_COMMANDS,
  placeholder = 'Write your notes here…',
  linkPrompt = 'Enter URL:',
}) {
  const editorRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Set initial content once (component is remounted per chapter via `key`).
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitChange = () => onChangeRef.current?.(editorRef.current?.innerHTML ?? '');

  const exec = (cmd, val = null) => {
    if (cmd === 'codeBlock') {
      document.execCommand('formatBlock', false, 'PRE');
    } else if (cmd === 'link') {
      const u = window.prompt(linkPrompt);
      if (!u) { editorRef.current?.focus(); return; }
      document.execCommand('createLink', false, u);
    } else {
      document.execCommand(cmd, false, val);
    }
    editorRef.current?.focus();
    emitChange();
  };

  const onKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); exec('bold'); return;
        case 'i': e.preventDefault(); exec('italic'); return;
        case 'u': e.preventDefault(); exec('underline'); return;
        case 's': e.preventDefault(); onShortcutSave?.(); return;
        default: break;
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    ');
      emitChange();
    }
  };

  return (
    <div className="rte">
      <div className="lab-toolbar" role="toolbar" aria-label="Notes formatting">
        {commands.map((c, i) =>
          c.sep
            ? <span key={i} className="lab-toolbar-sep" />
            : (
              <button
                key={i}
                type="button"
                className="lab-toolbar-btn"
                title={c.title}
                onMouseDown={e => e.preventDefault() /* keep editor selection */}
                onClick={() => exec(c.cmd, c.val || null)}
                dangerouslySetInnerHTML={{ __html: c.icon }}
              />
            )
        )}
      </div>
      <div
        ref={editorRef}
        className="lab-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
