# AWS Production Masterclass — React Rebuild Plan (Devin Branch)

## ⚠️ CRITICAL: READ THIS ENTIRE FILE BEFORE WRITING ANY CODE

---

## What This Project Is

Rebuild the **AWS Production Masterclass** course application as a **pure React + Vite** app.

The existing vanilla HTML/CSS/JS app lives in:
- **Repo**: `DeeptiShuklaProject/Uday_AWS.git`
- **Branch**: `main`
- **Reference folder**: `c:\Users\nishu\workspace\Uday_AWS`

This React rebuild lives in:
- **Repo**: `DeeptiShuklaProject/Uday_AWS.git`
- **Branch**: `AWS_REACT_DEVIN`
- **This folder**: `c:\Users\nishu\workspace\aws_react_devin`

---

## ⚠️ MANDATORY CSS / STYLING RULE

### DO NOT copy or follow the old vanilla JS app's CSS.

The CSS and design system for this React app **MUST 100% follow** the patterns from:

```
c:\Users\nishu\workspace\wscs_bedrock\aura_docs\frontend\src\
├── index.css              (53KB — global styles)
├── css/
│   ├── design-system.css  (10KB — tokens, variables, theme)
│   ├── components.css     (30KB — component styles)
│   ├── layout.css         (18KB — layout & responsive)
│   └── animations.css     (7KB  — micro-animations)
```

**Reference these files directly** for:
- Color palette, CSS variables, dark/light theme tokens
- Typography (font families, sizes, weights)
- Spacing, border-radius, shadows
- Component styling patterns (cards, modals, buttons, sidebars)
- Responsive breakpoints
- Animations and transitions

### You MAY modify `.agents/`, `AGENTS.md`, skills, and `ARCHITECTURE.md` to fit this project.
### You MUST NOT use old vanilla CSS from the `Uday_AWS` app.

---

## Functionality Must Be Pure React

### DO:
- Use React functional components with hooks
- Use React Router for navigation
- Use React Context for global state (current chapter, theme)
- Use custom hooks for data fetching, caching, state
- Use ES modules / dynamic imports for code splitting
- Use `marked` library for markdown rendering
- Use `mermaid` library for diagram rendering

### DO NOT:
- Use vanilla DOM manipulation (`document.createElement`, `innerHTML`, etc.)
- Use jQuery or any non-React DOM library
- Use `contenteditable` directly — wrap it in a React component
- Copy-paste vanilla JS code from `Uday_AWS` — rewrite as React components
- Hardcode ANY data, strings, API URLs, or course content in components

---

## Existing App Features to Replicate

### 1. Course Navigation (47 Chapters)
- Sidebar listing all 47 AWS service modules
- Click a chapter → updates slides, details, labs
- Progress tracking per chapter

### 2. Lesson Slide Engine
- Each chapter has slides (key points, concepts, code examples)
- Previous / Next navigation
- Slide counter (e.g., "Slide 3 of 12")
- Keyboard navigation (arrow keys)

### 3. Detailed Chapter Modal
- Opens full chapter markdown documentation
- **STRIPS Practical Lab sections** (everything from `# 🔬 Practical Lab` heading onwards)
- Renders Mermaid diagrams as SVGs
- Wide modal (88vw, max 1600px)
- Responsive (tablet/mobile breakpoints)

### 4. Lab Notes Modal
- Shows chapter-specific Practical Lab content (EXTRACTED from markdown)
- **Accordion UI** — each lab is a collapsible section
- **Single-open accordion** — only one lab expanded at a time
- All labs collapsed by default
- User's personal notes editor BELOW the lab content
- Rich text toolbar (bold, italic, headings, lists, code, links)
- **Auto-save** (3 second debounce after typing)
- **Save & Close** button
- Save to API `/api/lab/{moduleId}` with localStorage fallback
- Green badge on button when notes exist

### 5. Chapter Synchronization
- `currentModule` state drives everything
- Sidebar click → updates slide viewer, details modal, lab notes modal
- All modals show content for the CURRENT chapter only

---

## Content Data Sources

