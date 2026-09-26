/**
 * Landing page content — data only, no logic.
 * Kept out of components so the LandingPage component stays fully
 * prop-driven/reusable; edit this file (or supply your own object)
 * to rebrand the page.
 */
export const landingContent = {
  hero: {
    badge: '🚀 Interactive Learning Platform',
    // Rendered as: {titleLead}<br/><span class="highlight">{titleAccent}</span>
    titleLead: 'AWS Production',
    titleAccent: 'Masterclass',
    description:
      'Build, deploy, secure, scale, and operate a real AWS production environment. 47 chapters. One continuous project. From zero to production-ready architect.',
    primaryCta: '🚀 Start Learning',
    secondaryCta: '📚 Browse Chapters',
    // Vanilla index.html links Start Learning straight to module-04 (VPC —
    // the production story's first build step).
    startModule: 'module-04',
    stats: [
      { value: '47', label: 'Chapters' },
      { value: '50+', label: 'Interactive Labs' },
      { value: '100+', label: 'Quiz Questions' },
      { value: '20+', label: 'Challenges' },
    ],
  },

  // Thematic path through the course (production story beats).
  journey: {
    title: 'Your Learning Journey',
    subtitle:
      'A production-oriented path — each chapter solves a real problem that naturally introduces the next AWS service.',
    stages: [
      '🏗️ Build Network', '🖥️ Launch App', '🪣 Store Files', '🔐 Secure Access',
      '⚖️ Load Balance', '🌐 Add DNS', '🌍 Add CDN', '📊 Monitor', '🗃️ Database',
      '🔐 Encrypt', '⚡ Go Serverless', '📨 Messaging', '🚀 Containers', '🔄 CI/CD',
      '⚙️ IaC', '🛡️ Protect', '🏢 Govern', '🧠 GenAI',
    ],
  },

  features: {
    title: 'What Makes This Different',
    subtitle: 'Not just documentation. A hands-on, interactive learning experience.',
    cards: [
      { icon: '🖥️', bg: 'var(--color-primary-50)', title: 'AWS Console Simulator',
        desc: 'Navigate a simulated AWS Console with guided step-by-step instructions. Learn by doing.' },
      { icon: '💻', bg: 'var(--color-accent-50)', title: 'Interactive Terminal',
        desc: 'Execute simulated AWS CLI, SAM, and CDK commands with realistic output in your browser.' },
      { icon: '👨‍💻', bg: 'var(--color-success-50)', title: 'Code Editor',
        desc: 'Write, run, and debug Lambda functions in Python, Node.js, and more with line-by-line explanations.' },
      { icon: '📐', bg: 'var(--color-warning-50)', title: 'Architecture Diagrams',
        desc: 'Interactive diagrams where you click components to inspect event payloads and data flows.' },
      { icon: '🔧', bg: '#fdf2f8', title: 'Troubleshooting Labs',
        desc: 'Real-world production incidents. Investigate logs, metrics, and IAM policies to find root causes.' },
      { icon: '🎤', bg: '#f5f3ff', title: 'Interview Preparation',
        desc: 'Beginner to Architect-level questions with short answers, deep explanations, and follow-ups.' },
    ],
  },

  dashboard: {
    title: 'Your Progress',
    subtitle: 'Track your learning journey across all 47 chapters.',
    stats: [
      { key: 'overallProgress', icon: '📊', bg: 'var(--color-primary-50)', fg: 'var(--color-primary-500)', label: 'Overall Progress', suffix: '%' },
      { key: 'commandsExecuted', icon: '⌨️', bg: 'var(--color-success-50)', fg: 'var(--color-success-500)', label: 'Commands Executed' },
      { key: 'quizzesTaken', icon: '🧠', bg: 'var(--color-accent-50)', fg: 'var(--color-accent-500)', label: 'Quizzes Taken' },
      { key: 'labsCompleted', icon: '🔬', bg: 'var(--color-warning-50)', fg: 'var(--color-warning-500)', label: 'Labs Completed' },
      { key: 'challengesSolved', icon: '🏆', bg: '#fdf2f8', fg: '#ec4899', label: 'Challenges Solved' },
      { key: 'achievementCount', icon: '🎖️', bg: '#f5f3ff', fg: '#8b5cf6', label: 'Achievements' },
    ],
  },

  chapters: {
    title: 'Course Chapters',
    subtitle: '47 chapters following a real-world production architecture journey.',
  },

  achievements: {
    title: 'Achievements',
    subtitle: 'Professional badges earned through mastery.',
  },

  footer: {
    line1: 'AWS Production Masterclass — Interactive Learning Platform',
    line2: 'Built for learning. Content sourced from AWS documentation and rewritten for interactive instruction.\nAWS, Lambda, and other AWS service names are trademarks of Amazon Web Services, Inc.',
  },
};
