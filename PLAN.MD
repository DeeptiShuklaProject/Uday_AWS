# AWS Production Masterclass — React Rebuild Plan

## Project Goal
Rebuild the AWS Production Masterclass course application from vanilla HTML/CSS/JS (Uday_AWS `main` branch) into a modern React + Vite application, following the **1000% reusable component architecture** from wscs_bedrock.

---

## Source of Truth

### Existing App (Vanilla JS — DO NOT MODIFY)
- **Repo**: `DeeptiShuklaProject/Uday_AWS.git`
- **Branch**: `main`
- **Local Path**: `c:\Users\nishu\workspace\Uday_AWS`

### New React App (THIS BRANCH)
- **Repo**: `DeeptiShuklaProject/Uday_AWS.git`
- **Branch**: `AWS_REACT`
- **Local Path**: `c:\Users\nishu\workspace\AWS_REACT`

---

## Existing Application Features to Replicate

### Core Features
1. **47 Chapter Modules** — Full AWS services course (IAM, S3, EC2, VPC, Lambda, etc.)
2. **Slide-based Lesson Engine** — Each chapter has slides with content, key points, code examples
3. **Chapter Navigation** — Sidebar with all 47 modules, progress tracking
4. **Detailed Chapter Modal** — Full markdown rendering of chapter documentation (NO practical labs)
5. **Lab Notes Modal** — Shows chapter-specific Practical Lab content (accordion, single-open) + user's personal editable notes with auto-save
6. **Mermaid Diagram Rendering** — Architecture diagrams render as SVGs inside both modals
7. **Chapter Synchronization** — Clicking a chapter updates all views (slides, details, labs)

### Content Data Sources
- **Chapter Markdown Files**: `chapters/Chapter_01_AWS_IAM.md` through `Chapter_47_...md` (47 files)
- **Module JS Data Files**: `js/data/module-01-iam.js` through `module-47-cost.js` (slide content)
- **Course Registry**: `js/data/courses.js` (module list, titles, icons)

### Key UI Components in Existing App
| Component | File | Purpose |
|-----------|------|---------|
| Lesson Engine | `js/engine/lesson-engine.js` | Slide rendering, navigation, progress |
| Details Popup | `js/engine/details-popup.js` | Detailed Chapter modal (markdown, mermaid, strips labs) |
| Lab Popup | `js/engine/lab-popup.js` | Lab Notes modal (accordion labs + personal notes editor) |
| Module Data | `js/data/module-*.js` | Per-chapter slide data (concepts, code, key points) |
| Courses | `js/data/courses.js` | Module registry (IDs, titles, icons, descriptions) |

---

## Architecture Rules (from wscs_bedrock)

### 1000% Component Reusability
- **ZERO hardcoded data** inside components — all via props
- **ZERO hardcoded API endpoints** — use configurable props/callbacks
- **ZERO domain-specific text** — titles, labels, branding via props
- Every component must work in ANY project without editing source code

### Registry-Driven Extension
- Adding new chapters/modules = adding config entries, NOT modifying components
- Course data loaded from JSON/registry, not hardcoded in components

### Decoupled Architecture
- Presentation components separate from data-fetching logic
- Custom hooks for data loading, state management
- Context providers for global state (current chapter, theme, user preferences)

---

## React App Technical Stack

### Setup
```bash
npx -y create-vite@latest ./ --template react
npm install react-router-dom marked mermaid
```

### Folder Structure
```
AWS_REACT/
├── .agents/                    # Agent skills & architecture docs
├── chapters/                   # 47 chapter markdown files (existing)
├── src/
│   ├── App.jsx                 # Root app with routing
│   ├── main.jsx                # Entry point
│   ├── index.css               # Global styles & design system
│   ├── components/
│   │   ├── Layout.jsx          # Main layout (sidebar + content)
│   │   ├── Sidebar.jsx         # Chapter navigation sidebar
│   │   ├── LessonViewer.jsx    # Slide-based lesson engine
│   │   ├── SlideRenderer.jsx   # Individual slide rendering
│   │   ├── DetailedChapter.jsx # Chapter documentation modal
│   │   ├── LabNotes.jsx        # Lab notes modal (accordion + editor)
│   │   ├── LabAccordion.jsx    # Single-open accordion for labs
│   │   ├── MarkdownRenderer.jsx # Reusable markdown + mermaid renderer
│   │   ├── RichTextEditor.jsx  # Contenteditable notes editor
│   │   └── TopBar.jsx          # Top bar with chapter title & action buttons
│   ├── hooks/
│   │   ├── useChapterData.js   # Fetches & caches chapter markdown
│   │   ├── useModuleData.js    # Loads module slide data
│   │   ├── useLabNotes.js      # Lab notes CRUD (API + localStorage fallback)
│   │   └── useMermaid.js       # Lazy mermaid loading & rendering
│   ├── context/
│   │   └── CourseContext.jsx    # Current module, chapter sync, progress
│   ├── data/
│   │   └── courseRegistry.json  # All 47 modules (id, title, icon, mdFile)
│   └── utils/
│       ├── markdownUtils.js    # Strip labs, extract labs from markdown
│       └── constants.js        # Shared constants
├── backend/                    # Existing Python backend (unchanged)
├── PLAN.MD                     # This file
└── package.json
```