### Chapter Markdown Files (47 files)
```
chapters/Chapter_01_AWS_IAM.md
chapters/Chapter_02_Amazon_S3.md
...
chapters/Chapter_47_AWS_Cost_Explorer_and_Budgets.md
```

Each file contains:
- Chapter documentation (concepts, architecture, best practices)
- Practical Lab sections at the end (starting with `# 🔬 Practical Lab`)

### Module Slide Data
Currently in `js/data/module-01-iam.js` through `module-47-cost.js`.
Convert to JSON or ES module imports for React.

### Course Registry
Currently in `js/data/courses.js`. Convert to `courseRegistry.json`:
```json
[
  { "id": "module-01", "title": "AWS IAM", "icon": "🔐", "mdFile": "Chapter_01_AWS_IAM.md" },
  { "id": "module-02", "title": "Amazon S3", "icon": "📦", "mdFile": "Chapter_02_Amazon_S3.md" },
  ...
]
```

---

## React Component Architecture

### All components MUST follow 1000% reusability rules:
- Data via props (never hardcoded)
- API endpoints via props (never hardcoded)
- Labels/titles via props (never hardcoded)
- See `.agents/AGENTS.md` and `.agents/skills/reusable_component_architecture/SKILL.md`

### Component Tree
```
App.jsx
├── CourseContext.Provider
│   ├── Layout.jsx
│   │   ├── Sidebar.jsx (chapter list, progress)
│   │   ├── TopBar.jsx (title, Detailed Chapter btn, Lab Notes btn)
│   │   └── LessonViewer.jsx (slide engine)
│   │       └── SlideRenderer.jsx (single slide)
│   ├── DetailedChapterModal.jsx
│   │   └── MarkdownRenderer.jsx (markdown + mermaid)
│   └── LabNotesModal.jsx
│       ├── LabAccordion.jsx (single-open, collapsible labs)
│       │   └── MarkdownRenderer.jsx
│       └── RichTextEditor.jsx (personal notes)
```

### Custom Hooks
```
useChapterData(moduleId)    → { markdown, loading, error }
useModuleSlides(moduleId)   → { slides, loading, error }
useLabNotes(moduleId, endpoint) → { notes, save, loading, dirty }
useMermaid(containerRef)    → renders mermaid diagrams in ref
```

### Utility Functions
```
stripPracticalLabs(markdown)   → chapter docs only
extractPracticalLabs(markdown) → lab sections only
splitLabsIntoSections(html)    → array of { title, content } for accordion
```

---

## Implementation Phases

### Phase 1: Setup
- `npx -y create-vite@latest ./ --template react`
- Copy CSS structure from wscs_bedrock
- Create courseRegistry.json
- Set up CourseContext

### Phase 2: Navigation & Layout
- Sidebar, TopBar, Layout
- Chapter switching and synchronization

### Phase 3: Slide Engine
- LessonViewer, SlideRenderer
- Convert module data files to JSON
- Keyboard navigation

### Phase 4: Detailed Chapter Modal
- MarkdownRenderer (markdown + mermaid)
- DetailedChapterModal (strips labs)

### Phase 5: Lab Notes Modal
- LabAccordion (single-open)
- RichTextEditor (contenteditable wrapped in React)
- Auto-save hook
- LabNotesModal (accordion + editor)

### Phase 6: Polish
- Responsive design
- Dark mode
- Keyboard shortcuts
- Performance (lazy loading, code splitting)

---

## Validation Checklist

- [ ] All 47 chapters load and display correctly
- [ ] Slide navigation works (click + keyboard)
- [ ] Detailed Chapter shows docs WITHOUT practical labs
- [ ] Mermaid diagrams render as SVGs
- [ ] Lab Notes shows correct chapter's practical labs
- [ ] Accordion is single-open (one lab at a time)
- [ ] All labs collapsed by default on open
- [ ] Personal notes auto-save works
- [ ] Save & Close works
- [ ] Chapter sync works (sidebar → all views update)
- [ ] CSS follows wscs_bedrock design system, NOT old vanilla CSS
- [ ] Zero hardcoded data/strings/URLs in any component
- [ ] Every component reusable without source edits
- [ ] Responsive on desktop, tablet, mobile
