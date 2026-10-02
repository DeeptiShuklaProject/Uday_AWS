/**
 * ============================================================
 * convert-docs.mjs — build the multi-category docs registry
 * ============================================================
 * Scans the source course folders, emits src/data/docsRegistry.json,
 * and mirrors each source folder into public/<category>/ so Vite
 * serves the markdown + media assets.
 *
 * Every discovered course runs through the SAME lesson pipeline at
 * runtime (markdownToModule → LessonViewer/SlideRenderer) — this
 * script only produces the data + asset mirror.
 *
 * All sources live IN THIS REPO — doc_<name>/ dirs at the root:
 *   doc_uday_bedrock_notes/        → bedrock
 *   doc_linux/                     → linux          (Master_Course_v2 phases + Uday course)
 *   doc_docker/                    → docker         (Module_* dirs → chapters)
 *   doc_python_devops/             → python-devops  (flat chNN-*.md)
 *   doc_kubernetes/                → kubernetes     (chapters/Level-*.md)
 *   doc_bedrock_production/        → bedrock-deepti (Bedrock to Production)
 *   doc_strands_agents/ + doc_agentcore_* dirs  → the video-notes courses
 *
 * Run: node scripts/convert-docs.mjs
 * ============================================================
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MEDIA = /\.(png|jpe?g|gif|svg|webp|ico|mp4|webm|pdf)$/i;

const pretty = stem => stem
  .replace(/^(Chapter|Module|Level|ch)[-_]/i, '')
  .replace(/^\d+_?/, '')
  .split(/[_-]+/)
  .filter(Boolean)
  .map(w => w[0].toUpperCase() + w.slice(1))
  .join(' ');

const num = name => (name.match(/(\d+)/) || [])[1] || '';
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function titleFromFile(file) {
  const stem = path.basename(file, path.extname(file)).replace(/^(Level|Chapter|Module|ch)[-_]/i, '');
  const n = num(stem);
  const label = pretty(stem);
  return n ? `${n.padStart(2, '0')} — ${label}` : label;
}

function dirTitle(dirName, { prefix } = {}) {
  const n = num(dirName);
  const label = pretty(dirName.replace(new RegExp(`^${prefix || '[A-Za-z]+'}_?\\d+_?`), ''));
  return n ? `${(prefix || 'Part')} ${n.padStart(2, '0')} — ${label}` : pretty(dirName);
}

// First markdown H1 in a directory's README.md, or a fallback title.
function courseTitle(dir, fallback) {
  const readme = path.join(dir, 'README.md');
  if (existsSync(readme)) {
    const h1 = readFileSync(readme, 'utf8').split('\n').find(l => /^#\s+/.test(l));
    if (h1) return h1.replace(/^#\s+/, '').trim();
  }
  return fallback;
}

// Estimate slide count the same way moduleParser splits: one slide per
// H2, minus a "Learning Objectives" section (it becomes the header card),
// plus 1 when non-empty preamble precedes the first H2.
function countSections(md) {
  const lines = md.split('\n');
  const h1 = lines.findIndex(l => /^#\s+/.test(l.trim()));
  const body = lines.slice(h1 === -1 ? 0 : h1 + 1);
  let h2s = 0, hasObjectives = false, firstH2 = -1;
  body.forEach((l, i) => {
    if (/^##\s+/.test(l.trim())) {
      if (firstH2 === -1) firstH2 = i;
      h2s++;
      if (/learning\s+objectives/i.test(l)) hasObjectives = true;
    }
  });
  const preamble = (firstH2 === -1 ? body : body.slice(0, firstH2)).join('\n').trim();
  return h2s - (hasObjectives ? 1 : 0) + (preamble ? 1 : 0);
}

const chapterEntry = (dir, file, filePath, extra = {}) => ({
  id: path.basename(file, '.md'),
  title: titleFromFile(file),
  file: filePath,
  sectionCount: countSections(readFileSync(path.join(dir, file), 'utf8')),
  ...extra,
});

const mdChapters = (dir, subPath, extraFor) =>
  readdirSync(dir)
    .filter(f => /\.md$/i.test(f) && !/^readme/i.test(f) &&
      (/^Chapter_\d+/i.test(f) || /^\d+[_-]/i.test(f) || /^ch\d+/i.test(f) || /^Level-\d+/i.test(f)))
    .sort()
    .map(f => chapterEntry(dir, f, subPath ? `${subPath}/${f}` : f, extraFor?.(dir, f)));

// Mirror only markdown + media + json + code samples referenced by
// GitHubExplorer "src" overrides (skip __pycache__/backup junk).
const CODE = /\.(py|js|ts|jsx|tsx|sh|ya?ml|toml|sql|java|go|rs|txt|agentcore)$/i;
function mirrorDocs(srcDir, outDir) {
  rmSync(outDir, { recursive: true, force: true });
  const copy = (src, dst) => {
    const st = readdirSync(src, { withFileTypes: true });
    mkdirSync(dst, { recursive: true });
    for (const e of st) {
      if (/^(__pycache__|\.git|node_modules)/.test(e.name)) continue;
      const s = path.join(src, e.name), d = path.join(dst, e.name);
      if (e.isDirectory()) copy(s, d);
      else if (/\.(md|json)$/i.test(e.name) || MEDIA.test(e.name) || CODE.test(e.name)) cpSync(s, d);
    }
  };
  copy(srcDir, outDir);
}

/* ───────────────────────── per-category discovery ───────────────────────── */

