---
name: software_course_builder_from_youtube
description: Build a complete interactive software course (or new chapter) in this app from a YouTube video / transcript / screenshot set — extraction, timeline mapping, chapter authoring with the existing widget system, registry wiring, browser verification, and a final review-and-enhance pass that upgrades prose into tables, diagrams, cards and interactive widgets wherever it teaches better.
---

# Software Course Builder — From YouTube

Builds full interactive courses in this repo from source video (AWS Show & Tell style talks, tutorials, deep-dives). Proven on `bedrock-to-production` (Ch 04–05) and `strands-agents` (Ch 01–04).

## Staging convention — one folder per video

All downloaded artifacts live under `.course-src/<youtubeId>/` (gitignored):

```
.course-src/<youtubeId>/
├── transcript.txt     # "[MM:SS.ms] text" lines
├── video.mp4          # 720p video-only download (kept for re-extraction)
├── frames/            # NN_tMMmSSs.png — scene-change + gap-filled
├── repo_ref/          # GitHub files fetched to map explorer highlights
└── shots/             # user-supplied ZIP extract, if provided
```

Never scatter artifacts at repo root or into `public/`. Only curated outputs go to `doc_<course>/` → `public/<dir>/`. (Legacy note: earlier work used `strands_agentic_app/` — equivalent purpose; prefer `.course-src/<id>` going forward.)

**Living document** — every build should leave this skill smarter. When you discover a new widget, a parser quirk, a better prompt or a fix that would have saved time, add it here (new pitfalls, new widget entries, better wording).

## Inputs

- **YouTube URL** and/or transcript file and/or screenshot ZIP.
- Course name/id — ask if not given; propose kebab-case id + display title.
- User's emphasis hints during review (they often paste frames with timestamps — treat as the authoritative timeline).

## Pipeline

### 1 — Transcript

```python
from youtube_transcript_api import YouTubeTranscriptApi
t = YouTubeTranscriptApi().fetch(VIDEO_ID)   # → "[MM:SS.ms] text" lines
```

ASR artifacts are normal — search case-insensitively and for split forms ("agent core", "open API", "oath" = OAuth, "strand's" = Strands).

### 2 — Visuals

1. User ZIP → extract, inspect **every** image.
2. No ZIP → `python -m yt_dlp -f 136 -o video.mp4 URL` (720p video-only) → `scripts/extract_frames.py` (scene-change detection at 2s sampling + gap-fill every ~60s). Output: timestamped frames.
3. User-pasted frames during review → map to transcript timestamps.

### 3 — Transcript ↔ frame map

Condense the transcript to ~25–40s blocks; build a `time | content | frame` table. Classify each visual: **slide/diagram · code · console · terminal · inspector-UI · talking-head**. Only non-talking-head frames ship.

### 4 — Author

`doc_<course>/` at repo root = source of truth → mirror to `public/<dir>/`:

```
doc_<course>/Chapter_01_*.md …  screenshots/sNN_*.png  references.json
```

Chapter skeleton: `# Course — Chapter N` + `# 🚀 Title` · `## 🎬 About This Course` or `## Chapter Goal` · `## N.M` sections · `## 🏁 Chapter N Summary` · `### Watch the Original Tutorial` + `<VideoSection>` at the bottom.

**Honesty rules**: note ASR artifacts, demo errors the video hit, "coming soon" features that since shipped, moved repo paths. Never fabricate output or features.

### 5 — Widget menu (pick the best tool for each idea)

