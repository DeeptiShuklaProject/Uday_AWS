import { useEffect, useRef, useState } from 'react';
import { useCourse } from '../../context/CourseContext';

function QuizQuestion({ q, index, onAnswered }) {
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;
  const correct = answered && selected === q.correctId;

  const choose = (optId) => {
    if (answered) return;
    setSelected(optId);
    onAnswered?.(q.id, optId === q.correctId);
  };

  return (
    <div className="quiz-card">
      <div className="quiz-header">
        <div className="quiz-icon">🧠</div>
        <div>
          <div className="quiz-type">Question {index + 1}{q.difficulty ? ` · ${q.difficulty}` : ''}</div>
          <div className="quiz-question">{q.question}</div>
        </div>
      </div>
      <div className="quiz-options">
        {(q.options || []).map((opt, i) => {
          let cls = 'quiz-option';
          if (answered) {
            if (opt.id === q.correctId) cls += ' correct';
            else if (opt.id === selected) cls += ' incorrect';
          } else if (opt.id === selected) cls += ' selected';
          return (
            <button key={opt.id || i} type="button" className={cls} onClick={() => choose(opt.id)}>
              <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <div className={`quiz-result ${correct ? 'quiz-result-correct' : 'quiz-result-incorrect'}`}>
            {correct ? '✅ Correct' : '❌ Incorrect'}
          </div>
          {q.explanation && (
            <div className="quiz-explanation visible" style={{ marginTop: 12 }}>{q.explanation}</div>
          )}
        </>
      )}
    </div>
  );
}

/** QuizSection — knowledge-check question cards with instant feedback. */
export default function QuizSection({ content = {}, sectionId, completeLabel = 'Quiz complete' }) {
  const { progress, currentModule } = useCourse();
  const moduleId = currentModule?.id;
  const questions = content.questions || [];
  const [answers, setAnswers] = useState({});
  const recorded = useRef(false);

  const record = (qid, ok) => setAnswers(a => ({ ...a, [qid]: ok }));
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(Boolean).length;

  // Record the score once all questions are answered (ProgressEngine parity).
  useEffect(() => {
    if (questions.length > 0 && answeredCount === questions.length && !recorded.current) {
      recorded.current = true;
      progress.recordQuizScore(moduleId, sectionId || 'quiz', correctCount, questions.length);
    }
  }, [answeredCount, correctCount, questions.length, progress, moduleId, sectionId]);

  return (
    <div>
      {content.title && (
        <div className="progress-label">
          <span className="progress-label-title">{content.title}</span>
          <span className="progress-label-value">
            {answeredCount === questions.length && questions.length > 0
              ? `${completeLabel}: ${correctCount}/${questions.length}`
              : `${answeredCount}/${questions.length}`}
          </span>
        </div>
      )}
      {questions.map((q, i) => (
        <QuizQuestion key={q.id || i} q={q} index={i} onAnswered={record} />
      ))}
    </div>
  );
}