// Bedrock — root Chapter_*.md workbook + subdir courses + nested doc dirs.
function discoverBedrock(src, base) {
  const courses = [];
  const rootChapters = mdChapters(src, '');
  if (rootChapters.length) {
    courses.push({
      id: 'workbook',
      title: courseTitle(src, 'Amazon Bedrock AgentCore Practical Workbook'),
      description: 'Step-by-step practical guide to building on Bedrock AgentCore.',
      icon: '🤖', contentBase: base,
      chapters: [...rootChapters,
        ...['appendix.md', 'references.md']
          .filter(f => existsSync(path.join(src, f)))
          .map(f => chapterEntry(src, f, f))],
    });
  }
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(src, entry.name);
    const chapters = mdChapters(dir, entry.name);
    if (chapters.length) {
      let title = courseTitle(dir, pretty(entry.name));
      if (courses.some(c => c.title === title)) title = `${title} (${pretty(entry.name)})`;
      courses.push({
        id: slugify(entry.name), title, description: '', icon: '📚',
        contentBase: base, chapters,
      });
      continue;
    }
    for (const sub of readdirSync(dir, { withFileTypes: true })) {
      if (!sub.isDirectory()) continue;
      const subDir = path.join(dir, sub.name);
      const docs = readdirSync(subDir).filter(f => /\.md$/i.test(f)).sort();
      if (!docs.length) continue;
      courses.push({
        id: slugify(`${entry.name}-${sub.name}`),
        title: `${pretty(entry.name)} — ${pretty(sub.name)}`.replace(/^Aws\b/, 'AWS'),
        description: '', icon: '🎬',
        contentBase: `${base}${entry.name}/${sub.name}/`,
        chapters: docs.map(f => chapterEntry(subDir, f, `${entry.name}/${sub.name}/${f}`)),
      });
    }
  }
  return courses;
}

// Linux — each Master_Course_v2/Phase_* dir is a course; Uday_Linux_Course
// is a separate flat chapter list.
function discoverLinux(src, base) {
  const courses = [];
  const masterDir = path.join(src, 'Master_Course_v2');
  if (existsSync(masterDir)) {
    for (const entry of readdirSync(masterDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^Phase_/i.test(entry.name)) continue;
      const dir = path.join(masterDir, entry.name);
      const chapters = readdirSync(dir)
        .filter(f => /^Chapter_\d+/i.test(f) && /\.md$/i.test(f)).sort()
        .map(f => chapterEntry(dir, f, `Master_Course_v2/${entry.name}/${f}`));
      if (!chapters.length) continue;
      courses.push({
        id: slugify(entry.name),
        title: dirTitle(entry.name, { prefix: 'Phase' }),
        description: '', icon: '🐧', contentBase: base, chapters,
      });
    }
  }
  for (const extra of ['Uday_Linux_Course']) {
    const dir = path.join(src, extra);
    if (!existsSync(dir)) continue;
    const chapters = mdChapters(dir, extra);
    if (chapters.length) courses.push({
      id: slugify(extra), title: pretty(extra).replace('Uday', 'Uday'),
      description: '', icon: '📚', contentBase: base, chapters,
    });
  }
  return courses;
}

// Docker — each Module_* dir holds one markdown file; modules are chapters
// of a single course (chapter title from the module dir name).
function discoverDocker(src, base) {
  const chapters = readdirSync(src, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^Module_/i.test(e.name))
    .map(e => e.name).sort()
    .flatMap(dirName => {
      const dir = path.join(src, dirName);
      return readdirSync(dir).filter(f => /\.md$/i.test(f)).map(f => {
        const n = num(dirName);
        const label = pretty(dirName.replace(/^Module_?\d+_?/i, ''));
        return {
          id: slugify(dirName),
          title: n ? `${n.padStart(2, '0')} — ${label}` : label,
          file: `${dirName}/${f}`,
          sectionCount: countSections(readFileSync(path.join(dir, f), 'utf8')),
        };
      });
    });
  return chapters.length ? [{
    id: 'docker', title: 'Docker — Containers & Compose',
    description: 'Containers, images, networking, volumes, Dockerfile mastery and Compose.',
    icon: '🐳', contentBase: base, chapters,
  }] : [];
}

