import { marked } from 'marked';
import { resolveMediaUrls } from './markdown.js';

/**
 * ============================================================
 * moduleParser.js — markdown → lesson module data
 * ============================================================
 * Converts a markdown document into the same lesson shape that the
 * generated AWS module files carry:
 *
 *   { id, moduleId, title, description, objectives[], sections[] }
 *
 * so markdown-only courses render through the same LessonViewer /
 * SlideRenderer pipeline (no separate doc viewer).
 *
 * Mapping rules:
 *   - first `# H1`          → lesson title
 *   - preamble paragraph    → lesson description
 *   - "## Learning Objectives" list → lesson.objectives (header card)
 *   - every other `## H2`   → one slide section ({type:'text', html})
 * ============================================================
 */

// Heading keyword → slide icon (same iconography as SECTION_ICONS).
const TITLE_ICONS = [
  [/learn(ing)?\s*object|what you.?ll/i, '🎯'],
  [/architect|diagram|flow/i, '📐'],
  [/lab|practical|hands.?on|exercise/i, '🔬'],
  [/code|implement|build|develop/i, '👨‍💻'],
  [/quiz|knowledge check|test your/i, '🧠'],
  [/challenge/i, '🏆'],
  [/interview/i, '🎙️'],
  [/troubleshoot|issue|error|debug|common mistake/i, '🔧'],
  [/deploy|run(ning)?|setup|install|config|prereq/i, '⚙️'],
  [/command|cli|terminal/i, '⌨️'],
  [/summar|next|conclusion|wrap/i, '➡️'],
  [/concept|overview|intro|understand|what is/i, '📖'],
  [/secur|identity|auth/i, '🔐'],
  [/monitor|observ|metric|log/i, '📊'],
  [/cost|billing/i, '💰'],
];

const iconFor = title => (TITLE_ICONS.find(([re]) => re.test(title)) || [])[1] || '📝';

const slug = s => s.toLowerCase().replace(/<[^>]+>/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';

const stripMd = s => s.replace(/\*\*|__|`|`|\[([^\]]*)\]\([^)]*\)/g, '$1').trim();

/* ─────────────────────────────────────────────────────────────
 * Custom <Component> tags → markdown/widget sections
 *
 * Some source docs (Basic Programming, CodeAdventure) embed JSX-ish
 * tags from an external doc engine (<InfoCard>, <Quiz>, <ImageGallery>,
 * <CodeExecutionPlayer>, <VideoSection>, <CodeAdventureGame>, ...).
 * The engine isn't part of this app, so we transform them:
 *   paired card tags   → blockquote callouts (marked parses body md)
 *   <Quiz …/>          → real 'quiz' sections (QuizSection widget)
 *   <ImageGallery>     → markdown image list with captions
 *   <CodeExecutionPlayer> → fenced code + step explanations
 *   <VideoSection youtubeId> → responsive YouTube embed
 *   other self-closing → callout built from scalar attrs (+ steps text)
 * ───────────────────────────────────────────────────────────── */

// Find the '>' that ends a tag's attribute list, skipping '>' inside
// quoted attr values (source docs use things like clickInstructions="'<' & '>'").
function tagEnd(str, from) {
  let quote = null;
  for (let i = from; i < str.length; i++) {
    const c = str[i];
    if (quote) { if (c === quote && str[i - 1] !== '\\') quote = null; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '>') return i;
  }
  return -1;
}

