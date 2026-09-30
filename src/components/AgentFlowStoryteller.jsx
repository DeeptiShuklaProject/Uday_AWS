import { useEffect, useRef, useState } from 'react';

/**
 * AgentFlowStoryteller — animated slide-deck widget rendered inside doc
 * chapters via the <AgentFlowStoryteller /> markdown tag (handled by
 * moduleParser → 'storyteller' section → SlideRenderer).
 *
 * Ported from the aura_docs doc engine; Tailwind utilities replaced with
 * scoped .afs-* classes (src/css/agentflow.css).
 */

const defaultSteps = [
  {
    id: "step-1",
    text: "Strands Agents SDK represents a new generation of agentic frameworks. At its core, an AI agent is code that orchestrates tasks. By integrating a Large Language Model (LLM), the agent gains natural language understanding and reasoning capability.",
    state: { showAgent: true, showLLM: true, showTools: false, showQuery: false, showLoop: false, showTemplates: false, centerLabel: "Agent" }
  },
  {
    id: "step-2",
    text: "To give the agent true agency and external capabilities, we connect it with Tools. Tools integrate with external APIs and services—executing actions like sending emails, booking flights, or fetching live data upon receiving user queries.",
    state: { showAgent: true, showLLM: true, showTools: true, showQuery: true, showLoop: false, showTemplates: false, centerLabel: "Agent" }
  },
  {
    id: "step-3",
    text: "The Agentic Loop dynamically evaluates incoming queries, determines appropriate tool usage, inspects intermediate responses, and iterates until the objective is accomplished. Traditional frameworks relied on heavy prompt templates to manage this loop.",
    state: { showAgent: true, showLLM: true, showTools: true, showQuery: true, showLoop: true, showTemplates: true, centerLabel: "Agent" }
  },
  {
    id: "step-4",
    text: "Modern Large Language Models possess native reasoning and fine-tuned tool-calling capabilities, eliminating the need for rigid prompt templates. Strands Agents SDK offers a lightweight, model-first framework that relies on native model intelligence.",
    state: { showAgent: true, showLLM: true, showTools: true, showQuery: true, showLoop: true, showTemplates: false, centerLabel: "Strands Agents SDK" }
  }
];

function visibilityClass(visible) {
  return `afs-fade ${visible ? 'afs-show' : 'afs-hide'}`;
}

function VectorDiagramStage({ diagramState = {} }) {
  const {
    showLLM = false,
    showTools = false,
    showQuery = false,
    showLoop = false,
    showTemplates = false,
    centerLabel = 'Agent',
  } = diagramState;

  const isStrandsMode = centerLabel.includes('Strands');
  const templatesClass = showTemplates === true ? 'afs-show'
    : showTemplates === 'fading' ? 'afs-dim' : 'afs-hide';

  return (
    <div className="afs-svg-wrap">
      <svg className="afs-svg" viewBox="0 0 760 360" fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* QUERY ARROW (Left) */}
        <g className={visibilityClass(showQuery)}>
          <line x1="60" y1="180" x2="250" y2="180" stroke="#0f172a" strokeWidth="4" strokeDasharray="8 4" />
          <polygon points="258,180 244,172 244,188" fill="#0f172a" />
          <text x="100" y="170" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="900">
            Query
          </text>
        </g>

        {/* LLM CIRCLE (Top) */}
        <g className={visibilityClass(showLLM)}>
          <line x1="380" y1="130" x2="380" y2="95" stroke="#0f172a" strokeWidth="4" />
          <polygon points="380,88 373,100 387,100" fill="#0f172a" />
          <polygon points="380,136 373,124 387,124" fill="#0f172a" />

          <circle cx="380" cy="50" r="42" fill="#ffffff" stroke="#0f172a" strokeWidth="4" />
          <text x="380" y="58" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="900">
            LLM
          </text>
        </g>

        {/* TOOLS DIAMOND (Right) */}
        <g className={visibilityClass(showTools)}>
          <line x1="470" y1="180" x2="540" y2="180" stroke="#0f172a" strokeWidth="4" />
          <polygon points="548,180 534,173 534,187" fill="#0f172a" />

          <polygon points="610,125 670,180 610,235 550,180" fill="#ffffff" stroke="#0f172a" strokeWidth="4" />
          <text x="610" y="186" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="900">
            Tools
          </text>
        </g>

        {/* AGENTIC LOOP (Underneath) */}
        <g className={visibilityClass(showLoop)}>
          <path d="M 320 235 C 290 315, 470 315, 440 235" fill="none" stroke="#0f172a" strokeWidth="4" strokeDasharray="6 4" />
          <polygon points="440,227 432,241 448,241" fill="#0f172a" />

          <rect x="320" y="295" width="120" height="28" rx="6" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <text x="380" y="314" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900">
            Agentic Loop
          </text>
        </g>

        {/* PROMPT TEMPLATES (Bottom Left Stack) */}
        <g className={`afs-fade ${templatesClass}`}>
          <rect x="200" y="235" width="75" height="90" rx="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
          <rect x="180" y="225" width="75" height="90" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <rect x="160" y="215" width="75" height="90" rx="4" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
          <line x1="172" y1="231" x2="225" y2="231" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="172" y1="243" x2="215" y2="243" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="172" y1="255" x2="220" y2="255" stroke="#0f172a" strokeWidth="2.5" />
          <text x="197" y="285" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="900">
            Prompt
          </text>
          <text x="197" y="299" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="900">
            Templates
          </text>
        </g>

        {/* CENTER BOX (Agent vs Strands SDK) */}
        <g className="afs-fade">
          <rect
            x="280"
            y="130"
            width="190"
            height="105"
            rx="8"
            fill={isStrandsMode ? '#f0f9ff' : '#ffffff'}
            stroke={isStrandsMode ? '#0284c7' : '#0f172a'}
            strokeWidth="4"
          />

          {isStrandsMode ? (
            <>
              <text x="375" y="172" textAnchor="middle" fill="#0369a1" fontSize="22" fontWeight="900">
                Strands
              </text>
              <text x="375" y="198" textAnchor="middle" fill="#0369a1" fontSize="18" fontWeight="800">
                Agents SDK
              </text>
            </>
          ) : (
            <text x="375" y="192" textAnchor="middle" fill="#0f172a" fontSize="26" fontWeight="900">
              {centerLabel}
            </text>
          )}
        </g>

      </svg>
    </div>
  );
}

