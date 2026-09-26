import { useState } from 'react';

const DIFF_COLORS = {
  beginner: 'var(--color-success-500)',
  intermediate: 'var(--color-warning-500)',
  advanced: 'var(--color-error-500, #ef4444)',
  scenario: 'var(--color-primary-500)',
  troubleshooting: 'var(--color-accent-500, #8b5cf6)',
};
const DIFF_BG = {
  beginner: 'var(--color-success-50)',
  intermediate: 'var(--color-warning-50)',
  advanced: '#fef2f2',
  scenario: 'var(--color-primary-50)',
  troubleshooting: '#f5f3ff',
};
const ORDER = ['beginner', 'intermediate', 'advanced', 'scenario', 'troubleshooting'];
const LABELS = {
  beginner: '🌱 Beginner', intermediate: '📈 Intermediate', advanced: '🚀 Advanced',
  scenario: '🎯 Scenario-Based', troubleshooting: '🔧 Troubleshooting',
};

function InterviewCard({ q, index, level }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`accordion-item${open ? ' open' : ''}`}
      style={{ marginBottom: 8, borderLeft: `3px solid ${DIFF_COLORS[level] || '#6366f1'}` }}>
      <button type="button" className="accordion-header" style={{ padding: '12px 16px' }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 12, padding: '2px 8px', borderRadius: 4,
            background: DIFF_BG[level] || '#eef2ff',
            color: DIFF_COLORS[level] || '#6366f1', fontWeight: 600,
          }}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
          <span>Q{index + 1}: {q.question}</span>
        </span>
        <span className="chevron">▼</span>
      </button>
      <div className="accordion-body">
        <div className="accordion-body-inner" style={{ padding: 16 }}>
          {q.shortAnswer && (
            <div style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--color-success-600, #16a34a)' }}>Short Answer:</strong><br />
              {q.shortAnswer}
            </div>
          )}
          {q.deepExplanation && (
            <div style={{ marginBottom: 12, padding: 12, background: 'var(--color-neutral-50, #f9fafb)', borderRadius: 8 }}>
              <strong>Deep Explanation:</strong><br />{q.deepExplanation}
            </div>
          )}
          {q.example && (
            <div style={{ marginBottom: 12 }}>
              <strong>📌 Real-world Example:</strong><br />{q.example}
            </div>
          )}
          {q.commonMistake && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6, borderLeft: '3px solid #ef4444' }}>
              <strong>⚠️ Common Mistake:</strong> {q.commonMistake}
            </div>
          )}
          {q.followUp && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-primary-50, #eef2ff)', borderRadius: 6 }}>
              <strong>➔ Follow-up:</strong> {q.followUp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** InterviewSection — Q&A cards grouped by difficulty. */
export default function InterviewSection({ content = {} }) {
  const questions = content.questions || (Array.isArray(content) ? content : []);
  const groups = {};
  questions.forEach(q => {
    const d = (q.difficulty || 'beginner').toLowerCase();
    (groups[d] ||= []).push(q);
  });

  return (
    <div>
      {ORDER.filter(level => groups[level]?.length).map(level => (
        <div key={level} style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, color: DIFF_COLORS[level] || 'var(--color-neutral-700)' }}>
            {LABELS[level] || level}
          </h4>
          {groups[level].map((q, i) => <InterviewCard key={i} q={q} index={i} level={level} />)}
        </div>
      ))}
    </div>
  );
}