// Parse JSX-ish attrs: key="v" | key='v' | key={…} | key=[…] | key={…}
function parseAttrs(str = '') {
  const attrs = {};
  const re = /(\w+)\s*=\s*("(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'|\{(?:[^{}]|\{[^{}]*\})*\}|\[(?:[^\[\]]|\[[^\]]*\])*\])/g;
  let m;
  while ((m = re.exec(str))) {
    let raw = m[2];
    if (raw[0] === '"' || raw[0] === "'") raw = raw.slice(1, -1);
    else if (raw[0] === '{') raw = raw.slice(1, -1); // {expr} → keep inner
    attrs[m[1]] = raw;
  }
  return attrs;
}

// Evaluate a JS-ish literal (single-quoted strings, unquoted keys) safely
// enough for static local doc content.
function evalLiteral(s) {
  try { return new Function(`return (${s});`)(); } catch { return undefined; }
}

const unescapeCode = s => (s || '').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
  .replace(/\\"/g, '"').replace(/\\'/g, "'");

const CARD_TAGS = 'InfoCard|TipCard|KeyTakeaways|WarningCard|SuccessCard|NoteCard|ConceptCard|SectionCard';

const quoteBlock = (title, body) => {
  const lines = [];
  if (title) lines.push(`> **${title}**`, '>');
  (body || '').trim().split('\n').forEach(l => lines.push(`> ${l}`));
  return lines.join('\n');
};

// Scalar attrs worth showing from unknown widget tags.
const TEXT_ATTRS = ['title', 'subtitle', 'motto', 'description', 'whatItDoes', 'clickInstructions', 'badge'];

function attrsToCallout(tag, attrs, icon = 'ℹ️') {
  const title = unescapeCode(attrs.title || attrs.sectionTitle || '');
  const bits = ['subtitle', 'motto', 'description', 'whatItDoes', 'clickInstructions']
    .map(k => unescapeCode(attrs[k])).filter(Boolean);
  // Steps arrays carry real teaching text — keep the explanations.
  const steps = evalLiteral(attrs.steps);
  if (Array.isArray(steps) && steps.length) {
    const list = steps.map((s, i) =>
      `${i + 1}. ${unescapeCode(s.description || s.explanation || s.output || '')}`.trim())
      .filter(l => l.length > 3).join('\n');
    if (list) bits.push(list);
  }
  return quoteBlock(`${icon} ${title || tag}`, bits.join('\n\n'));
}

/**
 * Replace custom tags in a chunk body. Returns { md, quizzes } where
 * quizzes is an array of quiz-section content objects.
 */
/**
 * Replace custom tags in a chunk body. Returns { md, quizzes } where
 * quizzes is an array of quiz-section content objects.
 *
 * Tags are matched with a quote-aware scanner (attr values legitimately
 * contain '>' characters, so `[^>]*` regexes would truncate them).
 */
function transformCustomTags(body) {
  const quizzes = [];
  let out = '';
  let i = 0;

  const selfClose = (attrStr) => ({
    Quiz: () => {
      const a = parseAttrs(attrStr);
      const options = evalLiteral(a.options) || [];
      const correct = Number(evalLiteral(a.answerIndex ?? a.correctIndex ?? '0'));
      quizzes.push({
        title: 'Knowledge Check',
        questions: [{
          id: `q${quizzes.length}`,
          question: unescapeCode(a.question || ''),
          options: options.map((t, oi) => ({ id: `o${oi}`, text: String(t) })),
          correctId: `o${correct}`,
          explanation: unescapeCode(a.explanation || ''),
        }],
      });
      return '\n\n';
    },
    ImageGallery: () => {
      const a = parseAttrs(attrStr);
      const images = evalLiteral(a.images) || [];
      const lines = [`### 🖼️ ${unescapeCode(a.title || 'Diagrams')}`];
      images.forEach(img => {
        lines.push(`![${img.title || 'diagram'}](${img.src})`);
        if (img.caption) lines.push(`*${img.caption}*`);
      });
      return `\n\n${lines.join('\n')}\n\n`;
    },
    CodeExecutionPlayer: () => {
      const a = parseAttrs(attrStr);
      const code = unescapeCode(a.code || '');
      const steps = evalLiteral(a.steps) || [];
      const outl = [`### 🎮 ${unescapeCode(a.title || 'Code Walkthrough')}`, ''];
      if (code) outl.push('```python', code, '```', '');
      steps.forEach((s, si) => {
        const t = unescapeCode(s.explanation || s.description || '');
        if (t) outl.push(`${si + 1}. ${t}`);
      });
      return `\n\n${outl.join('\n')}\n\n`;
    },
    VideoSection: () => {
      const a = parseAttrs(attrStr);
      if (!a.youtubeId) return '\n\n';
      return `\n\n### 🎬 ${unescapeCode(a.title || 'Video Tutorial')}\n\n` +
        `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${a.youtubeId}" ` +
        `title="Video" frameborder="0" allowfullscreen></iframe></div>\n\n`;
    },
    // Game engine lives outside this app — surface a level card instead
    // of silently dropping it.
    CodeAdventureGame: () => {
      const a = parseAttrs(attrStr);
      return `\n\n${quoteBlock(`🎮 Playable Game — Level: ${unescapeCode(a.levelId || '')}`,
        'This level ships as an interactive coding game in the CodeAdventure engine. ' +
        'Use the mission description above to write your solution, then check the quiz below.')}\n\n`;
    },
  });

  const cardRe = new RegExp(`^(${CARD_TAGS})$`);

  while (i < body.length) {
    if (body[i] !== '<') { out += body[i++]; continue; }
    const open = body.slice(i).match(/^<([A-Za-z]\w*)\s*/);
    if (!open) { out += body[i++]; continue; }
    const tag = open[1];
    const attrStart = i + open[0].length;
    const end = tagEnd(body, attrStart);
    if (end === -1) { out += body[i++]; continue; }
    const attrStr = body.slice(attrStart, end);
    const isSelfClosing = body[end - 1] === '/';

    // Paired container card: <InfoCard ...>md body</InfoCard>
    if (cardRe.test(tag) && !isSelfClosing) {
      const close = body.indexOf(`</${tag}>`, end);
      if (close !== -1) {
        const inner = body.slice(end + 1, close);
        const title = unescapeCode(parseAttrs(attrStr).title || '');
        out += `\n\n${quoteBlock(title, inner)}\n\n`;
        i = close + tag.length + 3;
        continue;
      }
    }

    if (isSelfClosing || tag === 'Quiz') {
      const handler = selfClose(attrStr)[tag];
      if (handler) { out += handler(); i = end + 1; continue; }
      // Remaining self-closing widget tags → attr-driven callout.
      if (isSelfClosing && /^[A-Z]/.test(tag) && !/^(br|hr|img|input|source|meta|link)$/i.test(tag)) {
        const a = parseAttrs(attrStr);
        out += Object.keys(a).length ? `\n\n${attrsToCallout(tag, a)}\n\n` : '\n\n';
        i = end + 1;
        continue;
      }
    }

    // Unknown paired tag or plain HTML — copy through untouched.
    out += body.slice(i, end + 1);
    i = end + 1;
  }

  // Orphaned closing component tags → drop.
  out = out.replace(/<\/[A-Z]\w*\s*>/g, '');
  return { md: out, quizzes };
}

/* ─────────────────────────────────────────────────────────────
 * Content → widget classification
 *
 * AWS modules carry typed sections (lab / quiz / command /
 * troubleshooting / interview / challenge / code) that render as
 * interactive widgets. Doc-course markdown is classified the same
 * way: heading + body patterns are mapped onto those widget types
 * so every category gets the AWS learning experience instead of a
 * flat prose page. Anything that doesn't parse cleanly falls back
 * to a styled HTML ('text'/'concept'/'why'/…) section.
 * ───────────────────────────────────────────────────────────── */

const FENCE_RE = /```([A-Za-z0-9_-]*)\s*\n([\s\S]*?)```/g;
const SHELL_LANGS = new Set(['bash', 'sh', 'shell', 'zsh', 'console', 'terminal', 'powershell', 'ps', 'cmd', 'aws']);
const OUTPUT_LANGS = new Set(['', 'output', 'text', 'txt', 'stdout', 'console']);

const fences = (body) => [...body.matchAll(FENCE_RE)]
  .map(m => ({ lang: (m[1] || '').toLowerCase(), code: (m[2] || '').replace(/\n$/, ''),
    index: m.index, end: m.index + m[0].length }));

// Split a chunk body on ###/#### boundaries (labs, incidents, Q&A items).
function subHeads(body) {
  const subs = [];
  let cur = { title: null, lines: [] };
  for (const l of body.split('\n')) {
    if (/^#{3,4}\s+/.test(l.trim())) {
      if (cur.title !== null || cur.lines.join('').trim()) subs.push(cur);
      cur = { title: l.trim().replace(/^#{3,4}\s+/, ''), lines: [] };
    } else cur.lines.push(l);
  }
  if (cur.title !== null || cur.lines.join('').trim()) subs.push(cur);
  return subs;
}

const firstParas = (s, max = 400) => {
  const paras = String(s || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  return stripMd(paras[0] || '').slice(0, max);
};

// Pull <details><summary>…</summary>…</details> blocks out of raw md —
// they carry hints/answers; returns the cleaned md + collected hint text.
function extractDetails(body) {
  const hints = [];
  const md = body.replace(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi,
    (_, summary, inner) => {
      const h = `${stripMd(summary)}: ${stripMd(inner).slice(0, 300)}`.trim();
      if (h.length > 2) hints.push(h);
      return '\n';
    });
  return { md, hints };
}

/** `### Lab N:`/`### Step`/`### Task` subsections → lab steps[] */
function tryLab(body, render, hTitle) {
  const subs = subHeads(body);
  const steps = [];
  let preamble = '';
  subs.forEach(s => {
    const md = s.lines.join('\n');
    if (!s.title) { preamble = md; return; }
    // Hint/solution subsections belong to the previous step, not new ones.
    if (steps.length && /^(progressive\s+)?hints?\b|solution|answer/i.test(stripMd(s.title))) {
      const levels = md.split('\n')
        .map(l => l.match(/^\s*[-*]\s+\*\*(.+?)\*\*\s*:?\s*(.*)/))
        .filter(Boolean).map(m => `${m[1]}: ${m[2]}`.trim()).filter(t => t.length > 3);
      const prev = steps[steps.length - 1];
      const h = levels.join(' · ') || stripMd(md).slice(0, 300);
      if (h) prev.hint = prev.hint ? `${prev.hint}\n${h}` : h;
      return;
    }
    const { md: clean, hints } = extractDetails(md);
    steps.push({
      id: `step-${steps.length + 1}`,
      title: stripMd(s.title),
      html: render(clean),
      hint: hints.join('\n') || undefined,
    });
  });
  if (!steps.length) {
    if (!body.trim()) return null;
    const { md: clean, hints } = extractDetails(body);
    return {
      title: hTitle, difficulty: 'intermediate',
      steps: [{ id: 'step-1', title: 'Complete the exercise', html: render(clean), hint: hints.join('\n') || undefined }],
    };
  }
  return {
    title: hTitle,
    description: firstParas(preamble, 240) || undefined,
    difficulty: 'intermediate',
    steps,
  };
}

/** `### N. Error:`/`### Incident`/`### Issue` subsections (or <details> list) → items[] */
function tryTroubleshoot(body, render) {
  const subs = subHeads(body);
  const titled = subs.filter(s => s.title);
  if (titled.length) {
    const pre = subs.find(s => !s.title);
    return {
      intro: pre ? render(pre.lines.join('\n')) : undefined,
      items: titled.map(s => ({
        error: stripMd(s.title).replace(/^\d+[.)]\s*/, ''),
        html: render(s.lines.join('\n')),
      })),
    };
  }
  const { md: rest, hints } = extractDetails(body);
  if (hints.length >= 2) {
    return {
      intro: render(rest),
      items: hints.map(h => {
        const idx = h.indexOf(':');
        return { error: idx > 0 ? h.slice(0, idx).trim() : 'Issue', html: `<p>${idx > 0 ? h.slice(idx + 1).trim() : h}</p>` };
      }),
    };
  }
  return null;
}

/** Shell fences → command blocks {command, category, explanation, expectedOutput?} */
function tryCommands(body, hTitle) {
  const fs = fences(body);
  const catFor = idx => {
    const re = /^#{3,4}\s+(.+)$/gm;
    let m, t = null;
    while ((m = re.exec(body))) { if (m.index < idx) t = stripMd(m[1]); else break; }
    return t || hTitle;
  };
  const explFor = (idx, prevEnd) => {
    const seg = body.slice(prevEnd, idx);
    const paras = seg.split(/\n\s*\n/).map(p => p.trim())
      .filter(p => p && !/^#{2,}/.test(p) && !/^[-*]\s+\*\*(?:output)\b/i.test(p));
    return stripMd((paras[paras.length - 1] || '')
      .replace(/\*\*(purpose|syntax|example|production usage|usage)\*\*\s*:?/gi, '$1: ')).slice(0, 400);
  };
  const cmds = [];
  let prevEnd = 0;
  fs.forEach((f, i) => {
    if (!SHELL_LANGS.has(f.lang)) { prevEnd = f.end; return; }
    const next = fs[i + 1];
    let expected;
    if (next && OUTPUT_LANGS.has(next.lang) && next.index - f.end < 600 && f.lang !== next.lang) {
      expected = next.code.trim() || undefined;
    }
    cmds.push({
      command: f.code.trim(),
      category: catFor(f.index),
      explanation: explFor(f.index, prevEnd) || undefined,
      expectedOutput: expected,
    });
    prevEnd = f.end;
  });
  return cmds.length ? cmds : null;
}

/** Companion simulated terminal for command sections (commands map → canned outputs). */
function terminalFor(cmds, hTitle, idBase) {
  const commands = {};
  cmds.forEach(c => {
    const key = (c.command.split('\n').find(l => l.trim() && !/^\s*#/.test(l)) || '')
      .replace(/^\s*[$>]\s*/, '').trim();
    if (key && !commands[key]) {
      commands[key] = { text: c.expectedOutput || c.explanation || 'Simulated output — run on your own system for real results.' };
    }
  });
  const keys = Object.keys(commands);
  if (keys.length < 2) return null;
  return {
    id: `${idBase}-terminal`, type: 'terminal', icon: '💻', title: 'Interactive Terminal',
    content: {
      title: hTitle, mode: 'simulated',
      initialText: `${hTitle} — try:\n  ${keys.join('\n  ')}\n(type "help" to list commands)`,
      commands,
    },
  };
}

/** `**Question**: …` + `- A) … **(Correct)**` groups → quiz questions[] */
function tryQuiz(body) {
  const questions = [];
  let cur = null;
  const flush = () => { if (cur && cur.options.length >= 2) questions.push(cur); cur = null; };
  body.split('\n').forEach(l => {
    const qm = l.match(/^\s*(?:\d+[.)]\s*)?\*{0,2}\s*(?:Question|Q\s*\d+)[*:.)]*\s*(.+?)\s*\*{0,2}\s*$/i);
    if (qm && !/answer|explanation|options?/i.test(qm[0].slice(0, 30))) { flush(); cur = { question: stripMd(qm[1]), options: [], correctIdx: -1, explanation: '' }; return; }
    if (!cur) return;
    const om = l.match(/^\s*[-*]?\s*\(?([A-E])[).]\s+(.+)/i);
    if (om) {
      const correct = /\(correct\)|✅|✔/i.test(om[2]);
      cur.options.push(stripMd(om[2].replace(/\s*\((?:correct|answer)\)\s*/i, '').trim()));
      if (correct) cur.correctIdx = cur.options.length - 1;
      return;
    }
    const am = l.match(/(?:correct\s+)?answer\s*[.:]?\s*\*?\*?\s*\(?([A-E])\)?/i);
    if (am) { const idx = 'ABCDE'.indexOf(am[1].toUpperCase()); if (idx > -1) cur.correctIdx = idx; return; }
    const em = l.match(/\*\*(?:explanation|why)\*\*\s*:?\s*(.+)/i);
    if (em) cur.explanation = stripMd(em[1]);
  });
  flush();
  if (!questions.length) return null;
  return {
    questions: questions.map((q, i) => ({
      id: `q${i}`, question: q.question,
      options: q.options.map((t, oi) => ({ id: `o${oi}`, text: t })),
      correctId: `o${q.correctIdx > -1 ? q.correctIdx : 0}`,
      explanation: q.explanation || undefined,
    })),
  };
}

/** `###/#### Q…: …?` + `**Answer**:` items (or inline `Q? (answer)` lists) → interview questions[] */
function tryInterview(body) {
  const qs = [];
  let diff;
  subHeads(body).forEach(s => {
    if (!s.title) return;
    const dm = s.title.match(/beginner|intermediate|advanced|scenario|troubleshoot/i);
    if (dm && !s.title.includes('?')) { diff = dm[0].toLowerCase(); return; }
    const q = stripMd(s.title)
      .replace(/^q\s*\d+\s*[:.)–—-]?\s*/i, '')
      .replace(/^q\s*[:.)]\s*/i, '');
    if (!q.includes('?')) return;
    const ansMd = s.lines.join('\n')
      .replace(/\*\*(?:model\s+)?answer\*\*\s*:?\s*/i, '').trim();
    const paras = ansMd.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    qs.push({
      question: q,
      shortAnswer: stripMd(paras[0] || '').slice(0, 600) || undefined,
      deepExplanation: stripMd(paras.slice(1).join(' ')).slice(0, 1200) || undefined,
      difficulty: diff,
    });
  });
  if (qs.length) return { questions: qs };
  // Inline Q&A lists: `- Question text? (the answer)`
  const inline = [];
  body.split('\n').forEach(l => {
    const m = l.match(/^\s*(?:[-*+]|\d+[.)])\s*(?:\*\*[^*]{1,60}\*\*\s*[.:]\s*)?(.{10,}?\?)\s*\((.{2,200}?)\)\s*\.?\s*$/);
    if (m) inline.push({ question: stripMd(m[1]), shortAnswer: stripMd(m[2]) });
  });
  return inline.length ? { questions: inline } : null;
}

/** Challenge/assignment sections → {description, requirements, starterCode, hints} */
function tryChallenge(body, hTitle) {
  const fs = fences(body);
  const reqs = [];
  let inList = false;
  body.split('\n').forEach(l => {
    if (/requirements?|tasks?|objectives?|rules/i.test(l) && /^#{0,5}\s*\**/.test(l.trim())) inList = true;
    const m = inList && l.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+)/);
    if (m) reqs.push(stripMd(m[1]));
    else if (inList && !l.trim()) inList = false;
  });
  const { hints } = extractDetails(body);
  const hr = subHeads(body).find(s => s.title && /hints?/i.test(s.title));
  if (hr) hr.lines.forEach(l => {
    const m = l.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+)/);
    if (m) hints.push(stripMd(m[1]));
  });
  if (!reqs.length && !fs.length) return null;
  return {
    description: firstParas(body, 400) || hTitle,
    requirements: reqs.slice(0, 10),
    starterCode: fs[0]?.code || undefined,
    language: fs[0]?.lang || undefined,
    hints: hints.length ? hints : undefined,
  };
}

