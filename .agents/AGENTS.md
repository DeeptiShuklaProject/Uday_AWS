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
