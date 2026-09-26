import Modal from './Modal';
import MarkdownRenderer from './MarkdownRenderer';
import { useChapterData } from '../hooks/useChapterData';
import { useCourse } from '../context/CourseContext';
import { stripPracticalLabs } from '../utils/markdown';
import { useMemo } from 'react';

/**
 * DetailedChapterModal — full chapter documentation for the CURRENT module,
 * with Practical Lab sections stripped out. Markdown + mermaid rendering.
 */
export default function DetailedChapterModal({
  open,
  onClose,
  title = 'Chapter Details',
  icon = '📄',
  loadingLabel = 'Loading content…',
  errorLabel = 'Failed to load or parse Markdown.',
}) {
  const { currentModule, config } = useCourse();
  const { markdown, loading, error } = useChapterData(currentModule, config.chapterBaseUrl, open);

  const chapterOnly = useMemo(
    () => (markdown ? stripPracticalLabs(markdown) : ''),
    [markdown]
  );

  return (
    <Modal open={open} onClose={onClose} icon={icon} title={title}
      subtitle={currentModule ? `Chapter ${currentModule.number}: ${currentModule.title}` : ''}>
      {loading && <em>{loadingLabel}</em>}
      {error && <div className="lab-content-empty">{errorLabel}</div>}
      {!loading && !error && <MarkdownRenderer markdown={chapterOnly} imageBaseUrl={config.chapterBaseUrl} />}
    </Modal>
  );
}
