# AI AGENT AUTONOMOUS DIRECTIVE & VITAL SKILLS PROTOCOL
> **MANDATORY INSTRUCTIONS FOR ANY AI AGENT WORKING ON THIS REPOSITORY**  
> *This document is automatically loaded as the top-level behavioral contract. Every AI agent must execute and adhere to these directives autonomously without waiting for explicit prompt direction.*

---

## ⚡ Core Philosophy: Autonomous Senior Engineer Mindset
When you receive any prompt, do NOT produce simple minimum viable products, mockups, or unverified code. You are expected to operate as a Principal Full-Stack Engineer and autonomous AI agent. Automatically invoke, orchestrate, and apply the specialized skills cataloged below from project kickoff through final delivery.

---

## 🎯 Mandatory Automated Workflows (Execute Automatically)

### 1. 🪐 Persistent Knowledge Sphere & Architecture Memory (`graphify-windows`)
**Rule**: Never work blind or lose context across sessions.
- **On Project Start / Substantial Updates**:
  - Check if `graphify-out/` exists. If not, or if significant code has been added, immediately run:
    ```bash
    python -m graphify update .
    ```
  - This builds the interactive 3D knowledge sphere ([`graphify-out/graph.html`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/graphify-out/graph.html)) and GraphRAG knowledge base ([`graphify-out/graph.json`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/graphify-out/graph.json)).
- **Querying Architecture**:
  - Use `graph_stats`, `god_nodes`, and `query_graph` via MCP or the graphify tools to inspect community clusters, dependencies, and entrypoints before refactoring.
- **User Visualization**:
  - Always keep the 3D Sphere mounted and accessible via `/graphify/graph.html` and a prominent UI button (`🌐 Knowledge Sphere`).

---

### 2. 🧪 100% Real Automated Verification (`playwright-automation` & `test-driven-development`)
**Rule**: Never ask the user to test your work. You must test and verify everything yourself.
- **Automated Regression Suite**:
  - Maintain and run [`tests/run_all_tests.py`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/tests/run_all_tests.py) on any code change.
  - Test suites must cover:
    1. **End-to-End & Integration Tests** ([`tests/test_automation.py`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/tests/test_automation.py)): Live backend endpoints, data parsers, filters, and AI routers.
    2. **User State & Persistence Tests** ([`tests/test_applied_feature.py`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/tests/test_applied_feature.py)): UI toggles, ribbons, drawers, and `localStorage` persistence across page reloads.
    3. **Visual & In-Page Autofill Tests** ([`tests/test_visual_verification.py`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/tests/test_visual_verification.py)): Real Chromium headless verification of DOM rendering, console errors, and ATS autofill.
- **Visual Artifacts**:
  - Automatically save screenshots of visual changes to `tests/artifacts/` to verify layout fidelity and eliminate console warnings.

---

### 3. 🎨 Apple-Grade Aesthetic Standards (`frontend-design` & `frontend-ui-engineering`)
**Rule**: Basic, unstyled, or AI-generic UIs are unacceptable.
- **Visual Principles**:
  - Modern, dark-mode-first aesthetic with curated HSL color schemes.
  - Subtle glassmorphism (`backdrop-filter: blur(16px)`), crisp 1px borders with low-opacity alpha layers (`rgba(255, 255, 255, 0.08)`).
  - Modern typography (Inter, Outfit, SF Pro) with high contrast hierarchy.
  - Micro-interactions: 150-250ms smooth CSS transitions for hover, active, and modal states.
- **Stateful Feedback & Accessibility**:
  - Any user action (e.g. marking "Applied", bookmarking, expanding) must provide immediate visual feedback (emerald green accent badges, counter updates).
  - Full keyboard accessibility: Support <kbd>Esc</kbd> for drawers/modals, dedicated hotkeys (e.g., <kbd>A</kbd> for Applied toggle).

---

### 4. 🛡️ Multi-Tier AI Resilience & Latency Safeguards (`gemini-api-dev`)
**Rule**: Zero 500 errors. Every LLM/API call must be wrapped in a multi-tier fallback architecture.
- **Tier 1 (Primary)**: Google Gemini Flash (`models/gemini-2.5-flash`) with strict timeout guards (e.g., 4.5s max).
- **Tier 2 (Secondary)**: Open-tier / OpenRouter free models if configured.
- **Tier 3 (Deterministic Fallback)**: Grounded, high-fidelity local deterministic template engine. If the network or API quota drops, return a production-quality result immediately.
- **Telemetry**:
  - Include `X-Request-ID` and `X-Process-Time` headers in HTTP middleware for instant latency profiling.

---

### 5. ⚡ Lean Engineering & Anti-Bloat (`ponytail` & `code-simplification`)
**Rule**: Keep solutions minimal, standard-library-first, and zero-overhead.
- Avoid bulky, speculative dependencies when native browser APIs (`localStorage`, `fetch`, Vanilla CSS) or Python standard libraries (`urllib`, `dataclasses`, `re`, `json`) accomplish the task cleanly.
- Keep codebase modular with zero dead code or unused stubs.

---

## 📋 Pre-Flight Checklist for Every User Request
Before submitting any task response, confirm:
- [ ] Has the master test suite ([`tests/run_all_tests.py`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/tests/run_all_tests.py)) been executed with 100% pass rate?
- [ ] Is the 3D Knowledge Sphere ([`graphify-out/graph.html`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/graphify-out/graph.html)) updated and navigable?
- [ ] Does any new stateful feature persist cleanly across page refreshes?
- [ ] Are visual screenshots captured in `tests/artifacts/`?
- [ ] Are all responses accompanied by clickable markdown links to exact modified files and line numbers?
