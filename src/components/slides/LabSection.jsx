import { useEffect, useRef, useState } from 'react';
import { useCourse } from '../../context/CourseContext';

/**
 * LabSection — step-by-step hands-on lab checklist.
 * content: { title, description, difficulty, steps: [{id,title,instruction,expectedResult,hint}] }
 */
export default function LabSection({ content = {}, sectionId, hintsLabel = 'Hint' }) {
  const { progress, currentModuleId } = useCourse();
  const steps = content.steps || [];
  const [done, setDone] = useState({});
  const [openHint, setOpenHint] = useState({});
  const recorded = useRef(false);
  const doneCount = Object.values(done).filter(Boolean).length;

  // Count the lab as completed once every step is checked off.
  useEffect(() => {
    if (steps.length > 0 && doneCount === steps.length && !recorded.current) {
      recorded.current = true;
      progress.markLabComplete(currentModuleId, sectionId || 'lab');
    }
  }, [doneCount, steps.length, progress, currentModuleId, sectionId]);

  return (
    <div>
      {(content.title || content.description) && (
        <div className="alert alert-tip">
          <span className="alert-icon">🔬</span>
          <div className="alert-content">
            {content.title && <div className="alert-title">{content.title}</div>}
            {content.description && <div className="alert-text">{content.description}</div>}
          </div>
        </div>
      )}
      <div className="steps">
        {steps.map((step, i) => {
          const complete = !!done[step.id || i];
          return (
            <div key={step.id || i} className="step-item">
              <div className="step-indicator">
                <button
                  type="button"
                  className={`step-circle ${complete ? 'step-circle-complete' : 'step-circle-pending'}`}
                  onClick={() => setDone(d => ({ ...d, [step.id || i]: !complete }))}
                  title={complete ? 'Mark incomplete' : 'Mark complete'}
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  {complete ? '✓' : i + 1}
                </button>
                {i < steps.length - 1 && <div className={`step-line${complete ? ' step-line-complete' : ''}`} />}
              </div>
              <div className="step-content">
                <div className="step-title">{step.title}</div>
                {step.instruction && <p className="step-desc">{step.instruction}</p>}
                {step.expectedResult && (
                  <p className="step-desc"><strong>Expected:</strong> {step.expectedResult}</p>
                )}
                {step.hint && (
                  <>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={() => setOpenHint(h => ({ ...h, [step.id || i]: !h[step.id || i] }))}
                    >💡 {hintsLabel}</button>
                    {openHint[step.id || i] && (
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
