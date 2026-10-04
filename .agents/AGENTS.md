# Workspace AGENTS.md — AWS Production Masterclass React Rebuild

## Project Context
This is a React + Vite rebuild of the AWS Production Masterclass course application.
- **Source app**: Vanilla HTML/CSS/JS in `Uday_AWS` (branch: `main`)
- **This app**: React rebuild in `AWS_REACT` (branch: `AWS_REACT`)
- **Architecture reference**: `.agents/ARCHITECTURE.md` (in-repo)

> **HARD RULE — never use `wscs_bedrock`** (user directive): this repo is fully self-contained. Never read from, write to, reference, or depend on `C:\Users\nishu\workspace\wscs_bedrock` (or any `*wscs*` path). All course sources live in this repo's `doc_*` dirs; `convert-docs.mjs` has zero external paths. Any lingering `wscs` strings in old docs (README/PLAN/ARCHITECTURE) are stale text — ignore them.

## Strict 1000% Component Reusability Rule

Whenever building or modifying UI components:

1. **Zero Hardcoding of Data or Domain Content**:
   - NEVER hardcode static data arrays, chapter lists, slide content, or course text inside component files.
   - All data MUST be passed via props or loaded from `courseRegistry.json`.

2. **Decoupled API Endpoints & Callbacks**:
   - NEVER hardcode API URLs inside components.
   - Accept callbacks (`onSave`, `onLoad`) or configurable endpoint props with fallback defaults.

3. **Domain & Brand Neutrality**:
   - Component labels, titles, and strings must NOT be hardcoded to "AWS Masterclass" or any specific course.
   - Pass display strings as props.

4. **Universal Compatibility**:
   - Every component MUST be reusable across different courses without editing source code.

## Strict Side-by-Side Replacement Rule

Whenever a static visual (screenshot, diagram image, PNG) is replaced or upgraded by an interactive widget or generated asset (`FlowDiagram`, exported `.svg`, mermaid, `Conversation`, `ImageGallery`, etc.):

1. **NEVER delete the original image** — keep `![alt](screenshots/xx.png)` in the markdown.
2. **Order is widget/SVG first, original image immediately after** — so the reader sees interactive → original and can compare fidelity.
3. The original image keeps its caption; a short note ("compare with the original slide") ties them together.
4. Applies to every future chapter and course, not just bedrock-to-production.

## Content Architecture

### Markdown Chapter Files
- Located in `chapters/` folder (47 files)
- Each chapter contains: documentation + practical labs at the end
- Practical labs start with `# 🔬 Practical Lab` H1 heading
- **Detailed Chapter modal**: Shows chapter docs ONLY (strips labs)
- **Lab Notes modal**: Shows practical labs ONLY (extracted) + user notes

### Module Slide Data
- Originally in `js/data/module-*.js` files
- Must be converted to importable JSON/ES modules for React

### Course Registry
- All 47 modules registered in `courseRegistry.json`
- Maps module IDs to titles, icons, markdown filenames

## Key Implementation Files
- See `PLAN.MD` for full component structure, props contracts, and phases
- See `ARCHITECTURE.md` for system architecture reference
- See `knowledge_graph.json` for component relationship map

---

## Video-Notes Courses (doc-courses added 2025)

Markdown-driven courses rendered by the shared lesson engine (`moduleParser.js` → `LessonViewer`/`SlideRenderer`). Each = a `doc_*` source dir at repo root + a mirrored `public/<dir>/` + a category entry in `src/data/docsRegistry.json` + a color in `src/data/categories.js`.

### Courses

| Course id | Title | Source dir (in-repo) | Public dir | Route |
|---|---|---|---|---|
| `aws-agentcore` | **AWS AgentCore — Complete Series** (composite, 14 sections / 36 ch) | assembled in `convert-docs.mjs` `PLAYLIST_SECTIONS` | reuses all dirs below | `/courses/aws-agentcore/<sectionId>/<ch>` |
| `agentcore-playlist` | Series framing (intro map + summary notes) — hidden, feeds `aws-agentcore` | `doc_agentcore_playlist/` | `public/agentcore-playlist/` | sections `introduction` + `summary-notes` |
| `bedrock-to-production` | Bedrock to Production | `doc_bedrock_production/` | `public/bedrock-deepti/` | `/courses/bedrock-to-production/core-chapters/<ch>` |
| `strands-agents` *(hidden)* | Strands Agents → `aws-agentcore` ep02 | `doc_strands_agents/` | `public/strands-agents/` | `/courses/aws-agentcore/ep02-strands-agents/<ch>` |
| `agentcore-production-agent` *(hidden)* | Production-Ready Agents → `aws-agentcore` ep01 | `doc_agentcore_production_agent/` | `public/agentcore-production-agent/` | `/courses/aws-agentcore/ep01-production-agent/<ch>` |
| `agentcore-security` *(hidden)* | ep 05 `wv2doVDF7KQ` | `doc_agentcore_security/` | `public/agentcore-security/` | `…/ep05-secure-workflows/<ch>` |
| `agentcore-tools` *(hidden)* | ep 06 `z3lAJ-Nf_lk` | `doc_agentcore_tools/` | `public/agentcore-tools/` | `…/ep06-built-in-tools/<ch>` |
| `agentcore-memory` *(hidden)* | ep 07 `-N4v6-kJgwA` | `doc_agentcore_memory/` | `public/agentcore-memory/` | `…/ep07-memory-deep-dive/<ch>` |
| `agentcore-prod-deploy` *(hidden)* | ep 08 `WyGK8UcAxKo` | `doc_agentcore_prod_deploy/` | `public/agentcore-prod-deploy/` | `…/ep08-prototype-to-production/<ch>` |
| `agentcore-observability` *(hidden)* | ep 09 `wWQgawUPr1k` | `doc_agentcore_observability/` | `public/agentcore-observability/` | `…/ep09-observability/<ch>` |
| `agentcore-evaluations` *(hidden)* | ep 10 `i0h7xA8cqYs` | `doc_agentcore_evaluations/` | `public/agentcore-evaluations/` | `…/ep10-evaluations/<ch>` |
| `agentcore-tool-controls` *(hidden)* | ep 11 `q_9htaugcgI` | `doc_agentcore_tool_controls/` | `public/agentcore-tool-controls/` | `…/ep11-tool-controls/<ch>` |
| `agentcore-episodic-memory` *(hidden)* | ep 12 `1EEIGsKIjGA` | `doc_agentcore_episodic_memory/` | `public/agentcore-episodic-memory/` | `…/ep12-episodic-memory/<ch>` |