/**
 * Decide whether a chunk becomes a widget section.
 * Returns an array of section objects, or null → styled-HTML fallback.
 */
function classifyChunk(hTitle, body, render, idBase) {
  const t = hTitle.toLowerCase();
  const one = (type, title, content) => [{ type, title, content, id: `${idBase}-${type}` }];

  if (/quiz|knowledge check|certification|assessment|exam/i.test(t)) {
    const w = tryQuiz(body);
    if (w) return one('quiz', hTitle, w);
    const qa = tryInterview(body);
    if (qa) return one('interview', hTitle, qa);
    return null;
  }
  if (/interview|q\s*&\s*a|questions?\s*&\s*answers?/i.test(t)) {
    const w = tryInterview(body);
    return w ? one('interview', hTitle, w) : null;
  }
  if (/troubleshoot|incident|war room|diagnos|common\s+(issues|errors|mistakes|pitfalls)|known issues|debug/i.test(t)) {
    const w = tryTroubleshoot(body, render);
    return w ? one('troubleshooting', hTitle, w) : null;
  }
  const fs = fences(body);
  const codeFences = fs.filter(f => !SHELL_LANGS.has(f.lang));
  // Code/example sections first — "Hands-on Examples" is a code walkthrough,
  // not a lab checklist.
  if (/code|examples?|demo|walkthrough|implement|yaml|dockerfile|script|program|snippet/i.test(t)
      && codeFences.length) {
    const langs = codeFences.map((f, i) => ({
      id: `l${i}`,
      label: codeFences.length > 1 ? `${f.lang || 'code'} ${i + 1}` : (f.lang || 'code'),
      code: f.code,
    }));
    return one('code', hTitle, { title: hTitle, languages: langs });
  }
  if (/challenge|mini.?project|assignment|capstone|build it/i.test(t)) {
    const w = tryChallenge(body, hTitle);
    return w ? one('challenge', hTitle, w) : null;
  }
  if (/hands?-?on|labs?|exercises?|practice|try this|projects?|sandbox|playground/i.test(t)) {
    const w = tryLab(body, render, hTitle);
    return w ? one('lab', hTitle, w) : null;
  }
  if (/commands?|cli|terminal|kubectl|shell/i.test(t)) {
    const w = tryCommands(body, hTitle);
    if (w) {
      const secs = one('command', hTitle, w);
      const term = terminalFor(w, hTitle, idBase);
      if (term) secs.push(term);
      return secs;
    }
    return null;
  }
  return null;
}

