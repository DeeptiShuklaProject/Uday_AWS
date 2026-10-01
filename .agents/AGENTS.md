# Workspace AGENTS.md — AWS Production Masterclass React Rebuild

## Project Context
This is a React + Vite rebuild of the AWS Production Masterclass course application.
- **Source app**: Vanilla HTML/CSS/JS in `Uday_AWS` (branch: `main`)
- **This app**: React rebuild in `AWS_REACT` (branch: `AWS_REACT`)
- **Architecture reference**: Copied from `wscs_bedrock/.agents`

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

| Course id | Title | Source dir | Public dir | Route |
|---|---|---|---|---|
| `bedrock-to-production` | Bedrock to Production | `wscs_bedrock/doc_aws_bedrock_production by Deepti` (**STALE — see warning**) | `public/bedrock-deepti/` | `/courses/bedrock-to-production/core-chapters/<ch>` |
| `strands-agents` | Strands Agents | `doc_strands_agents/` (in-repo, true source) | `public/strands-agents/` | `/courses/strands-agents/core-chapters/<ch>` |
| `agentcore-production-agent` | AgentCore — Production-Ready Agents | `doc_agentcore_production_agent/` (in-repo, true source) | `public/agentcore-production-agent/` | `/courses/agentcore-production-agent/core-chapters/<ch>` |

- bedrock-to-production was renamed from `bedrock-deepti`; the physical asset dir stays `bedrock-deepti` (dev-server lock prevented rename). `convert-docs.mjs` supports a `dir` override decoupling route id ↔ on-disk dir.
- Course source assets: `strands_agentic_app/` holds transcripts (`agentcore_gateway_transcript.txt`, `strands_first_agentic_app_transcript.txt`), downloaded video, extracted `frames/`, and `repo_ref/` copies of GitHub files used for explorer highlight mapping. Newer work stages per-video under `.course-src/<youtubeId>/` (gitignored) — e.g. `.course-src/wzIQDPFQx30/` for the AgentCore ep-01 build (transcript, video, frames, repo_ref).
- `agentcore-production-agent` is built from the AWS Show & Tell ep-01 video `wzIQDPFQx30` (transcript also in `doc_uday_bedrock_notes/aws_employee_video_playlist/transcripts/01_*.txt`); the repo it demos was renamed `amazon-bedrock-agentcore-samples` → `awslabs/agentcore-samples`, and `bedrock-agentcore-starter-toolkit` is legacy → `aws/agentcore-cli`.

### ⚠️ convert-docs.mjs hazard

`node scripts/convert-docs.mjs` does `rmSync(public/<dir>)` then re-mirrors from each category's `src`. The bedrock-to-production source (`wscs_bedrock/doc_aws_bedrock_production by Deepti`) is **stale** — it lacks Chapter 05, the Ch01 video section, and all recent edits. Running a regen would **delete them from `public/`**. Until that source is synced, register/edit courses by hand-editing `docsRegistry.json` + copying files to `public/` manually. `strands-agents` is safe (in-repo source).

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
