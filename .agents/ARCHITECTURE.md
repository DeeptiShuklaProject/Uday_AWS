# AuraDocs Enterprise System Architecture & Knowledge Map

## 1. Executive Summary & Core Philosophy
AuraDocs is a multi-knowledge base documentation portal, RAG (Retrieval-Augmented Generation) AI assistant, and multi-language code execution sandbox built for high reusability, zero-hardcoding component architecture, and multi-machine portability.

---

## Architectural Guardrails & Extensibility Rules
1. **1000% Component Reusability**: UI components MUST NOT hardcode domain strings, course categories, brand names, or static data arrays. All content is passed via dynamic props or registry contracts.
2. **Registry & Schema-Driven Extensibility**: Adding new courses (`doc_*`), code execution languages, interactive quizzes, or AI models MUST NOT require modifying existing UI code or backend core routes. All extensions MUST be achieved via configuration registries (`language_registry.py`, `courseRegistry.js`), filesystem scanning, or schema endpoints.
3. **Decoupled & Modular Services**: Core services (RAG Vector Engine, Code Sandbox, Dynamic Directory Scanner, i18n Translation) MUST remain loosely coupled and stateless where possible.

---

## 2. Text System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  USER BROWSER                                     |
|  - React + Vite Frontend UI (Port 8888 / ngrok tunnel)                            |
|  - GoogleTranslateWidget (11+ Global Languages Translation)                       |
|  - FedoraPlayground (CentOS Stream 9 Interactive Bash Shell & VIM Editor)         |
|  - DocReader (Markdown Viewer + Live Code Execution Triggers)                     |
|  - ChatPanel (RAG AI Chat Assistant with Source Citations)                        |
+-----------------------------------------------------------------------------------+
                                         |
                                         | REST API HTTP / WebSocket Proxy
                                         v
+-----------------------------------------------------------------------------------+
|                             FASTAPI BACKEND ENGINE                                |
|  - Server App (app.py - Port 8000)                                                |
|  - Dynamic KB Directory Scanner (Scans doc_* folders dynamically)                |
|  - Vector Search RAG Engine (rag_engine.py - Chunking & Embeddings Cache)         |
|  - Multi-Language Execution Engine (execution_engine.py & language_registry.py)   |
+-----------------------------------------------------------------------------------+
           |                                       |                        |
           | Queries Context                       | Executes Commands      | Serves Markdown
           v                                       v                        v