| Widget | Trigger in markdown | Use for |
|---|---|---|
| `GitHubExplorer` | `<GitHubExplorer repo="o/r" ref="main" expanded="true" title="…" files={[{path,label,highlights:[[a,b]],note}]} />` | **Any code** — real repo files w/ Monaco + highlights. Prefer real paths; `"src": "/<dir>/code/x.py"` only for files in no repo (add a `note`). |
| `VideoSection` | `<VideoSection youtubeId="…" title="…" />` | Source video (bottom of last chapter / Ch1 opener) |
| `Quiz` | `<Quiz question options={[…]} answerIndex explanation />` | Knowledge checks (3–6 per chapter) |
| `ConceptCard` + family | `<ConceptCard title>body</ConceptCard>` · `InfoCard` `TipCard` `WarningCard` `NoteCard` `KeyTakeaways` | Callouts — "why it matters", honest caveats, trade-offs |
| `mermaid` | ```` ```mermaid flowchart ```` | Every architecture/flow/comparison worth a diagram |
| Terminal | ```` ```bash ```` fence + ```` ```text ```` fence | Commands + real expected output → simulated interactive terminal |
| Code block | ```` ```python ```` | Short inline excerpts (<~15 lines); longer → explorer |
| `AgentFlowStoryteller` | `<AgentFlowStoryteller title="…" />` | Animated agent-loop intro (model+tools=agent) |
| `ImageGallery` | `<ImageGallery images={[{src,title,caption}]} />` | Grouped diagram sets |
| `LanguageComparison` / `MonacoPlayground` | `codeExamples={{py:"…",java:"…"}}` | Multi-language code playgrounds |
| `FlashCard` | `<FlashCard cards={[{q,a}]} />` | Interview-prep Q&A accordion |
| `InteractiveConceptCard` | title/subtitle/difficulty/estimatedTime/tags | Concept overview cards |
| `CodeExecutionPlayer` | `code` + `steps` | Step-by-step code walkthrough |
| Tables | plain markdown `|…|` | Comparisons, spec matrices — cheap and effective |
| `references.json` | file | `{"concepts":{"<chId>#<sec>":{refs:[{kind:repo|file|commit,…}]}}}` → Concept & Code links |

Typed-section triggers (heading keywords create special sections): `quiz|knowledge check` → quiz section; `interview|Q&A` → interview; `command|cli|terminal` → command+terminal; `challenge` → challenge; `lab|hands-on` → lab; `troubleshoot|debug` → troubleshooting.

### 6 — Register

- `src/data/docsRegistry.json` — append category `{id,title,icon,subtitle,contentBase:"/<dir>/",courses:[{id:"core-chapters",…,chapters:[{id,title,file,sectionCount}]}]}`.
- `src/data/categories.js` — `CAT_COLORS` entry.
- `scripts/convert-docs.mjs` — CATS entry `src: path.join(ROOT,'doc_<course>')`, `dir:'<dir>'`, `discoverFlat` — keeps the course on future regens.

### 7 — Verify

- Dev server `localhost:5177`; route `/courses/<catId>/core-chapters/<chapterId>`.
- Puppeteer + system Chrome (path in `scripts/debug/chk-*.mjs`): per chapter — h2s, all screenshot imgs load (**scroll first — lazy load**), explorer `.monaco-editor` present, video iframe, quiz count, zero `pageerror`. Landing page shows the card.
- `npm run build` clean; sibling courses unaffected.

### 8 — REVIEW & ENHANCE (never skip)

After it verifies, do a second pass over every chapter with fresh eyes:

- **Dense paragraph → table** (comparisons, options, personas, "X vs Y") — if prose lists 3+ parallel items, it's a table.
- **Flow described in words → mermaid** (sequences, pipelines, who-calls-what).
- **Missing context** the video assumes — add a `ConceptCard`/`InfoCard` bridging it (e.g. "what is OTel", "what's a user pool") — but keep it accurate; never pad.
- **Screenshot captions** — does each say *what the reader should notice*, not just what it is?
- **Code screenshots still static?** → convert to `GitHubExplorer` (that's the standing rule).
- **Knowledge checks** — do they test decisions, not trivia? At least one per chapter should exercise the *contrast* concepts (managed vs DIY, model-driven vs developer-driven…).
- **Cross-links** — to the other course's chapters when the same concept appears (e.g. Strands gateway ↔ AgentCore Gateway), and `references.json` entries for code-heavy sections.
- Re-verify after edits.

## Pitfalls (hard-won)

- **Heading+code-fence trap**: `##` headings containing `code|examples?|demo|walkthrough|implement|yaml|dockerfile|script|program|snippet` + a code fence → section renders ONLY the fence; prose/images die. Rename the heading ("Coding" ≠ "code").
- `Q&A|interview|quiz|terminal|challenge|lab` headings also become typed sections — keep prose out of them or split the section.
- **convert-docs.mjs wipes `public/<dir>`** and re-mirrors from source. `bedrock-to-production`'s WSCS source is STALE (no Ch05/edits) — never run regen until it's synced; hand-register instead.
- Git Bash heredocs eat `\\` in Windows paths — write .mjs/.py with file tools.
- Explorers: `expanded="true"` opens on scroll; only multi-file explorers claim ←→ keys on mount (fixed in `GitHubPreciseCodeExplorerModal.jsx`).
