import { useEffect, useRef, useState } from 'react';
import { useCourse } from '../../context/CourseContext';

/**
 * LabSection — hands-on lab checklist card (reference-style):
 * bordered card with header (icon + title + difficulty/duration badges),
 * a Lab Progress bar, then step cards each with a numbered indicator and
 * a "Mark Complete" toggle. Completing every step records the lab.
 *
 * content: { title, description, difficulty, duration?, steps: [{id,title,instruction,expectedResult,hint}] }
 */
export default function LabSection({ content = {}, sectionId, hintsLabel = 'Hint' }) {
  const { progress, currentModule } = useCourse();
  const moduleId = currentModule?.id;
  const steps = content.steps || [];
  const [done, setDone] = useState({});
  const [openHint, setOpenHint] = useState({});
  const recorded = useRef(false);
  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  // Count the lab as completed once every step is checked off.
  useEffect(() => {
    if (steps.length > 0 && doneCount === steps.length && !recorded.current) {
      recorded.current = true;
      progress.markLabComplete(moduleId, sectionId || 'lab');
    }
  }, [doneCount, steps.length, progress, moduleId, sectionId]);

  const toggle = (key) => setDone(d => ({ ...d, [key]: !d[key] }));
  const nextOpen = steps.findIndex((s, i) => !done[s.id || i]);

  return (
    <div className="lab-card">
      {(content.title || content.description) && (
        <div className="lab-card-head">
          <div className="lab-card-icon">🧪</div>
          <div className="lab-card-head-main">
            <div className="lab-card-badges">
              <span className={`badge difficulty-${content.difficulty || 'beginner'}`}>
                {content.difficulty || 'beginner'}
              </span>
              {content.duration && (
                <span className="badge badge-neutral">⏱ {content.duration}</span>
              )}
            </div>
            {content.title && <div className="lab-card-title">{content.title}</div>}
            {content.description && <p className="lab-card-desc">{content.description}</p>}
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <div className="lab-progress">
          <div className="progress-label">
            <span className="progress-label-title">Lab Progress</span>
            <span className="progress-label-value">{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="lab-steps">
        {steps.map((step, i) => {
          const key = step.id || i;
          const complete = !!done[key];
          const isCurrent = i === nextOpen;
          return (
            <div key={key} className={`lab-step${complete ? ' done' : ''}${isCurrent ? ' current' : ''}`}>
              <div className="lab-step-num">{complete ? '✓' : i + 1}</div>
              <div className="lab-step-body">
                <div className="lab-step-top">
                  <span className="lab-step-title">{step.title}</span>
                  <button
                    type="button"
                    className={`btn btn-xs ${complete ? 'lab-step-btn-done' : 'btn-success'}`}
                    onClick={() => toggle(key)}
                  >{complete ? '✓ Completed' : '✓ Mark Complete'}</button>
                </div>
                {step.html
                  ? <div className="slide-html step-html" dangerouslySetInnerHTML={{ __html: step.html }} />
                  : step.instruction && <p className="step-desc">{step.instruction}</p>}
                {step.expectedResult && (
                  <p className="step-desc"><strong>Expected:</strong> {step.expectedResult}</p>
                )}
                {step.hint && (
                  <>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={() => setOpenHint(h => ({ ...h, [key]: !h[key] }))}
                    >💡 {hintsLabel}</button>
                    {openHint[key] && (
                      <div className="alert alert-warning" style={{ marginTop: 8, marginBottom: 0 }}>
                        <span className="alert-icon">💡</span>
                        <div className="alert-content"><div className="alert-text">{step.hint}</div></div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
