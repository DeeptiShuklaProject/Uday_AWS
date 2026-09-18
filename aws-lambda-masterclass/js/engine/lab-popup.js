/**
 * ============================================================
 * LAB POPUP — Rich-text lab notes for every module
 * ============================================================
 * Saves to labs/ directory on disk via lab-server API.
 * Files are git-trackable HTML fragments.
 */
(function () {
  'use strict';

  // ── Inject CSS ──────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .lab-trigger-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; font-size: 13px; font-weight: 600;
      color: #fff; background: linear-gradient(135deg, #8b5cf6, #6366f1);
      border: none; border-radius: 8px; cursor: pointer;
      transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(99,102,241,0.3); margin-left: 12px;
    }
    .lab-trigger-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.45); background: linear-gradient(135deg, #7c3aed, #4f46e5); }
    .lab-trigger-btn .lab-icon { font-size: 15px; }
    .lab-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; visibility: hidden; transition: opacity 0.25s ease, visibility 0.25s ease;
    }
    .lab-overlay.open { opacity: 1; visibility: visible; }
    .lab-modal {
      width: 90%; max-width: 820px; max-height: 85vh;
      background: #fff; border-radius: 16px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.25);
      display: flex; flex-direction: column;
      transform: translateY(20px) scale(0.97);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); overflow: hidden;
    }
    .lab-overlay.open .lab-modal { transform: translateY(0) scale(1); }
    .lab-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 16px; border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    }
    .lab-header-left { display: flex; align-items: center; gap: 10px; }
    .lab-header-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 10px; font-size: 18px; }
    .lab-header-title { font-size: 16px; font-weight: 700; color: #1e293b; }
    .lab-header-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
    .lab-close-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: #f1f5f9; border-radius: 8px; font-size: 18px; color: #64748b; cursor: pointer; transition: all 0.15s; }
    .lab-close-btn:hover { background: #e2e8f0; color: #1e293b; }
    .lab-toolbar { display: flex; align-items: center; gap: 4px; padding: 10px 24px; border-bottom: 1px solid #f1f5f9; background: #fafbfc; flex-wrap: wrap; }
    .lab-toolbar-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; background: transparent; border-radius: 6px; font-size: 14px; color: #475569; cursor: pointer; transition: all 0.15s; font-weight: 600; }
    .lab-toolbar-btn:hover { background: #e2e8f0; color: #1e293b; }
    .lab-toolbar-sep { width: 1px; height: 20px; background: #e2e8f0; margin: 0 4px; }
    .lab-editor-wrap { flex: 1; overflow-y: auto; padding: 24px; }
    .lab-editor {
      min-height: 280px; outline: none; font-size: 15px; line-height: 1.7;
      color: #1e293b; font-family: 'Inter', -apple-system, sans-serif;
    }
    .lab-editor:empty::before { content: attr(data-placeholder); color: #94a3b8; font-style: italic; pointer-events: none; }
    .lab-editor h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 16px 0 8px; }
    .lab-editor h3 { font-size: 17px; font-weight: 700; color: #0f172a; margin: 16px 0 8px; }
    .lab-editor p { margin: 0 0 12px; }
    .lab-editor ul, .lab-editor ol { margin: 0 0 12px; padding-left: 24px; }
    .lab-editor li { margin-bottom: 4px; }
    .lab-editor code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 13px; color: #6366f1; }
    .lab-editor pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; font-family: 'Consolas', monospace; font-size: 13px; line-height: 1.5; margin: 8px 0 16px; overflow-x: auto; }
    .lab-editor pre code { background: none; color: inherit; padding: 0; }
    .lab-editor blockquote { border-left: 3px solid #6366f1; padding-left: 16px; margin: 8px 0 16px; color: #475569; font-style: italic; }
    .lab-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-top: 1px solid #e5e7eb; background: #f8fafc; }
    .lab-save-status { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
    .lab-save-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
    .lab-save-dot.unsaved { background: #f59e0b; }
    .lab-save-dot.saving { background: #3b82f6; animation: lab-pulse 0.8s infinite; }
    @keyframes lab-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .lab-footer-actions { display: flex; gap: 8px; }
    .lab-btn { padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; transition: all 0.15s; }
    .lab-btn-secondary { background: #f1f5f9; color: #475569; }
    .lab-btn-secondary:hover { background: #e2e8f0; }
    .lab-btn-primary { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,0.3); }
    .lab-btn-primary:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.4); transform: translateY(-1px); }
  `;
  document.head.appendChild(style);

  // ── Helpers ─────────────────────────────────────────────
  function getModuleId() {
    return (window.app && window.app.currentModule) || 'unknown';
  }
  function getModuleTitle() {
    const el = document.querySelector('.topbar-title');
    return el ? el.textContent.trim() : getModuleId();
  }

  // ── API calls (saves to labs/ on disk) ─────────────────
  async function loadNotes(moduleId) {
    try {
      const res = await fetch('/api/lab/' + moduleId);
      const data = await res.json();
      return data.content || '';
    } catch (e) {
      // Fallback to localStorage if server not running
      return localStorage.getItem('lab-notes-' + moduleId) || '';
    }
  }

  async function saveNotes(moduleId, content) {
    try {
      await fetch('/api/lab/' + moduleId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      return true;
    } catch (e) {
      // Fallback to localStorage
      localStorage.setItem('lab-notes-' + moduleId, content);
      return false;
    }
  }

  // ── Build DOM ───────────────────────────────────────────
  function buildPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'lab-overlay';
    overlay.id = 'lab-overlay';
    overlay.innerHTML = `
      <div class="lab-modal">
        <div class="lab-header">
          <div class="lab-header-left">
            <div class="lab-header-icon">🧪</div>
            <div>
              <div class="lab-header-title">Lab Notes</div>
              <div class="lab-header-subtitle" id="lab-subtitle">Loading…</div>
            </div>
          </div>
          <button class="lab-close-btn" id="lab-close" title="Close">&times;</button>
        </div>
        <div class="lab-toolbar">
          <button class="lab-toolbar-btn" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
          <button class="lab-toolbar-btn" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
          <button class="lab-toolbar-btn" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
          <div class="lab-toolbar-sep"></div>
          <button class="lab-toolbar-btn" data-cmd="formatBlock" data-val="H2" title="Heading 2">H2</button>
          <button class="lab-toolbar-btn" data-cmd="formatBlock" data-val="H3" title="Heading 3">H3</button>
          <button class="lab-toolbar-btn" data-cmd="formatBlock" data-val="P" title="Paragraph">¶</button>
          <div class="lab-toolbar-sep"></div>
          <button class="lab-toolbar-btn" data-cmd="insertUnorderedList" title="Bullet List">•≡</button>
          <button class="lab-toolbar-btn" data-cmd="insertOrderedList" title="Numbered List">1.</button>
          <div class="lab-toolbar-sep"></div>
          <button class="lab-toolbar-btn" data-cmd="formatBlock" data-val="BLOCKQUOTE" title="Quote">❝</button>
          <button class="lab-toolbar-btn" id="lab-code-btn" title="Code Block">&lt;/&gt;</button>
          <button class="lab-toolbar-btn" id="lab-link-btn" title="Insert Link">🔗</button>
          <button class="lab-toolbar-btn" data-cmd="insertHorizontalRule" title="Divider">―</button>
          <button class="lab-toolbar-btn" data-cmd="removeFormat" title="Clear Format">🚫</button>
        </div>
        <div class="lab-editor-wrap">
          <div class="lab-editor" id="lab-editor" contenteditable="true"
               data-placeholder="Write your lab notes here… (auto-saved to labs/ folder on disk)"></div>
        </div>
        <div class="lab-footer">
          <div class="lab-save-status">
            <span class="lab-save-dot" id="lab-save-dot"></span>
            <span id="lab-save-text">Saved to disk</span>
          </div>
          <div class="lab-footer-actions">
            <button class="lab-btn lab-btn-secondary" id="lab-clear">Clear</button>
            <button class="lab-btn lab-btn-primary" id="lab-save">Save & Close</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function buildTriggerButton() {
    const btn = document.createElement('button');
    btn.className = 'lab-trigger-btn';
    btn.id = 'lab-trigger';
    btn.innerHTML = '<span class="lab-icon">🧪</span> Lab Notes';
    const actions = document.querySelector('.topbar-actions');
    if (actions) actions.insertBefore(btn, actions.firstChild);
    else { btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9998;'; document.body.appendChild(btn); }
    return btn;
  }

  // ── Init ────────────────────────────────────────────────
  function init() {
    const overlay = buildPopup();
    const trigger = buildTriggerButton();
    const editor  = document.getElementById('lab-editor');
    const closeBtn  = document.getElementById('lab-close');
    const saveBtn   = document.getElementById('lab-save');
    const clearBtn  = document.getElementById('lab-clear');
    const subtitle  = document.getElementById('lab-subtitle');
    const saveDot   = document.getElementById('lab-save-dot');
    const saveText  = document.getElementById('lab-save-text');

    let dirty = false;
    let autoSaveTimer = null;

    async function open() {
      subtitle.textContent = getModuleTitle();
      saveDot.className = 'lab-save-dot saving';
      saveText.textContent = 'Loading…';
      overlay.classList.add('open');

      const content = await loadNotes(getModuleId());
      editor.innerHTML = content;
      dirty = false;
      saveDot.className = 'lab-save-dot';
      saveText.textContent = 'Saved to disk';
      setTimeout(() => editor.focus(), 200);
    }

    async function save() {
      const content = editor.innerHTML.trim();
      saveDot.className = 'lab-save-dot saving';
      saveText.textContent = 'Saving…';

      const savedToDisk = await saveNotes(getModuleId(), (content && content !== '<br>') ? content : '');
      dirty = false;
      saveDot.className = 'lab-save-dot';
      saveText.textContent = savedToDisk ? 'Saved to labs/ folder ✓' : 'Saved (localStorage fallback)';
      updateBadge();
    }

    async function close() {
      await save();
      overlay.classList.remove('open');
    }

    function markDirty() {
      if (!dirty) {
        dirty = true;
        saveDot.className = 'lab-save-dot unsaved';
        saveText.textContent = 'Unsaved changes';
      }
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => save(), 3000);
    }

    function updateBadge() {
      const has = editor.innerHTML.trim() && editor.innerHTML.trim() !== '<br>';
      trigger.innerHTML = has
        ? '<span class="lab-icon">🧪</span> Lab Notes <span style="background:#22c55e;color:#fff;font-size:10px;padding:1px 6px;border-radius:10px;margin-left:2px;">●</span>'
        : '<span class="lab-icon">🧪</span> Lab Notes';
    }

    // Events
    trigger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    saveBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
    editor.addEventListener('input', markDirty);

    clearBtn.addEventListener('click', async () => {
      if (confirm('Clear all lab notes for this chapter?')) {
        editor.innerHTML = '';
        await saveNotes(getModuleId(), '');
        dirty = false;
        saveDot.className = 'lab-save-dot';
        saveText.textContent = 'Cleared';
        updateBadge();
      }
    });

    // Toolbar
    overlay.querySelectorAll('.lab-toolbar-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
        editor.focus(); markDirty();
      });
    });
    document.getElementById('lab-code-btn').addEventListener('click', e => { e.preventDefault(); document.execCommand('formatBlock', false, 'PRE'); editor.focus(); markDirty(); });
    document.getElementById('lab-link-btn').addEventListener('click', e => { e.preventDefault(); const u = prompt('Enter URL:'); if (u) { document.execCommand('createLink', false, u); markDirty(); } editor.focus(); });

    // Keyboard shortcuts
    editor.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); document.execCommand('bold'); markDirty(); break;
          case 'i': e.preventDefault(); document.execCommand('italic'); markDirty(); break;
          case 'u': e.preventDefault(); document.execCommand('underline'); markDirty(); break;
          case 's': e.preventDefault(); save(); break;
        }
      }
      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); markDirty(); }
    });

    // Check if notes exist on load (for badge)
    loadNotes(getModuleId()).then(content => {
      if (content) {
        trigger.innerHTML = '<span class="lab-icon">🧪</span> Lab Notes <span style="background:#22c55e;color:#fff;font-size:10px;padding:1px 6px;border-radius:10px;margin-left:2px;">●</span>';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
