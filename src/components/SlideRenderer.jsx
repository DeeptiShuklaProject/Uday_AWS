import {
  HtmlSection, DiagramSection, QuizSection, CommandSection, TerminalSection,
  CodeSection, LabSection, ChallengeSection, TroubleshootingSection,
  InterviewSection, NextSection,
} from './slides';

const SECTION_ICONS = {
  why: '💡', architecture: '📐', concept: '📖', lab: '🔬', console: '🖥️',
  terminal: '💻', code: '👨‍💻', command: '⌨️', 'expected-output': '📤',
  'what-happened': '🔍', troubleshooting: '🔧', quiz: '🧠', challenge: '🏆',
  cleanup: '🧹', next: '➡️', text: '📝', interview: '🎙️',
};

const HTML_TYPES = new Set(['text', 'why', 'concept', 'expected-output', 'what-happened', 'cleanup']);

/**
 * SlideRenderer — renders a single lesson section ("slide") by type.
 */
export default function SlideRenderer({ section }) {
  if (!section) return null;
  const icon = section.icon || SECTION_ICONS[section.type] || '📌';

  const body = (() => {
    const c = section.content;
    if (HTML_TYPES.has(section.type)) return <HtmlSection content={c} />;
    switch (section.type) {
      case 'architecture':    return <DiagramSection content={c} />;
      case 'quiz':            return <QuizSection content={c} sectionId={section.id} />;
      case 'command':         return <CommandSection content={c} />;
      case 'terminal':        return <TerminalSection content={c} />;
      case 'code':            return <CodeSection content={c} />;
      case 'lab':             return <LabSection content={c} sectionId={section.id} />;
      case 'challenge':       return <ChallengeSection content={c} sectionId={section.id} />;
      case 'troubleshooting': return <TroubleshootingSection content={c} />;
      case 'interview':       return <InterviewSection content={c} />;
      case 'next':            return <NextSection content={c} />;
      default:                return <HtmlSection content={c} />;
    }
  })();

  return (
    <div className="lesson-section slide-section">
      {section.title && (
        <div className="lesson-section-header">
          <div className="lesson-section-icon" style={{ background: 'var(--color-neutral-100)' }}>{icon}</div>
          <h2>{section.title}</h2>
        </div>
      )}
      <div className="lesson-section-body">{body}</div>
    </div>
  );
}
