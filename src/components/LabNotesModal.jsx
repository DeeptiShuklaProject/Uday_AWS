import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import Modal from './Modal';
import LabAccordion from './LabAccordion';
import RichTextEditor from './RichTextEditor';
import { useChapterData } from '../hooks/useChapterData';
import { useLabNotes } from '../hooks/useLabNotes';
import { useCourse } from '../context/CourseContext';
import { extractPracticalLabs, splitLabsIntoSections, resolveMediaUrls } from '../utils/markdown';

const AUTOSAVE_MS = 3000;

/**
 * LabNotesModal — practical lab instructions (single-open accordion) plus a
 * rich-text personal-notes editor with debounced autosave.
 *
 * Saves via the notes API ({notesEndpoint}/{moduleId}) with a localStorage
 * fallback — same contract as the vanilla lab-popup.
 */
export default function LabNotesModal({
  open,
  onClose,
  title = 'Lab Notes',
  icon = '🧪',
  labsHeading = '🔬 Practical Lab Instructions',
  notesHeading = '✏️ Your Personal Notes',
  placeholder = 'Write your lab notes here… (auto-saved)',
  clearConfirm = 'Clear all lab notes for this chapter?',
  clearLabel = 'Clear',
  saveCloseLabel = 'Save & Close',
  statusLabels = {},
}) {
  const { currentModule, config } = useCourse();
  const moduleId = currentModule?.id;
  const { markdown } = useChapterData(currentModule, config.chapterBaseUrl, open);
  const { load, save } = useLabNotes(moduleId, { endpoint: config.notesEndpoint });

  const labels = {
    loading: 'Loading…', saving: 'Saving…', savedServer: 'Saved ✓',
    savedLocal: 'Saved (local fallback)', unsaved: 'Unsaved changes',
    cleared: 'Cleared', ...statusLabels,
  };

  const [labsHtml, setLabsHtml] = useState('');
  const [initialNotes, setInitialNotes] = useState(null);
  const [status, setStatus] = useState('loading'); // loading|saving|saved|unsaved
  const latestHtml = useRef('');
  const dirty = useRef(false);
  const timer = useRef(null);

  // Extract lab sections once markdown arrives.
  useEffect(() => {
    if (!open || !markdown) { if (!open) setLabsHtml(''); return; }
    const labMd = extractPracticalLabs(markdown);
    setLabsHtml(labMd ? resolveMediaUrls(marked.parse(labMd), config.chapterBaseUrl) : '');
  }, [open, markdown]);

  // Load saved notes when the modal opens / chapter changes.
  // initialNotes is reset to null first so the editor unmounts and
  // remounts with the freshly loaded content (it sets innerHTML on mount).
  useEffect(() => {
    if (!open || !moduleId) return;
    let cancelled = false;
    setStatus('loading');
    setInitialNotes(null);
    load().then(content => {
      if (cancelled) return;
      setInitialNotes(content);
      latestHtml.current = content;
      dirty.current = false;
      setStatus('saved');
    });
    return () => { cancelled = true; clearTimeout(timer.current); };
  }, [open, moduleId, load]);

  const doSave = async () => {
    if (!moduleId) return;
    setStatus('saving');
    const target = await save(latestHtml.current);
    dirty.current = false;
    setStatus(target === 'server' ? 'saved' : 'savedLocal');
  };

  const onChange = (html) => {
    latestHtml.current = html;
    if (!dirty.current) { dirty.current = true; setStatus('unsaved'); }
    clearTimeout(timer.current);
    timer.current = setTimeout(doSave, AUTOSAVE_MS);
  };

  const close = async () => {
    clearTimeout(timer.current);
    if (dirty.current) await doSave();
    onClose?.();
  };

  const clear = async () => {
    if (!window.confirm(clearConfirm)) return;
    clearTimeout(timer.current);
    latestHtml.current = '';
    dirty.current = false;
    setInitialNotes('');
    setStatus('saving');
    await save('');
    setStatus('cleared');
  };

  const labSections = splitLabsIntoSections(labsHtml);
  const dotClass = status === 'saving' || status === 'loading'
    ? 'lab-save-dot saving'
    : status === 'unsaved' ? 'lab-save-dot unsaved' : 'lab-save-dot';

  return (
    <Modal
      open={open}
      onClose={close}
      icon={icon}
      title={title}
      subtitle={currentModule ? `Chapter ${currentModule.number}: ${currentModule.title}` : ''}
      footer={
        <>
          <div className="lab-save-status">
            <span className={dotClass} />
            <span>{labels[status] || labels.savedServer}</span>
          </div>
          <div className="lab-footer-actions">
            <button type="button" className="lab-btn lab-btn-secondary" onClick={clear}>{clearLabel}</button>
            <button type="button" className="lab-btn lab-btn-primary" onClick={close}>{saveCloseLabel}</button>
          </div>
        </>
      }
    >
      <div className="lab-content-section">
        <div className="lab-content-static-title">{labsHeading}</div>
        {markdown == null
          ? <em>{labels.loading}</em>
          : <LabAccordion sections={labSections} />}
      </div>
      <div className="lab-notes-separator">{notesHeading}</div>
      {initialNotes !== null && (
        <RichTextEditor
          key={moduleId}
          initialHtml={initialNotes}
          onChange={onChange}
          onShortcutSave={doSave}
          placeholder={placeholder}
        />
      )}
    </Modal>
  );
}
