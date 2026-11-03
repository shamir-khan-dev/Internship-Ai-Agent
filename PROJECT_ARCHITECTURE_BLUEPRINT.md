# AutoTailor AI — Project Architecture Blueprint
*Generated via `architecture-blueprint-generator` Skill (Amazon-Grade Engineering Standard)*

---

## 1. System Overview & Technology Stack

AutoTailor AI is an autonomous internship discovery, resume tailoring, and multi-ATS application auto-pilot engineered for software engineering candidates (targeting Summer/Winter 2027 technical internships).

```mermaid
graph TB
    subgraph ClientLayer ["Client Layer (Presentation & Interaction)"]
        UI["Web Dashboard (Vanilla JS + CSS Glassmorphism)"]
        Ext["Chrome Extension (JobRight & Simplify Hybrid Engine)"]
    end

    subgraph GatewayLayer ["API Gateway & Core Middleware (FastAPI)"]
        App["FastAPI Server (Port 8500)"]
        Middleware["Observability & Correlation Middleware (X-Request-ID, Latency)"]
        CORS["CORS & Security Boundaries"]
    end

    subgraph ServiceLayer ["Autonomous Services & Engines"]
        Radar["Job Finder & Direct ATS Scraper (job_finder.py)"]
        AIRouter["Multi-Provider AI Resilience Gateway (ai_router.py)"]
        Autobot["Playwright Bot Engine (autobot.py)"]
        Auditor["Date & Direct Link Auditor (auditor.py)"]
        Profile["Grounded Candidate Store (candidate_profile.py)"]
    end

    subgraph ExternalSystems ["External Upstream & ATS Destinations"]
        GitHubFeeds["GitHub Live Repositories (SimplifyJobs & pittcsc)"]
        GeminiCloud["Google Gemini Cloud (gemini-3.8-flash)"]
        OpenRouter["Open Provider Inference Fallback"]
        TargetATS["Enterprise ATS (Greenhouse, Workday, Lever, Ashby, Taleo)"]
    end

    UI --> GatewayLayer
    Ext --> GatewayLayer
    GatewayLayer --> Radar
    GatewayLayer --> AIRouter
    GatewayLayer --> Autobot
    GatewayLayer --> Auditor
    GatewayLayer --> Profile

    Radar --> GitHubFeeds
    AIRouter --> GeminiCloud
    AIRouter --> OpenRouter
    Autobot --> TargetATS
```

---

## 2. Layered Architecture & Subsystem Responsibilities

| Subsystem | Primary Module | Core Responsibility | Failure Mode & Recovery |
| :--- | :--- | :--- | :--- |
| **Presentation Tier** | `static/index.html`, `static/app.js`, `static/style.css` | Apple Keynote/JobRight responsive dashboard, client filter engine (0ms latency), dynamic state indicators. | Client-side memory caching with graceful fallback empty states. |
| **Extension Engine** | `extension/content.js`, `extension/popup.js`, `extension/manifest.json` | In-page DOM observer on active ATS tabs, auto-pilot form fill, plain-text resume insertion. | Non-blocking observer; works offline from local candidate storage. |
| **API Gateway** | `backend/app.py` | Routing, request correlation IDs, latency measurement, static file distribution. | Global exception handlers with structured JSON errors (no 500 crashes). |
| **AI Resilience Router** | `backend/ai_router.py` | 3-tiered AI generation gateway (Gemini Flash ➔ Open Inference ➔ Deterministic Grounded ATS). | Circuit-breaker with 4s timeouts; always returns 200 OK. |
| **Internship Radar** | `backend/job_finder.py` | Live upstream markdown scraping, URL sanitization, relative date math, SWE domain tagging. | 10-minute in-memory caching with graceful fallbacks on network drop. |
| **Automated Auditor** | `backend/auditor.py` | Real-time date accuracy verification and 100% direct ATS destination link assertion. | Sampled statistical audits with JSON telemetry reporting. |
| **Headless Playwright Bot** | `backend/autobot.py` | Programmatic ATS field detection, multi-page form stepping, file upload injection. | Heuristic selector cascade; logs all actions to visual screenshots. |

---

## 3. Data Flow Architecture

### A. Live Internship Feed & Filter Pipeline
```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate (Shamir)
    participant UI as Dashboard (app.js)
    participant API as FastAPI Gateway
    participant Radar as job_finder.py
    participant Upstream as GitHub Repositories

    User->>UI: Selects "Track: Backend & Systems"
    alt Client Cache Warm
        UI->>UI: Filters 1,676 cached jobs in memory (0ms)
        UI->>User: Displays 82 Backend roles + active banner
    else Refresh Requested
        UI->>API: GET /api/jobs?domain=backend
        API->>Radar: fetch_live_internships(domain="backend")
        Radar->>Upstream: Scrapes Summer 2026/2027 feeds
        Upstream-->>Radar: Raw markdown tables
        Radar->>Radar: clean_direct_url() + detect_ats_source() + calculate_time_metrics()
        Radar-->>API: 100% Direct ATS & SWE Cleaned Jobs
        API-->>UI: Filtered JSON Array
        UI->>User: Renders Job Cards with Match Badges
    end
```

### B. Multi-Provider AI Resilience Flow (Zero 500 Crash)
```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Browser / Extension
    participant API as FastAPI (/api/generate-qa)
    participant Router as ai_router.py
    participant Gemini as Google Gemini 3.8
    participant OpenAI as Free Open Provider
    participant Rules as Grounded ATS Engine

    Candidate->>API: POST /api/generate-qa (Question: "Why IBM?")
    API->>Router: generate_qa_resilient()
    
    activate Router
    Router->>Gemini: Request (4.0s timeout)
    alt Gemini Success
        Gemini-->>Router: Model Output
        Router-->>API: Response (provider: "Gemini 3.8 Flash")
    else Gemini Rate-Limited (429) or Network Timeout
        Router->>OpenAI: Failover to Open Provider
        alt Open Provider Success
            OpenAI-->>Router: Model Output
            Router-->>API: Response (provider: "Open AI Free Tier")
        else All External APIs Offline / Quota Exhausted
            Router->>Rules: Synthesize Portfolio-Grounded Answer
            Rules-->>Router: Factual response citing CloudGuard, ConHacks, AlphaPulse
            Router-->>API: Response (provider: "Grounded ATS Deterministic Engine")
        end
    end
    deactivate Router

    API-->>Candidate: 200 OK (Instant, tailored answer)
```

---

## 4. Cross-Cutting Concerns & Security Boundaries

1. **Security & Data Sanitization**:
   - Zero hardcoded credentials committed to public repos (managed via local `.env`).
   - URLs sanitized with `clean_direct_url()` to strip tracking cookies and redirect tokens.
   - PII strictly preserved on local machine (`candidate_profile.py`).
2. **Observability**:
   - Every request is stamped with a unique `X-Request-ID`.
   - Process duration measured and returned via `X-Process-Time` header.
3. **Extensibility & Standards**:
   - Compliant with **VoltAgent Awesome Agent Skills** guidelines.
   - Ready for containerization via Docker and CI/CD testing via GitHub Actions.
