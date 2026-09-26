---
name: reusable_component_architecture
description: Enforces strict 1000% reusability guidelines for web app components, prohibiting hardcoded data, fixed API endpoints, or domain-specific text inside UI components.
---

# Reusable Component Architecture Skill

This skill enforces strict standards to ensure every frontend component created or modified is 1000% reusable across different courses, topics, domains, and frameworks.

## Core Directives

### 1. Data Ingestion via Props (No Inlined Constants)
- **Bad Practice**: Inlining `const CATEGORIES = [...]`, `const PRESET_TEMPLATES = [...]`, or `const SAMPLE_QUESTIONS = [...]` directly inside component files.
- **Mandatory Practice**: Accept data arrays via props with optional default fallback arrays:
  ```jsx
  const Component = ({ items = [], templates = [], categories = [] }) => { ... }
  ```

### 2. Decoupled Service Execution
- **Bad Practice**: Hardcoding `fetch('/api/playground/run-code')` or `fetch('/api/chat')` inside UI widgets.
- **Mandatory Practice**: Accept an execution handler prop `onExecute` or a configurable `apiEndpoint` prop:
  ```jsx
  const CodeWidget = ({ apiEndpoint = '/api/run', onExecute }) => {
    const handleRun = async (code) => {
      if (onExecute) return onExecute(code);
      return fetch(apiEndpoint, { method: 'POST', body: JSON.stringify({ code }) });
    };
  };
  ```

### 3. Dynamic Text & Branding
- **Bad Practice**: Hardcoding text like `"Bedrock Agent"`, `"AWS Phase 01"`, or `"Python Sandbox"`.
- **Mandatory Practice**: Parameterize text strings:
  ```jsx
  const ChatHeader = ({ title = "AI Assistant", subtitle = "Interactive Q&A Agent" }) => (
    <div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
  ```

### 4. Verification Checklist Before Marking Component Complete
- [ ] Are there any hardcoded domain data arrays in the file? (If yes, move to prop).
- [ ] Is there any hardcoded API fetch URL? (If yes, make endpoint configurable via prop).
- [ ] Can this component be dropped into a completely different project without editing its source code? (Must be YES).
