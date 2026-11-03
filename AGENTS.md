# AI AGENT DIRECTIVE & AUTONOMOUS SKILLS FRAMEWORK
> **MANDATORY SYSTEM DIRECTIVE FOR ALL AI AGENTS & CODING ASSISTANTS**  
> *Target Workspace: `Internship-AI-Agent` & Full-Stack Projects*

Whenever this repository is loaded or a new feature/project task is assigned, execute the following autonomous workflows without waiting for explicit prompt direction:

---

## 🚀 1. The Autonomous Execution Protocol

### A. Persistent Knowledge Sphere (`graphify-windows`)
- Keep project knowledge alive across sessions.
- Check and update `graphify-out/` using `python -m graphify update .` whenever architecture changes.
- Ensure the interactive 3D Sphere is available at `http://127.0.0.1:8500/graphify/graph.html` and via the header UI button.
- Consult `god_nodes` and `query_graph` to understand connections before refactoring.

### B. Automated Testing First (`playwright-automation` & `test-driven-development`)
- Always execute and pass `python tests/run_all_tests.py` covering:
  - Integration and business logic (`test_automation.py`)
  - State tracking and `localStorage` persistence (`test_applied_feature.py`)
  - Headless Chromium visual rendering and ATS autofill (`test_visual_verification.py`)
- Save verification snapshots into `tests/artifacts/`.
- Never ask the user to test what can be tested autonomously.

### C. Premium UI/UX Design System (`frontend-design` & `frontend-ui-engineering`)
- Adhere strictly to Apple-grade dark aesthetics:
  - Deep rich dark backgrounds (`#0a0b10`), clean glassmorphism, tailored HSL accents.
  - Emerald green badges for completed/applied items (`#10b981`), blue/violet for primary actions.
  - Micro-animations (150-250ms), keyboard hotkeys (<kbd>Esc</kbd>, <kbd>A</kbd>), and zero layout shift.
  - Never generate basic or unstyled MVPs.

### D. Multi-Tier AI Resilience (`gemini-api-dev`)
- Zero 500-error policy for all AI/LLM endpoints.
- Always implement a tiered cascade:
  - **Tier 1**: Google Gemini Flash (`models/gemini-2.5-flash`) with sub-5s timeout.
  - **Tier 2**: Open-tier models if configured.
  - **Tier 3**: Grounded deterministic fallback engine producing production-grade ATS output instantly.
- Instrument latency and trace IDs via FastAPI middleware (`X-Request-ID`, `X-Process-Time`).

### E. Standard-Library-First & Anti-Bloat (`ponytail`)
- Use native platform APIs (Vanilla CSS, native DOM, Python stdlib) before introducing heavy external libraries.
- Eliminate dead code and keep abstractions grounded.

---

## 📂 Reference Links
- Master Skills Index: [`.agents/skills/SKILLS_INDEX.md`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/.agents/skills/SKILLS_INDEX.md)
- Full Skills Protocol: [`.agents/skills/AGENTS.md`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/.agents/skills/AGENTS.md)
- Master Test Suite: [`tests/run_all_tests.py`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/tests/run_all_tests.py)
- Interactive 3D Sphere: [`graphify-out/graph.html`](file:///c:/Users/shami/OneDrive/Desktop/Coding/Full-Stack%20Projects/Internship-AI-Agent/graphify-out/graph.html)