export default function AgentFlowStoryteller({ steps = defaultSteps, autoPlayIntervalMs = 7000, title }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rootRef = useRef(null);
  // armed: becomes true once the widget has been OUT of view — autoplay
  // only fires on a later scroll-into-view, never at mount (a widget
  // visible on page load would consume the story before it's read).
  // user: any manual control hands the deck to the learner — the
  // observer stops auto-playing/auto-resetting after that.
  const autoRef = useRef({ armed: false, user: false });

  const activeSteps = steps && steps.length > 0 ? steps : defaultSteps;
  const currentStep = activeSteps[activeStepIndex] || activeSteps[0];
  const isFirstSlide = activeStepIndex === 0;
  const isLastSlide = activeStepIndex === activeSteps.length - 1;

  const takeControl = () => { autoRef.current.user = true; };
  const handleNext = () => { takeControl(); if (!isLastSlide) setActiveStepIndex(p => p + 1); };
  const handlePrev = () => { takeControl(); if (!isFirstSlide) setActiveStepIndex(p => p - 1); };

  // Autoplay when scrolled into view; reset to slide 1 on scroll-out so
  // the story replays from the start when the learner comes back.
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') return;
    const el = rootRef.current;
    if (!el) return;
    const auto = autoRef.current;
    const io = new IntersectionObserver(([e]) => {
      if (auto.user) return;
      if (e.isIntersecting) {
        if (auto.armed) setIsPlaying(true);
      } else {
        auto.armed = true;
        setIsPlaying(false);
        setActiveStepIndex(0);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ←/→ arrow keys while the widget is focused
  const onKeyDown = e => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
  };

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (isLastSlide) { setIsPlaying(false); return undefined; }
    const timer = setInterval(() => {
      setActiveStepIndex(p => (p < activeSteps.length - 1 ? p + 1 : p));
    }, autoPlayIntervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, isLastSlide, activeSteps.length, autoPlayIntervalMs]);

  return (
    <div className="afs-root" ref={rootRef} tabIndex={0} role="region"
      aria-label={title || 'Animated agent architecture walkthrough'}
      onKeyDown={onKeyDown}>

      {/* Stage: narration card on the left, vector diagram on the right */}
      <div className="afs-stage">

        {/* Slide counter badge */}
        <div className="afs-badge">
          Slide <span className="afs-badge-num">{activeStepIndex + 1}</span> / {activeSteps.length}
        </div>

        <button
          type="button"
          onClick={handlePrev}
          disabled={isFirstSlide}
          className={`afs-arrow afs-arrow-left ${isFirstSlide ? 'afs-arrow-disabled' : ''}`}
          title={isFirstSlide ? 'First slide reached' : 'Previous Slide'}
          aria-label="Previous slide"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="afs-grid">

          {/* Narration card */}
          <div className="afs-text-card">
            <div className="afs-label">{title || 'Overview'}</div>
            <p className="afs-step-text" aria-live="polite">&ldquo;{currentStep.text}&rdquo;</p>
          </div>

          {/* Vector diagram */}
          <div className="afs-diagram">
            <VectorDiagramStage diagramState={currentStep.state} />
          </div>

        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={isLastSlide}
          className={`afs-arrow afs-arrow-right ${isLastSlide ? 'afs-arrow-disabled' : ''}`}
          title={isLastSlide ? 'Last slide reached' : 'Next Slide'}
          aria-label="Next slide"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>

      {/* Control dock */}
      <div className="afs-dock">
        <button
          type="button"
          onClick={() => {
            takeControl();
            if (isLastSlide && !isPlaying) setActiveStepIndex(0);
            setIsPlaying(!isPlaying);
          }}
          className="afs-dock-play"
          aria-label={isPlaying ? 'Pause autoplay' : 'Play slides'}
        >
          <span>{isPlaying ? '❚❚ Pause' : isLastSlide ? '▶ Replay' : '▶ Play'}</span>
        </button>

        <div className="afs-dock-pages">
          {activeSteps.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { takeControl(); setActiveStepIndex(idx); }}
              className={`afs-dock-page ${idx === activeStepIndex ? 'afs-dock-page-active' : ''}`}
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={idx === activeStepIndex ? 'true' : undefined}
            >
              Slide {idx + 1}
            </button>
          ))}
        </div>

        <div className="afs-dock-count">
          <span className="afs-badge-num">{activeStepIndex + 1}</span> / {activeSteps.length}
        </div>
      </div>

    </div>
  );
}
