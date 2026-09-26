import courseRegistry from './courseRegistry.json';
import docsRegistry from './docsRegistry.json';

/**
 * categories.js — top-level course collection model.
 *
 * The landing page renders one folder card per category; /courses/:id lists
 * the category's items. `kind` tells the listing page how to map an item to
 * CourseCard props ('module' = interactive lesson, 'course' = doc course).
 * Add a new docs category by appending it to docsRegistry (convert-docs.mjs)
 * — no UI changes needed.
 */

const CAT_COLORS = {
  aws:                { color: '#f59e0b', colorBg: '#fef3c7' },
  bedrock:            { color: '#8b5cf6', colorBg: '#f5f3ff' },
  linux:              { color: '#0ea5e9', colorBg: '#e0f2fe' },
  docker:             { color: '#0284c7', colorBg: '#e0f2fe' },
  'python-devops':    { color: '#16a34a', colorBg: '#dcfce7' },
  kubernetes:         { color: '#6366f1', colorBg: '#eef2ff' },
  'basic-programming': { color: '#d946ef', colorBg: '#fae8ff' },
  'codeadventure':    { color: '#ef4444', colorBg: '#fee2e2' },
};

export const categories = [
  {
    id: 'aws',
    title: 'AWS',
    icon: '☁️',
    ...CAT_COLORS.aws,
    kind: 'module',
    description: 'AWS Production Masterclass — hands-on chapters with labs, quizzes and terminals.',
    items: courseRegistry.modules,
    // each item links to the existing interactive lesson route
    itemTo: mod => `/chapter/${mod.id}`,
  },
  // Markdown-driven doc categories (Bedrock, Linux, Docker, …) — all
  // discovered by convert-docs.mjs and rendered by the shared lesson engine.
  ...docsRegistry.categories.map(cat => ({
    id: cat.id,
    title: cat.title,
    icon: cat.icon,
    ...(CAT_COLORS[cat.id] || { color: '#64748b', colorBg: '#f1f5f9' }),
    kind: 'course',
    description: cat.subtitle,
    items: cat.courses,
    itemTo: course => `/courses/${cat.id}/${course.id}`,
  })),
];
