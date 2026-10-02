# Tech Course Builder — From YouTube (Gemini-ready)

You are building an **interactive video-notes course** in this repo. The app renders markdown chapters through `src/utils/moduleParser.js` → `SlideRenderer.jsx` — you author content, never touch the engine. Existing courses prove the pattern: `doc_strands_agents/` → `public/strands-agents/` and `doc_agentcore_production_agent/` → `public/agentcore-production-agent/`.

> Companion context: read `.agents/AGENTS.md` for the course registry table, convert-docs hazard, and parser pitfalls. Reference chapters to imitate: `doc_strands_agents/Chapter_01_Why_Strands_Agents.md`, `doc_agentcore_production_agent/Chapter_02_Runtime_Local_to_Cloud.md`.

## Inputs

- YouTube URL (extract `<videoId>`) + optional screenshot ZIP + course name/id (propose kebab-case if not given).

## Pipeline

### 1 — Stage everything under `.course-src/<videoId>/`

```
.course-src/<videoId>/
├── transcript.txt   video.mp4   frames/   repo_ref/   shots/
```

Gitignored. Never scatter artifacts at repo root or into `public/`.

### 2 — Transcript

```python
from youtube_transcript_api import YouTubeTranscriptApi
t = YouTubeTranscriptApi().fetch(VIDEO_ID)   # → "[MM:SS.ms] text" lines
```

This repo may already have it — check `doc_uday_bedrock_notes/aws_employee_video_playlist/transcripts/`.

### 3 — Visuals

No ZIP → `python -m yt_dlp -f 136 -o .course-src/<id>/video.mp4 <url>` → run `scripts/extract_frames.py` (parameterize VID/OUT). Yields timestamped `NN_tMMmSSs.png`.

### 4 — Transcript ↔ frame map

Condense transcript to ~30–60s blocks; map frames to blocks; classify: **slide · code · terminal · console/inspector-UI · talking-head**. Only non-talking-head frames ship. User-pasted frames during review are authoritative timestamps.

### 5 — Author `doc_<course>/`

`doc_<course>/` at repo root is source of truth → mirror to `public/<dir>/`.

```
Chapter_01_*.md …   screenshots/sNN_*.png   references.json
```

Chapter skeleton:
- `# Course — Chapter N` + `# 🚀 Title`
- `## 🎬 About This Course` (Ch1: `<VideoSection youtubeId title />` opener) or `## Chapter Goal`
- `## N.M` numbered sections (numbered sections get "— Diagram" splits automatically)
- `## 🧠 Knowledge Check` with `<Quiz …>`
- `## 🏁 Chapter N Summary`; last chapter ends with `### Watch the Original Tutorial` + `<VideoSection>`

**Honesty rules**: name ASR artifacts, note "coming soon" features that since shipped, moved/renamed repos, demo errors the video hit. Never fabricate output.

### 6 — Widget menu (data-driven tags inside markdown)

| Widget | Trigger | Use for |
|---|---|---|
| `GitHubExplorer` | `<GitHubExplorer repo="o/r" ref="main" expanded="true" title="…" files={[{path,label,highlights:[[a,b]],note}]} />` | **Any code** — real repo files w/ Monaco + highlights. `"src": "/<dir>/code/x.py"` only for files in no repo. |
| `VideoSection` | `<VideoSection youtubeId="…" title="…" />` | Source video |
| `Quiz` | `<Quiz question options={[…]} answerIndex explanation />` | 3–6 knowledge checks per chapter |
| Concept cards | `<ConceptCard title>body</ConceptCard>` · `InfoCard` `TipCard` `WarningCard` `NoteCard` | Callouts |
| `mermaid` | ` ```mermaid ` fence | Every architecture/flow/comparison |
| Terminal | ` ```bash ` fence + ` ```text ` fence | Commands + real output → interactive terminal |
| Code | ` ```python ` fence | Short excerpts (<~15 lines) |
| Tables | `|…|` | Comparisons, spec matrices |
| `ImageGallery` | `images={[{src,title,caption}]}` | Grouped screenshot sets |
| `references.json` | file | `{"concepts":{"<chId>#<sec>":{refs:[{kind:repo|file|commit,…}]}}}` → Concept & Code links |

### 7 — Register (all three files)

- `src/data/docsRegistry.json` — append category `{id,title,icon,subtitle,contentBase:"/<dir>/",courses:[{id:"core-chapters",…,chapters:[{id,title,file,sectionCount}]}]}`.
- `src/data/categories.js` — `CAT_COLORS` entry.
- `scripts/convert-docs.mjs` — CATS entry `src: path.join(ROOT,'doc_<course>')`, `dir:'<dir>'`, `discoverFlat`.

### 8 — Verify

- Dev server `localhost:5177`; route `/courses/<catId>/core-chapters/<chapterId>`.
- Puppeteer + Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` — see `scripts/debug/chk-ac.mjs` for the pattern. Per chapter: h2s present, all screenshot imgs `naturalWidth>0` (**scroll first — lazy load**), `.monaco-editor` for explorers, youtube iframe, zero `pageerror`. Landing shows the card.
- `npm run build` clean.

### 9 — REVIEW & ENHANCE (never skip)

Second pass over every chapter: dense paragraph → table; flow-in-words → mermaid; assumed context → InfoCard; screenshot captions say *what to notice*; static code screenshots → `GitHubExplorer`; knowledge checks test *decisions*, not trivia; `references.json` entries; cross-links to sibling courses. Re-verify after edits.

## Pitfalls (hard-won)

- **Heading+code-fence trap**: `##` headings containing `code|examples?|demo|walkthrough|implement|yaml|dockerfile|script|program|snippet` + a code fence → section renders ONLY the fence — prose/images die. Rename the heading ("Coding" ≠ "code").
- Headings matching `quiz|knowledge check|interview|Q&A|command|cli|terminal|challenge|lab|troubleshoot` become typed sections — keep prose out.
- **`convert-docs.mjs` wipes `public/<dir>`** and re-mirrors from each category's source — all sources are in-repo `doc_*` dirs, so a regen is safe. Edit `doc_*/`, then regen (or hand-mirror a single file into `public/`).
- Git Bash heredocs eat `\\` in Windows paths — write scripts with file tools.
- Explorers: `expanded="true"` opens on scroll; multi-file cards get ←→ keys.