// Heading → HTML section type (iconography + semantic styling only —
// all render through HtmlSection).
const TYPE_RULES = [
  [/why\b|analogy|motivation|the problem|core problem/i, 'why'],
  [/expected output|sample output|output format/i, 'expected-output'],
  [/what happened|behind the scenes|how it works|internal|under the hood|mechanics|lifecycle/i, 'what-happened'],
  [/cleanup|clean up|tear ?down|decommission/i, 'cleanup'],
  [/concept|overview|intro|theory|fundamental|foundation|component|architect|structure|diagram|topology|deep dive|primer|what is|use case|core|background|prereq|setup|install|config/i, 'concept'],
];
const typeFor = hTitle => (TYPE_RULES.find(([re]) => re.test(hTitle)) || [])[1] || 'text';

/**
 * Blockquotes → AWS-style alert callouts. Doc sources use
 * `> **Warning**: …` / `> **Tip**: …` / `> **Note**: …` — these become
 * the same .alert-* widgets the AWS modules use.
 */
function alerts(html) {
  return html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (_, inner) => {
    let t = inner.trim();
    let title = '';
    const strong = t.match(/^<p>\s*<strong>([^<]{1,80}?)<\/strong>\s*:?\.?\s*([\s\S]*)$/s);
    if (strong) { title = strong[1].replace(/[:.]\s*$/, ''); t = `<p>${strong[2]}`; }
    const probe = `${title} ${t}`.toLowerCase();
    let kind = 'info', icon = 'ℹ️';
    if (/warn|important|caution|danger|never\b|avoid|mistake|security|error|watch out|critical|do not/i.test(probe)) {
      kind = 'warning'; icon = '⚠️';
    } else if (/tip|hint|pro tip|best practice|recommended|note that/i.test(probe)) {
      kind = 'tip'; icon = '💡';
    } else if (/success|correct|well done|remember/i.test(probe)) {
      kind = 'success'; icon = '✅';
    }
    return `<div class="alert alert-${kind}"><span class="alert-icon">${icon}</span>` +
      `<div class="alert-content">${title ? `<div class="alert-title">${title}</div>` : ''}` +
      `<div class="alert-text">${t}</div></div>`;
  });
}

