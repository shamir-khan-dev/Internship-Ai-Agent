# Autonomous Internship Radar & Auto-Applier Agent ⚡

An autonomous, end-to-end AI agent and desktop application designed to discover tech internships in real-time, compute ATS keyword match scores, dynamically tailor LaTeX resumes and human-like cover letters, and auto-apply through standard ATS portals (Greenhouse, Lever, Workday, Ashby) via Playwright browser automation.

---

## 🌟 Key Features

1. **⚡ Live Internship Radar (with ≤ 20h Freshness Tracking):**
   - Continuously scans and parses live GitHub repositories and community trackers (SimplifyJobs, PittCSC) alongside a curated catalog of Canadian and remote tech leaders (Wealthsimple, RBC Capital Markets, StackAdapt, Shopify, Coveo, Snowflake, IBM).
   - **Freshness Detection:** Every job calculates exact posting timestamps and displays relative time (e.g., `🔥 Posted 2h ago`, `🔥 Posted 4h ago`). Includes a 1-click filter for `🔥 Posted ≤ 20h ago` so you apply before postings get flooded.

2. **🎯 Real-Time ATS Confluence & LaTeX Auto-Tailoring:**
   - Extracts required tech stacks, responsibilities, and hard keywords from job descriptions.
   - Computes an **ATS Match Score (0–100%)** and visualizes matched vs. missing skills.
   - Intelligently swaps candidate projects from a modular catalog (AlphaPulse, CloudGuard, InstantService, Subscription Tracker).
   - Automatically injects action verbs and compiles clean, single-page LaTeX PDFs (`shamir_khan_swe_resume.tex`).

3. **✍️ Authentic Human Cover Letters & Q&A Generator:**
   - Powered by Gemini 3.8 Flash to write personalized, non-generic cover letters.
   - Generates both High-Impact (150 words) and Ultra-Punchy (< 100 words) answers to tricky application portal questions.

4. **🤖 Playwright Autonomous Application Engine:**
   - Launches an anti-detection Chromium browser instance.
   - Automatically maps and populates candidate profile fields (Name, Email, Phone, LinkedIn, GitHub, University, Canadian Work Authorization).
   - Attaches the newly tailored PDF resume directly to file upload inputs.
   - Human-in-the-loop review mode allows visual verification before final submission.

---

## ⚡ Quick Start

### 1. Launch Agent (1-Click)
Double-click `START_AGENT.bat` or run:
```bash
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8500 --reload
```
Open **[http://localhost:8500](http://localhost:8500)** in your browser.

---

## 🛠️ Tech Stack
- **Backend:** Python 3.13, FastAPI, Uvicorn, Pydantic
- **AI Intelligence:** Google Gemini 3.8 Flash, PyPDF
- **Browser Automation:** Playwright (Chromium)
- **Frontend UI:** Vanilla JavaScript (ES6+), HTML5, CSS3 Glassmorphism