// Flat directory of chNN-*.md → a single course.
function discoverFlat(src, base, { id, title, icon, description }) {
  const chapters = mdChapters(src, '');
  return chapters.length ? [{ id, title, description, icon, contentBase: base, chapters }] : [];
}

// Bedrock by Deepti — only the root Chapter_*.md files form the course
// ("Core Chapters"). The NN_* unit dirs are intentionally not registered.
function discoverDeepti(src, base) {
  const rootChapters = mdChapters(src, '');
  return rootChapters.length ? [{
    id: 'core-chapters',
    title: 'Core Chapters',
    description: 'Main guided chapters of the Bedrock by Deepti course.',
    icon: '🤖', contentBase: base, chapters: rootChapters,
  }] : [];
}

// Kubernetes — chapters/Level-NN-*.md + the root curriculum doc appended.
function discoverK8s(src, base) {
  const dir = path.join(src, 'chapters');
  const chapters = existsSync(dir)
    ? readdirSync(dir).filter(f => /\.md$/i.test(f)).sort()
        .map(f => chapterEntry(dir, f, `chapters/${f}`))
    : [];
  const extra = 'Kubernetes_AWS_EKS_Master_Curriculum.md';
  if (existsSync(path.join(src, extra))) chapters.push(chapterEntry(src, extra, extra));
  return chapters.length ? [{
    id: 'kubernetes', title: 'Kubernetes — From Containers to Production',
    description: 'Kubernetes architecture, kubectl, objects, networking, storage and EKS.',
    icon: '☸️', contentBase: base, chapters,
  }] : [];
}

/* ─────────────────────────────── run ─────────────────────────────── */