---

## Implementation Phases

### Phase 1: Foundation
1. Initialize Vite + React project
2. Create design system (`index.css`) matching existing app aesthetic
3. Create `courseRegistry.json` from existing `courses.js` data
4. Set up `CourseContext` for chapter synchronization

### Phase 2: Core Components
1. `Layout.jsx` — Sidebar + main content area
2. `Sidebar.jsx` — 47 module navigation with progress indicators
3. `TopBar.jsx` — Chapter title, Detailed Chapter button, Lab Notes button
4. `LessonViewer.jsx` — Slide engine with prev/next navigation
5. `SlideRenderer.jsx` — Renders individual slide content

### Phase 3: Modals
1. `MarkdownRenderer.jsx` — Reusable markdown + mermaid component
2. `DetailedChapter.jsx` — Modal showing chapter docs (strips practical labs)
3. `LabNotes.jsx` — Modal with accordion labs + personal notes editor
4. `LabAccordion.jsx` — Single-open accordion for practical labs
5. `RichTextEditor.jsx` — Contenteditable editor with toolbar

### Phase 4: Data & Hooks
1. `useChapterData.js` — Fetch markdown, parse, cache
2. `useModuleData.js` — Load slide data dynamically
3. `useLabNotes.js` — Load/save notes (API with localStorage fallback)
4. `useMermaid.js` — Lazy-load mermaid library, render diagrams

### Phase 5: Polish
1. Responsive design (desktop, tablet, mobile)
2. Keyboard shortcuts (arrow keys for slides, Escape to close modals)
3. Reading progress persistence
4. Dark mode support
5. Performance optimization (lazy loading, code splitting)

---

## Component Props Contracts (Reusability)

### LessonViewer
```jsx
<LessonViewer
  slides={[]}              // Array of slide objects
  onSlideChange={fn}       // Callback when slide changes
  initialSlide={0}         // Starting slide index
/>
```

### DetailedChapter
```jsx
<DetailedChapter
  isOpen={bool}            // Modal visibility
  onClose={fn}             // Close callback
  title="Chapter Title"    // Dynamic title
  markdownUrl="/path.md"   // Markdown file URL
  stripPattern={regex}     // Pattern to strip (practical labs)
/>
```

### LabNotes
```jsx
<LabNotes
  isOpen={bool}
  onClose={fn}
  title="Chapter Title"
  markdownUrl="/path.md"
  extractPattern={regex}   // Pattern to extract lab content
  noteId="module-01"       // Unique ID for saving notes
  saveEndpoint="/api/lab"  // API endpoint (configurable)
/>
```

### LabAccordion
```jsx
<LabAccordion
  items={[{title, content}]} // Array of accordion items
  singleOpen={true}           // Only one open at a time
/>
```

### MarkdownRenderer
```jsx
<MarkdownRenderer
  content="# markdown"     // Raw markdown string
  renderMermaid={true}      // Enable mermaid diagrams
  className="custom-class"  // Custom styling
/>
```

---

## Migration Checklist

- [ ] All 47 chapters load correctly
- [ ] Slide navigation works (prev/next/keyboard)
- [ ] Detailed Chapter modal renders markdown without practical labs
- [ ] Mermaid diagrams render in Detailed Chapter
- [ ] Lab Notes modal shows chapter-specific practical labs in accordion
- [ ] Accordion is single-open (one lab expanded at a time)
- [ ] Personal notes editor works with auto-save
- [ ] Save & Close works
- [ ] Chapter synchronization works (sidebar click updates everything)
- [ ] Responsive on desktop, tablet, mobile
- [ ] No hardcoded data in any component
- [ ] Every component reusable in other projects without source edits