/**
 * @param {string} md - raw markdown
 * @param {object} opts
 * @param {string} opts.id            - module/progress id
 * @param {string} opts.imageBaseUrl  - base for relative media srcs
 * @param {string} [opts.title]       - override title (default: first H1)
 */
export function markdownToModule(md, { id, imageBaseUrl = '', title: titleOverride,
  codeExamples, quiz, interview } = {}) {
  if (!md) return null;
  const lines = md.split('\n');
  const render = chunk => alerts(resolveMediaUrls(marked.parse(chunk.trim()), imageBaseUrl));

  // ── Title: first H1 ──
  let title = titleOverride || 'Chapter';
  let bodyStart = 0;
  const h1Idx = lines.findIndex(l => /^#\s+/.test(l.trim()));
  if (h1Idx !== -1) {
    if (!titleOverride) title = stripMd(lines[h1Idx].replace(/^#\s+/, ''));
    bodyStart = h1Idx + 1;
  }

  // ── Split on H2 boundaries ──
  const chunks = [];
  let cur = { heading: null, lines: [] };
  for (let i = bodyStart; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i].trim())) {
      if (cur.heading !== null || cur.lines.join('').trim()) chunks.push(cur);
      cur = { heading: lines[i].trim().replace(/^##\s+/, ''), lines: [] };
    } else {
      cur.lines.push(lines[i]);
    }
  }
  if (cur.heading !== null || cur.lines.join('').trim()) chunks.push(cur);

  // ── Preamble → description (+ intro slide if it has substance) ──
  let description = '';
  const objectives = [];
  const sections = [];
  chunks.forEach((chunk, i) => {
    const body = chunk.lines.join('\n').trim();
    if (chunk.heading === null) {
      // first non-empty paragraph becomes the header description
      const para = body.split(/\n\s*\n/).map(p => p.trim()).filter(p => p && !/^---+$/.test(p));
      description = stripMd(para[0] || '');
      const { md: tmd, quizzes } = transformCustomTags(body);
      const html = render(tmd);
      if (html.trim()) {
        sections.push({
          id: `sec-${i}-overview`, type: 'text', icon: '📖', title: 'Overview',
          content: html,
        });
      }
      quizzes.forEach((q, qi) => {
        sections.push({
          id: `sec-${i}-overview-quiz-${qi}`,
          type: 'quiz', icon: '🧠', title: 'Knowledge Check', content: q,
        });
      });
      return;
    }

    const hTitle = stripMd(chunk.heading);
    // Learning Objectives → lesson header card (not a slide).
    if (/learning\s+objectives/i.test(hTitle)) {
      const items = body.split('\n')
        .map(l => l.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)/)?.[1])
        .filter(Boolean)
        .map(l => stripMd(l).replace(/^[-–—*+\s]+/, '').trim())
        .filter(l => l && !/:\s*$/.test(l)); // drop lead-ins like "you will learn:"
      if (items.length) objectives.push(...items);
      return;
    }

    // Transform engine-specific <Component> tags; <Quiz> tags become real
    // quiz slides placed right after the section they appeared in.
    const { md: tmd, quizzes } = transformCustomTags(body);
    const idBase = `sec-${i}-${slug(hTitle)}`;
    // Content → widget classification (lab/quiz/interview/troubleshooting/
    // command+terminal/challenge/code). Falls back to a styled HTML section.
    const widgetSections = classifyChunk(hTitle, tmd, render, idBase);
    if (widgetSections) {
      widgetSections.forEach(s => sections.push({ icon: iconFor(hTitle), ...s }));
    } else {
      const html = render(tmd);
      if (html.trim()) {
        sections.push({
          id: idBase,
          type: typeFor(hTitle),
          icon: iconFor(hTitle),
          title: hTitle,
          content: html,
        });
      }
    }
    quizzes.forEach((q, qi) => {
      sections.push({
        id: `sec-${i}-quiz-${qi}`,
        type: 'quiz',
        icon: '🧠',
        title: 'Knowledge Check',
        content: q,
      });
    });
  });

  // Structured extras supplied by the registry (e.g. data.json chapters):
  // multi-language code examples → CodeSection tabs; quiz → QuizSection.
  if (codeExamples && Object.keys(codeExamples).length) {
    sections.push({
      id: 'sec-code-examples', type: 'code', icon: '👨‍💻', title: 'Code Examples',
      content: {
        title: 'Try it in your language',
        defaultLang: 'python',
        languages: Object.entries(codeExamples).map(([langId, code]) => ({
          id: langId, label: langId[0].toUpperCase() + langId.slice(1), code,
        })),
      },
    });
  }
  if (Array.isArray(quiz) && quiz.length) {
    sections.push({
      id: 'sec-knowledge-check', type: 'quiz', icon: '🧠', title: 'Knowledge Check',
      content: {
        title: 'Knowledge Check',
        questions: quiz.map((q, i) => ({
          id: `q${i}`,
          question: q.question,
          options: (q.options || []).map((t, oi) => ({ id: `o${oi}`, text: String(t) })),
          correctId: `o${q.correctIndex ?? 0}`,
          explanation: q.explanation || '',
        })),
      },
    });
  }
  if (Array.isArray(interview) && interview.length) {
    sections.push({
      id: 'sec-interview-prep', type: 'interview', icon: '🎙️', title: 'Interview Preparation',
      content: {
        questions: interview.map((q, i) => ({
          id: `iq${i}`,
          question: stripMd(q.q || q.question || ''),
          shortAnswer: stripMd(q.a || q.answer || q.shortAnswer || ''),
          deepExplanation: stripMd(q.explanation || q.deepExplanation || '') || undefined,
          difficulty: q.difficulty,
        })).filter(q => q.question),
      },
    });
  }

  return {
    id, moduleId: id, title, description, objectives,
    // string content is rendered HTML; object content drives a widget
    sections: sections.filter(s =>
      typeof s.content === 'string' ? s.content.trim() : s.content != null),
  };
}