const CATS = [
  { id: 'bedrock',           title: 'Bedrock',           icon: '🤖', src: path.join(ROOT, 'doc_uday_bedrock_notes'),        discover: discoverBedrock,
    subtitle: 'Amazon Bedrock courses and workbooks' },
  { id: 'linux',             title: 'Linux',             icon: '🐧', src: path.join(ROOT, 'doc_linux'),                     discover: discoverLinux,
    subtitle: 'Linux from foundations to production operations' },
  { id: 'docker',            title: 'Docker',            icon: '🐳', src: path.join(ROOT, 'doc_docker'),                    discover: discoverDocker,
    subtitle: 'Docker containers, images, networking and Compose' },
  { id: 'python-devops',     title: 'Python & DevOps',   icon: '🐍', src: path.join(ROOT, 'doc_python_devops'),             discover: (s, b) => discoverFlat(s, b, {
    id: 'python-devops', title: 'Python for DevOps', icon: '🐍',
    description: 'Python fundamentals through automation, APIs and DevOps workflows.' }),
    subtitle: 'Python programming for DevOps and automation' },
  { id: 'kubernetes',        title: 'Kubernetes',        icon: '☸️', src: path.join(ROOT, 'doc_kubernetes'),                discover: discoverK8s,
    subtitle: 'Kubernetes architecture, objects and production labs' },
  { id: 'bedrock-to-production',    title: 'Bedrock to Production', icon: '🚀', dir: 'bedrock-deepti', src: path.join(ROOT, 'doc_bedrock_production'), discover: discoverDeepti,
    subtitle: 'Amazon Bedrock production course — GenAI foundations to AgentCore' },
  // Strands Agents — authored in-repo (video notes course; source of truth is doc_strands_agents/).
  { id: 'strands-agents',           title: 'Strands Agents',        icon: '🧬', dir: 'strands-agents', src: path.join(ROOT, 'doc_strands_agents'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '🧬',
    description: 'Interactive chapter-by-chapter notes for the AWS Show & Tell Strands Agents episode.' }),
    subtitle: 'Build your first agentic AI app — Strands Agents SDK, tools, MCP and multi-agent orchestration' },

  // AgentCore Production Agent — authored in-repo (video notes course; source of truth is doc_agentcore_production_agent/).
  { id: 'agentcore-production-agent', title: 'AgentCore — Production-Ready Agents', icon: '🛡️', dir: 'agentcore-production-agent', src: path.join(ROOT, 'doc_agentcore_production_agent'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '🛡️',
    description: 'Interactive chapter-by-chapter notes for the AWS Show & Tell Bedrock AgentCore episode.' }),
    subtitle: 'Build your first production-ready AI agent — Runtime, Gateway, Memory, Identity and Observability' },

  // AgentCore playlist courses (eps 05–12) — authored in-repo; source of truth is each doc_*/ dir.
  { id: 'agentcore-security',    title: 'AgentCore — Secure Agent Workflows', icon: '🔐', dir: 'agentcore-security', src: path.join(ROOT, 'doc_agentcore_security'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '🔐',
    description: 'Identity model, credential providers, OAuth and Gateway+Identity — from the AWS Show & Tell episode.' }),
    subtitle: 'Secure your agent workflows — inbound/outbound identity, token vault, OAuth, Gateway auth' },
  { id: 'agentcore-tools',       title: 'AgentCore — Built-in Tools', icon: '🧰', dir: 'agentcore-tools', src: path.join(ROOT, 'doc_agentcore_tools'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '🧰',
    description: 'Browser Tool and Code Interpreter — managed first-party tools for agents.' }),
    subtitle: 'Browser Tool + Code Interpreter — managed headless Chromium and sandboxed Python' },
  { id: 'agentcore-memory',      title: 'AgentCore — Memory Deep Dive', icon: '🧠', dir: 'agentcore-memory', src: path.join(ROOT, 'doc_agentcore_memory'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '🧠',
    description: 'Short-term vs long-term memory, strategies, namespaces, hooks and the memory browser.' }),
    subtitle: 'AgentCore Memory — STM vs LTM, extraction strategies, namespaces and hooks' },
  { id: 'agentcore-prod-deploy', title: 'AgentCore — Prototype to Production', icon: '🏭', dir: 'agentcore-prod-deploy', src: path.join(ROOT, 'doc_agentcore_prod_deploy'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '🏭',
    description: 'The full deployment lifecycle — CodeBuild→ECR→Runtime, MCP servers on Runtime, end-to-end.' }),
    subtitle: 'Move agents from prototype to production — CI/CD pipeline, MCP on Runtime, full walkthrough' },
  { id: 'agentcore-observability', title: 'AgentCore — Observability', icon: '📡', dir: 'agentcore-observability', src: path.join(ROOT, 'doc_agentcore_observability'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '📡',
    description: 'OpenTelemetry spans and traces, CloudWatch GenAI dashboards, third-party APM export.' }),
    subtitle: 'Observability — OTel traces, CloudWatch GenAI dashboard, third-party APM' },
  { id: 'agentcore-evaluations', title: 'AgentCore — Evaluations', icon: '✅', dir: 'agentcore-evaluations', src: path.join(ROOT, 'doc_agentcore_evaluations'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '✅',
    description: 'Evaluation dimensions, on-demand vs continuous evals, judges and score dashboards.' }),
    subtitle: 'Agent evaluations — correctness, faithfulness, judges, dashboards' },
  { id: 'agentcore-tool-controls', title: 'AgentCore — Policy & Tool Controls', icon: '🌲', dir: 'agentcore-tool-controls', src: path.join(ROOT, 'doc_agentcore_tool_controls'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '🌲',
    description: 'Cedar policies on Gateway — argument-level authorization for agent tool calls.' }),
    subtitle: 'Control agent↔tool interactions — Cedar policies, argument-level authz, audit' },
  { id: 'agentcore-episodic-memory', title: 'AgentCore — Episodic Memory', icon: '📓', dir: 'agentcore-episodic-memory', src: path.join(ROOT, 'doc_agentcore_episodic_memory'), discover: (s, b) => discoverFlat(s, b, {
    id: 'core-chapters', title: 'Core Chapters', icon: '📓',
    description: 'Episodes, reflections and feedback — agents that learn from experience.' }),
    subtitle: 'Episodic memory — episodes, reflections, feedback loops, namespaces' },
];

const registry = { categories: [] };
for (const cat of CATS) {
  if (!existsSync(cat.src)) {
    console.warn(`⚠️  ${cat.id}: source not found — ${cat.src}`);
    continue;
  }
  const dir = cat.dir || cat.id;   // on-disk/contentBase dir may differ from the route id
  const base = `/${dir}/`;
  const courses = cat.discover(cat.src, base);
  mirrorDocs(cat.src, path.join(ROOT, 'public', dir));
  registry.categories.push({
    id: cat.id, title: cat.title, icon: cat.icon,
    subtitle: cat.subtitle, contentBase: base, courses,
  });
  const n = courses.reduce((a, c) => a + c.chapters.length, 0);
  console.log(`✅ ${cat.id}: ${courses.length} courses, ${n} chapters`);
}

writeFileSync(path.join(ROOT, 'src', 'data', 'docsRegistry.json'), JSON.stringify(registry, null, 2));
console.log('✅ docsRegistry.json written');