- **Composite playlist course**: `aws-agentcore` is assembled in `convert-docs.mjs` (`PLAYLIST_SECTIONS`) — one landing card whose sidebar sections are `Introduction → EP 01…EP 12 → Summary Notes`. Each section keeps its own `contentBase`, so chapters are **reused in place** (no file duplication). ep03/ep04 sections cherry-pick `bedrock-deepti` Ch04/Ch05. Categories flagged `hidden` still mirror to `public/` but emit no landing card — their content only surfaces via `aws-agentcore`.
- bedrock-to-production route id vs on-disk dir differ (`bedrock-deepti`); `convert-docs.mjs` `dir` override decouples them.
- Other categories are also fully in-repo: `doc_linux/`, `doc_docker/`, `doc_python_devops/`, `doc_kubernetes/` — `convert-docs.mjs` has **no external source dependencies**.
- Course source assets stage per-video under `.course-src/<youtubeId>/` (gitignored) — transcript.txt, video.mp4, frames/, repo_ref/. Playlist transcripts also live in `doc_uday_bedrock_notes/aws_employee_video_playlist/transcripts/NN_*.txt` with summaries/questions/examples alongside.
- `agentcore-production-agent` is built from the AWS Show & Tell ep-01 video `wzIQDPFQx30`; the repo it demos was renamed `amazon-bedrock-agentcore-samples` → `awslabs/agentcore-samples`, and `bedrock-agentcore-starter-toolkit` is legacy → `aws/agentcore-cli`.

### convert-docs.mjs behavior

`node scripts/convert-docs.mjs` does `rmSync(public/<dir>)` then re-mirrors from each category's `src`. **All sources are in-repo `doc_*` dirs** — a regen is safe and regenerates `docsRegistry.json` + every `public/` mirror. Edit course content in the `doc_*` source dir, then run the script (or hand-mirror into `public/` for a single file).

### Chapter markdown conventions

- Structure: `# Course — Chapter N` + `# 🚀 Title` H1s; `## Chapter Goal`; `## N.M` numbered sections; `## 🏁 Chapter N Summary`; `### Watch the Original Tutorial` + `<VideoSection youtubeId title />` at the bottom (Ch01 may use it as an "About This Course" opener).
- Widgets (see `src/utils/moduleParser.js` `transformCustomTags`): `<Quiz question options={[...]} answerIndex explanation />`, paired `<ConceptCard title>...</ConceptCard>` (+ InfoCard/TipCard/WarningCard/NoteCard/KeyTakeaways), ` ```mermaid ` diagrams, `<GitHubExplorer repo="org/repo" ref="main" expanded="true" title="..." files={[{path,label,highlights:[[a,b]],note}]}/>`, `<AgentFlowStoryteller>`, `<VideoSection>`.
- Interactive terminal = ` ```bash ` fence immediately followed by ` ```text`/`output` fence (becomes command + expectedOutput).
- Screenshots: `![alt](screenshots/xx.png)` + italic caption; code screenshots should become `GitHubExplorer` cards with real repo paths (verify via GitHub API — repos reorganize).
- `references.json` per course: `{version, concepts: {"<chapterId>#<sec>": {refs:[{kind:repo|file|commit, ...}]}}}` powers the Concept & Code links.

### Parser pitfalls (moduleParser.js)

- A `##` heading matching `/code|examples?|demo|walkthrough|implement|yaml|dockerfile|script|program|snippet/i` **and** containing a non-shell code fence → becomes a `code`-typed section that renders ONLY the fences — prose/images/explorers are swallowed. Rename the heading (e.g. "Coding Assistant" — "coding" doesn't match `/code/`).
- Headings matching `quiz|knowledge check|interview|Q&A|troubleshoot|command|cli|terminal|challenge|lab` similarly become typed sections — keep prose out of them.
- `<GitHubExplorer>` cards: `expanded="true"` opens on scroll; multi-file cards get ←→ arrow navigation (only multi-file explorers claim keys on mount — fixed in `GitHubPreciseCodeExplorerModal.jsx`).

### Tooling

- Dev server: `localhost:5177` (`npm run dev`); build: `npm run build`.
- Browser checks: puppeteer-core + system Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) — see `scripts/debug/chk-*.mjs`. Scroll the page before asserting on images (lazy loading). **Write .mjs scripts with file tools, not bash heredocs** — Git Bash eats Windows path backslashes.
- `scripts/extract_frames.py` — scene-change frame extraction from a downloaded video (yt-dlp + OpenCV); gap-fills static spans.
- `youtube-transcript-api` (pip) for transcripts; `yt-dlp` via `python -m yt_dlp` for video downloads.

### Skill

- **`.agents/skills/software_course_builder_from_youtube/SKILL.md`** — the end-to-end video→course pipeline. Invoke it for any "build a course/chapter from this video" request. Staging convention: `.course-src/<youtubeId>/` (gitignored) holds transcript.txt, video.mp4, frames/, repo_ref/, shots/.
