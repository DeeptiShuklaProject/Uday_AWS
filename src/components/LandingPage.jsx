import { useNavigate } from 'react-router-dom';
import { useCourse } from '../context/CourseContext';
import CourseCard from './CourseCard';

/**
 * LandingPage — course home: hero, learning journey, features, progress
 * dashboard, chapter grid and achievements.
 *
 * Fully prop/context-driven — `content` supplies all copy and lists, module
 * cards come from the registry, and stats from the progress model.
 */
export default function LandingPage({ content, categories = [] }) {
  const { modules, course, registry, progress, goToModule } = useCourse();
  const stats = progress.getStats();
  const c = content;
  const navigate = useNavigate();

  // "Start Learning" opens the configured start module (module-04 in the
  // vanilla course); falls back to the first incomplete chapter.
  const firstIncomplete = modules.find(m => !progress.isModuleComplete(m.id));
  const startId =
    (c.hero.startModule && modules.some(m => m.id === c.hero.startModule) && c.hero.startModule) ||
    firstIncomplete?.id || modules[0]?.id;

  const heroStats = c.hero.stats?.length ? c.hero.stats : [
    { value: registry?.stats?.chapters ?? modules.length, label: 'Chapters' },
    { value: `${registry?.stats?.labs ?? 0}+`, label: 'Interactive Labs' },
    { value: `${registry?.stats?.quizQuestions ?? 0}+`, label: 'Quiz Questions' },
    { value: `${registry?.stats?.challenges ?? 0}+`, label: 'Challenges' },
  ];

  return (
    <div className="landing-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-content animate-fade-in-up">
          <div className="hero-badge">{c.hero.badge}</div>
          <h1>{c.hero.titleLead}<br /><span className="highlight">{c.hero.titleAccent}</span></h1>
          <p className="hero-desc">{c.hero.description || course.description}</p>
          <div className="hero-cta-row">
            {startId && (
              <button type="button" className="btn btn-xl btn-primary"
                onClick={() => goToModule(startId)}>
                {c.hero.primaryCta}
              </button>
            )}
            <a href="#chapters" className="btn btn-xl btn-secondary" style={{ textDecoration: 'none' }}>
              {c.hero.secondaryCta}
            </a>
          </div>
          <div className="hero-stats stagger-children">
            {heroStats.map((s, i) => (
              <div key={i} className="hero-stat">
                <div className="hero-stat-value">{s.value}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEARNING JOURNEY */}
      {c.journey?.stages?.length > 0 && (
        <section className="page-section journey-section">
          <div className="container">
            <div className="page-section-header">
              <h2>{c.journey.title}</h2>
              <p>{c.journey.subtitle}</p>
            </div>
            <div className="journey-flow stagger-children">
              {c.journey.stages.map((s, i) => (
                <span key={i} style={{ display: 'contents' }}>
                  <div className="journey-stage">{s}</div>
                  {i < c.journey.stages.length - 1 && <span className="journey-arrow">→</span>}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURES */}
      {c.features?.cards?.length > 0 && (
        <section className="page-section" style={{ background: 'var(--color-neutral-0)' }}>
          <div className="container">
            <div className="page-section-header">
              <h2>{c.features.title}</h2>
              <p>{c.features.subtitle}</p>
            </div>
            <div className="feature-grid stagger-children">
              {c.features.cards.map((f, i) => (
                <div key={i} className="feature-card">
                  <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                  <div className="feature-title">{f.title}</div>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DASHBOARD */}
      <section className="page-section" id="dashboard" style={{ background: 'var(--surface-page)' }}>
        <div className="container">
          <div className="page-section-header">
            <h2>{c.dashboard.title}</h2>
            <p>{c.dashboard.subtitle}</p>
          </div>
          <div className="dashboard-grid stagger-children">
            {c.dashboard.stats.map(s => (
              <div key={s.key} className="stat-card hover-float">
                <div className="stat-card-icon" style={{ background: s.bg, color: s.fg }}>{s.icon}</div>
                <div>
                  <div className="stat-card-value">{stats[s.key] ?? 0}{s.suffix || ''}</div>
                  <div className="stat-card-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES — one folder card per course collection (AWS, Bedrock…) */}
      <section className="page-section" id="chapters" style={{ background: 'var(--color-neutral-0)' }}>
        <div className="container">
          <div className="page-section-header">
            <h2>{c.categories.title}</h2>
            <p>{c.categories.subtitle}</p>
          </div>
          <div className="module-grid stagger-children">
            {categories.map(cat => {
              const itemCount = cat.items.length;
              // Aggregate progress where the category tracks it (AWS modules).
              const pct = cat.kind === 'module' ? stats.overallProgress : undefined;
              const complete = pct === 100;
              return (
                <CourseCard key={cat.id}
                  icon={cat.icon} iconBg={cat.colorBg} iconColor={cat.color}
                  title={cat.title}
                  description={cat.description}
                  progress={pct !== undefined ? { pct, complete } : undefined}
                  meta={[`📦 ${itemCount} ${cat.kind === 'module' ? 'chapters' : 'courses'}`]}
                  onClick={() => navigate(`/courses/${cat.id}`)}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS — vanilla always shows the header; grid is empty when
          the registry has no achievements */}
      <section className="page-section" style={{ background: 'var(--surface-page)' }}>
        <div className="container">
          <div className="page-section-header">
            <h2>{c.achievements.title}</h2>
            <p>{c.achievements.subtitle}</p>
          </div>
          <div className="achievements-grid">
            {(registry?.achievements || []).map(ach => {
              const earned = progress.hasAchievement(ach.id);
              return (
                <div key={ach.id} className={`achievement ${earned ? 'achievement-earned' : 'achievement-locked'}`}>
                  <div className="achievement-icon">{ach.icon}</div>
                  <div className="achievement-info">
                    <div className="achievement-title">{ach.title}</div>
                    <div className="achievement-desc">{ach.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="app-footer">
        <p>{c.footer.line1 || `${course.title} — ${course.subtitle}`}</p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-400)', whiteSpace: 'pre-line' }}>
          {c.footer.line2}
        </p>
      </footer>
    </div>
  );
}