+-----------------------+              +-----------------------+  +-----------------------+
|  EXTERNAL AI ENGINE   |              | DOCKER EXECUTION      |  | ALL 12 KB COURSES     |
|  - Google GenAI SDK   |              | CONTAINER             |  | - doc_replica_amazon  |
|    (gemini-2.5-flash) |              | - aura_fedora_        |  | - doc_replica_docker  |
|  - AWS Bedrock        |              |   playground          |  | - doc_replica_lambda  |
|    Boto3 Client       |              |   (Isolated CentOS)   |  | - doc_Linux (12 KBs)  |
+-----------------------+              +-----------------------+  +-----------------------+
```

---

## 3. Docker Containerization & Dockerfile Map

| Dockerfile | Base Image | Services / Purpose | Port / Exec |
| :--- | :--- | :--- | :--- |
| [Dockerfile](file:///c:/Users/nishu/workspace/wscs_bedrock/Dockerfile) | `node:20-slim` ➡️ `centos:stream9` | **Production Multi-Stage Build**: Builds frontend SPA dist & packages backend with all 12 courses into a single production image | `8000` / `10000` (`uvicorn app:app`) |
| [Dockerfile.fedora](file:///c:/Users/nishu/workspace/wscs_bedrock/Dockerfile.fedora) | `quay.io/centos/centos:stream9` | **Linux Playground Sandbox**: Isolated CentOS Stream 9 container with DNF, RPM, GCC, Python 3, VIM editor | `aura_fedora_playground` (`tail -f /dev/null`) |
| [aura_docs/backend/Dockerfile](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/backend/Dockerfile) | `quay.io/centos/centos:stream9` | **Backend Dev Container**: Python 3.11, Node.js, Java 17, Golang, SQLite, Uvicorn server | `8000` (`uvicorn app:app --reload`) |
| [aura_docs/frontend/Dockerfile](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/Dockerfile) | `node:20-alpine` | **Frontend Dev Container**: React + Vite hot-reload dev server | `8888` (`npm run dev -- --host`) |

---

## 4. All 12 Knowledge Base Courses

| # | Course ID | Workspace Path | Description |
| :--- | :--- | :--- | :--- |
| 1 | `doc_replica_amazon` | `doc_replica_amazon/` | AWS Bedrock Official User Guide & Agent Core |
| 2 | `doc_replica_docker` | `doc_replica_docker/` | Docker Containerization Guide & Replica Docs |
| 3 | `doc_replica_lambda` | `doc_replica_lambda/` | AWS Lambda Developer Guide & Serverless Docs |
| 4 | `doc_replica_notes` | `doc_replica_notes/` | Replica Architecture & Engineering Notes |
| 5 | `doc_replica_product_developer` | `doc_replica_product_developer/` | Product Developer Workflows & System Specs |
| 6 | `doc_replica_youtube` | `doc_replica_youtube/` | YouTube Course Transcripts & Media Notes |
| 7 | `doc_Linux` | `doc_Linux/` | Linux Command Reference & System Administration |
| 8 | `doc_CodeAdventure` | `doc_CodeAdventure/` | Interactive Gamified Coding Adventure Course |
| 9 | `doc_basic_of_programming` | `doc_basic_of_programming/` | Programming Fundamentals & Basic Concepts |
| 10 | `doc_deepti_bedrock_notes` | `doc_deepti_bedrock_notes/` | Deepti Bedrock Implementation Notes |
| 11 | `doc_uday_bedrock_notes` | `doc_uday_bedrock_notes/` | Uday Bedrock Implementation Notes |
| 12 | `Uday_AWS_Services_notes` | `Uday_AWS_Services_notes/` | Uday AWS Services Reference & Notes |

---

## 5. Frontend-to-Backend REST API Connectivity Matrix

| Frontend Component | API Endpoint | Backend Handler Function | Purpose / Data Flow |
| :--- | :--- | :--- | :--- |
| `App.jsx` & `Navbar.jsx` | `GET /api/kbs` | `app.py -> list_knowledge_bases()` | Scans workspace for `doc_*` directories and returns available Knowledge Bases |
| `App.jsx` & `Sidebar.jsx` | `GET /api/kbs/{kb_id}/navigation` | `app.py -> get_kb_navigation()` | Generates hierarchical navigation tree for sidebar file explorer |
| `App.jsx` & `HeroLandingPage.jsx` | `GET /api/kbs/{kb_id}/course_data` | `app.py -> get_course_data()` | Returns course titles, modules, quizzes, and code templates |
| `DocReader.jsx` | `GET /api/kbs/{kb_id}/document?path=...` | `app.py -> get_kb_document()` | Serves raw markdown file content with path boundary security checks |
| `ChatPanel.jsx` | `POST /api/kbs/{kb_id}/chat` | `app.py -> chat_with_kb()` ➡️ `rag_engine.py` | Performs vector search and returns grounded AI answers with source file links |
| `FedoraPlayground.jsx` & `CodePlaygroundModal.jsx` | `POST /api/playground/run-code` | `app.py -> run_code_playground()` ➡️ `execution_engine.py` | Executes code/bash commands inside Docker container and returns stdout/stderr |
| `FedoraPlayground.jsx` | `POST /api/playground/autocomplete` | `app.py -> autocomplete_playground()` ➡️ `execution_engine.py` | Provides tab autocomplete suggestions for shell commands and paths |
| `CodePlaygroundModal.jsx` | `GET /api/playground/languages` | `app.py -> get_playground_languages()` ➡️ `language_registry.py` | Returns list of supported programming languages & runtime health status |

---

## 6. Comprehensive File Mapping

### A. Frontend Stack (`aura_docs/frontend/src/`)
* **Core Application**:
  * [App.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/App.jsx): Central application layout, state sync, reading progress, keyboard shortcuts.
  * [Navbar.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/Navbar.jsx): Top navigation bar with KB dropdown, search trigger, theme switcher.
  * [Sidebar.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/Sidebar.jsx): Tree view file explorer navigation.
  * [DocReader.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/DocReader.jsx): Markdown document viewer.
  * [TableOfContents.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/TableOfContents.jsx): Right-hand sticky table of contents.
* **Learning & Interactive Components**:
  * [GoogleTranslateWidget.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/learning/GoogleTranslateWidget.jsx): 11+ language translation widget.
  * [FedoraPlayground.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/FedoraPlayground.jsx): Fedora Linux terminal shell with VIM editor.
  * [CodePlaygroundModal.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/CodePlaygroundModal.jsx): Code execution modal pop-up.
  * [CodeAdventureGame.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/learning/CodeAdventureGame.jsx): Interactive coding adventure game module.
  * [QuizModule.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/QuizModule.jsx): Practice quiz module.
  * [ChatPanel.jsx](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/frontend/src/components/ChatPanel.jsx): RAG AI assistant drawer.

### B. Backend Stack (`aura_docs/backend/`)
* [app.py](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/backend/app.py): FastAPI web application and REST routing.
* [rag_engine.py](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/backend/rag_engine.py): Gemini API / Bedrock vector indexing and context retriever.
* [execution_engine.py](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/backend/execution_engine.py): Multi-language code execution engine.
* [language_registry.py](file:///c:/Users/nishu/workspace/wscs_bedrock/aura_docs/backend/language_registry.py): Language compilers, timeouts, and handlers registry.

---

## 7. Machine Portability & Knowledge Graph
All relationships, component maps, API contracts, Dockerfiles, and course indices are tracked in [.agents/knowledge_graph.json](file:///c:/Users/nishu/workspace/wscs_bedrock/.agents/knowledge_graph.json) so any developer or AI assistant can inspect system architecture instantly on any new machine.
