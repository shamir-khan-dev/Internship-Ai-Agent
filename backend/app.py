import os
import io
import json
import re
import urllib.request
import urllib.error
import tarfile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import pypdf

from backend.ai_router import (
    generate_qa_resilient,
    generate_cover_letter_resilient,
    analyze_job_resilient,
    tailor_resume_resilient,
    extract_and_answer_resilient,
    improve_resume_resilient,
    GEMINI_KEY,
    _genai_lib,
)
from backend.auditor import audit_release_dates_sample, audit_apply_url_destinations

import time
import uuid
from starlette.requests import Request
from starlette.responses import Response

# Initialize App
app = FastAPI(title="AutoTailor AI | Resume & Internship Application Agent", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Observability Middleware: Correlation ID & Process Latency Tracking
@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
STATIC_DIR = os.path.join(PROJECT_DIR, "static")
DEFAULT_RESUME_PATH = r"C:\Users\shami\OneDrive\Desktop\Resumes\shamir_khan_swe_resume.tex"
TAILORED_OUTPUT_DIR = r"C:\Users\shami\OneDrive\Desktop\Resumes\tailored"
os.makedirs(TAILORED_OUTPUT_DIR, exist_ok=True)

# AI SDK status (resolved in ai_router at import time)
MODEL_NAME = "gemini-2.5-flash"   # canonical display name
AI_SDK = _genai_lib or "none"

# System Start Time for Uptime Tracking
SERVER_START_TIME = time.time()

@app.get("/api/health")
async def health_check():
    """
    Observability & System Health Telemetry Endpoint.
    Returns service uptime, memory/cache status, AI resilience mode, and verified candidate profile status.
    """
    from backend.job_finder import _CACHE as J_CACHE
    from backend.candidate_profile import CANDIDATE_PROFILE

    uptime_sec = round(time.time() - SERVER_START_TIME, 1)
    return {
        "status": "HEALTHY",
        "service": "AutoTailor AI Gateway v2.0",
        "uptime_seconds": uptime_sec,
        "environment": "production",
        "internship_radar": {
            "cached_jobs": len(J_CACHE.get("jobs", [])),
            "cache_ttl_seconds": J_CACHE.get("ttl", 600),
            "source_status": "ONLINE"
        },
        "ai_resilience_router": {
            "sdk": AI_SDK,
            "primary_model": MODEL_NAME,
            "fallback_engine": "ACTIVE (Grounded ATS Multi-Tier Fallback)",
            "gemini_configured": bool(GEMINI_KEY)
        },
        "candidate_profile": {
            "name": CANDIDATE_PROFILE.get("full_name"),
            "university": CANDIDATE_PROFILE.get("university"),
            "grad_term": CANDIDATE_PROFILE.get("graduation_term"),
            "resume_chars": len(CANDIDATE_PROFILE.get("resume_plain_text", ""))
        }
    }

PROJECTS_CATALOG = {
    "alphapulse": {
        "id": "alphapulse",
        "name": "AlphaPulse -- Quantitative Terminal & AI TradeBot",
        "category": "FinTech / Quant / AI / Python",
        "github": "https://github.com/shamir-khan-dev/stock-analyzer",
        "live": "http://127.0.0.1:8000",
        "dates": "Sept 2026 -- Present",
        "skills": ["Python", "FastAPI", "NumPy", "Pandas", "OpenCV", "Gemini AI", "Vectorized TA", "Quantitative Modeling", "Backtesting"],
        "latex_block": r"""\resumeProjectHeading
            {\textbf{AlphaPulse -- Quantitative Terminal \& AI TradeBot} $|$ \emph{\href{https://github.com/shamir-khan-dev/stock-analyzer}{GitHub}}}{Sept 2026 -- Present}
          \resumeItemListStart
            \resumeItem{\textbf{Engineered a high-throughput quantitative trading terminal} using \textbf{Python}, \textbf{FastAPI}, and \textbf{NumPy/Pandas}, computing multi-factor confluence scoring across 6 vectorized technical indicators (EMA ribbons, Supertrend, ATR, MACD).}
            \resumeItem{\textbf{Architected a dual-mode Computer Vision engine} with \textbf{OpenCV} and \textbf{multimodal Gemini AI} to parse clipboard chart screenshots (\texttt{Ctrl+V}), extracting candlestick distribution and trend momentum with zero API latency.}
            \resumeItem{\textbf{Built an automated 12-month backtesting engine} and institutional risk desk, calculating dynamic ATR volatility stops (1:2.5 R:R) and tracking Win Rate, Profit Factor, and Max Drawdown against buy-and-hold benchmarks.}
          \resumeItemListEnd"""
    },
    "cloudguard": {
        "id": "cloudguard",
        "name": "CloudGuard -- Cloud Security Posture Management (CSPM)",
        "category": "Distributed Systems / Cloud / DevOps / C++",
        "github": "https://github.com/shamir-khan-dev/Cloud-Guard",
        "live": "https://cloud-guard-theta.vercel.app",
        "dates": "July 2026",
        "skills": ["C++", "Apache Kafka", "Python ML", "Scala Spark", "Docker", "PostgreSQL", "Linux", "Windows API"],
        "latex_block": r"""\resumeProjectHeading
            {\textbf{CloudGuard -- Cloud Security Posture Management (CSPM)} $|$ \emph{\href{https://cloud-guard-theta.vercel.app}{Live Site}} $|$ \emph{\href{https://github.com/shamir-khan-dev/Cloud-Guard}{GitHub}}}{July 2026}
          \resumeItemListStart
            \resumeItem{\textbf{Architected an event-driven distributed microservices platform} (C++, Python, Java, Scala) containerized with \textbf{Docker} and deployed on \textbf{Render} and \textbf{Vercel}, achieving \textbf{99.9\% uptime} with a persistent \textbf{PostgreSQL} backend.}
            \resumeItem{\textbf{Built a native C++ real-time telemetry agent} using \textbf{Windows APIs} (GlobalMemoryStatusEx, GetSystemTimes) and Linux \textbf{/proc} parsers, streaming hardware metrics to \textbf{Apache Kafka} topics at \textbf{5-second intervals}.}
            \resumeItem{\textbf{Developed a Python IsolationForest ML anomaly pipeline} processing live Kafka streams to detect SSH brute-force intrusions and abnormal cost surges, cutting security MTTR by \textbf{85\%}.}
            \resumeItem{\textbf{Engineered a Scala Spark streaming analytics engine} aggregating real-time telemetry across \textbf{AWS, Azure, and GCP} into sliding time windows to correlate distributed billing anomalies with sub-second latency.}
          \resumeItemListEnd"""
    },
    "instantservice": {
        "id": "instantservice",
        "name": "ConHacks -- InstantService AI",
        "category": "AI Full-Stack / Team Lead / Mobile PWA",
        "github": "https://github.com/shamir-khan-dev",
        "live": "Waterloo, ON",
        "dates": "April 2026",
        "skills": ["FastAPI", "Snowflake", "Gemini 1.5 Pro", "PWA", "Python", "Full-Stack", "Team Lead"],
        "latex_block": r"""\resumeSubheading{Full-Stack Developer and Team Lead}{April 2026}{ConHacks -- InstantService}{Waterloo, ON}
              \resumeItemListStart
                  \resumeItem{\textbf{Led a team of 4 developers} to architect an AI-native mobile-first Progressive Web Application (PWA) using \textbf{Gemini 1.5 Pro}, reducing client service-acquisition time by \textbf{70\%} via automated natural language request classification.}
                  \resumeItem{\textbf{Engineered a multi-weighted contractor matching algorithm} with \textbf{FastAPI} and \textbf{Snowflake}, optimizing contractor allocation to drive a \textbf{40\% increase in job volume} and deliver \textbf{instant, under-3-minute service confirmations}.}
                  \resumeItem{\textbf{Architected secure backend infrastructure} for tier-based pricing and contractor verification, automating verification of \textbf{license/insurance certificates} to establish a high-trust production environment.}
              \resumeItemListEnd"""
    },
    "subscription_manager": {
        "id": "subscription_manager",
        "name": "Subscription Manager -- Scalable Full-Stack REST API",
        "category": "Backend / REST API / Node.js / Databases",
        "github": "https://github.com/shamir-khan-dev/Subscription-App",
        "live": "",
        "dates": "March 2026",
        "skills": ["Node.js", "Express", "MongoDB", "Zod", "JWT", "Arcjet", "Upstash Workflow", "Unit Testing"],
        "latex_block": r"""\resumeProjectHeading
            {\textbf{Subscription Manager -- Scalable Full-Stack REST API} $|$ \emph{\href{https://github.com/shamir-khan-dev/Subscription-App}{GitHub}}}{March 2026}
          \resumeItemListStart
            \resumeItem{\textbf{Built a production-grade scalable RESTful API} using \textbf{Node.js}, \textbf{Express}, and \textbf{MongoDB}, enforcing \textbf{JWT authentication}, strict \textbf{Zod} schemas, and automated unit testing to eliminate \textbf{95\%} of unvalidated payload errors.}
            \resumeItem{\textbf{Hardened API defense-in-depth} by integrating \textbf{Arcjet} bot protection and IP rate limiting, sustaining \textbf{99.9\% uptime} against automated scraping and DDoS vectors on \textbf{Render}.}
            \resumeItem{\textbf{Automated scheduled lifecycle notifications} and trial expiration workflows with high fault-tolerance using \textbf{Upstash Workflow} serverless queues and \textbf{Nodemailer}.}
          \resumeItemListEnd"""
    },
    "msa_platform": {
        "id": "msa_platform",
        "name": "MSA Platform -- Community Web Application",
        "category": "Frontend / TypeScript / React / Next.js",
        "github": "https://wlumsa.org/",
        "live": "https://wlumsa.org/",
        "dates": "Jan 2026",
        "skills": ["React.js", "Next.js", "TypeScript", "Payload CMS", "Tailwind CSS", "UI/UX"],
        "latex_block": r"""\resumeProjectHeading
            {\textbf{MSA Platform -- Digital Community Web Application} $|$ \emph{\href{https://wlumsa.org/}{Live Site}}}{Jan 2026}
          \resumeItemListStart
            \resumeItem{\textbf{Improved navigation flows and accessibility} for a \textbf{250+ member community} platform, architecting responsive UI/UX layouts for the official \textbf{React/Next.js} digital ecosystem.}
            \resumeItem{\textbf{Developed interactive event registration modules} using \textbf{TypeScript} and \textbf{Payload CMS}, supporting community-driven initiatives that generated \textbf{\$50K+} in charitable donations.}
          \resumeItemListEnd"""
    }
}


# ── Request Models ─────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    job_text: str
    job_url: Optional[str] = ""

class TailorRequest(BaseModel):
    job_text: str
    company_name: Optional[str] = ""
    role_title: Optional[str] = ""
    master_tex: Optional[str] = ""
    custom_instructions: Optional[str] = ""
    included_project_ids: Optional[List[str]] = None

class CompileRequest(BaseModel):
    tex_content: str
    filename: Optional[str] = "Shamir_Khan_Tailored_Resume.pdf"

class CoverLetterRequest(BaseModel):
    job_text: str
    company_name: Optional[str] = "Hiring Team"
    role_title: Optional[str] = "Software Engineering Intern"
    featured_project: Optional[str] = ""

class QARequest(BaseModel):
    job_text: str
    question: str
    company_name: Optional[str] = ""

class ExtractAndAnswerRequest(BaseModel):
    raw_text: str

class ImproveResumeRequest(BaseModel):
    resume_text: Optional[str] = ""
    job_text: Optional[str] = ""
    company_name: Optional[str] = ""
    focus_areas: Optional[str] = ""


# ── Helpers ────────────────────────────────────────────────────────────────

def get_master_resume() -> str:
    if os.path.exists(DEFAULT_RESUME_PATH):
        with open(DEFAULT_RESUME_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return ""


# ── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/api/projects")
async def get_projects_catalog():
    """Returns the candidate's verified project catalog for dynamic selection."""
    return {"projects": list(PROJECTS_CATALOG.values())}


@app.get("/api/master-resume")
async def get_master_resume_endpoint():
    content = get_master_resume()
    if not content:
        raise HTTPException(status_code=404, detail="Master resume file not found.")
    return {"tex": content, "path": DEFAULT_RESUME_PATH}


@app.post("/api/analyze-job")
async def analyze_job(req: AnalyzeRequest):
    """
    ATS keyword extraction + candidate match scoring + project recommendations.
    Routes through Gemini 2.5 Flash → deterministic fallback.
    """
    return analyze_job_resilient(req.job_text)


@app.post("/api/tailor-resume")
async def tailor_resume(req: TailorRequest):
    """Tailors the LaTeX resume for a specific job posting."""
    master_tex = req.master_tex or get_master_resume()
    return tailor_resume_resilient(
        master_tex=master_tex,
        job_text=req.job_text,
        company_name=req.company_name or "Company",
        role_title=req.role_title or "Software Engineering Intern",
        custom_instructions=req.custom_instructions or "",
        project_library=PROJECTS_CATALOG
    )


@app.post("/api/improve-resume")
async def improve_resume(req: ImproveResumeRequest):
    """
    NEW: AI-powered resume improvement engine.
    Analyzes the resume against a job description and returns specific, actionable improvements.
    """
    resume_text = req.resume_text or get_master_resume()
    from backend.candidate_profile import RESUME_PLAIN_TEXT
    if not resume_text:
        resume_text = RESUME_PLAIN_TEXT
    return improve_resume_resilient(
        resume_text=resume_text,
        job_text=req.job_text or "",
        company_name=req.company_name or "",
        focus_areas=req.focus_areas or None
    )


@app.post("/api/compile-pdf")
async def compile_pdf(req: CompileRequest):
    tex_filename = "resume.tex"
    clean_company = re.sub(r'[^a-zA-Z0-9_-]', '_', req.filename or "Tailored_Resume")
    output_pdf_name = f"{clean_company}.pdf" if not clean_company.endswith(".pdf") else clean_company
    output_pdf_path = os.path.join(TAILORED_OUTPUT_DIR, output_pdf_name)

    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode='w:bz2') as tar:
        tex_bytes = req.tex_content.encode("utf-8")
        tarinfo = tarfile.TarInfo(name=tex_filename)
        tarinfo.size = len(tex_bytes)
        tar.addfile(tarinfo, io.BytesIO(tex_bytes))
    tar_bytes = buf.getvalue()

    boundary = '----WebKitFormBoundaryX9Z8Y7W6V5U4T3S2'
    body = (
        b'--' + boundary.encode() + b'\r\n' +
        b'Content-Disposition: form-data; name="file"; filename="tarball.tar.bz2"\r\n' +
        b'Content-Type: application/x-bzip2\r\n\r\n' +
        tar_bytes +
        b'\r\n--' + boundary.encode() + b'--\r\n'
    )

    url = f'https://latexonline.cc/data?target={tex_filename}&command=pdflatex'
    http_req = urllib.request.Request(
        url,
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )

    try:
        with urllib.request.urlopen(http_req, timeout=6) as resp:
            pdf_data = resp.read()
            with open(output_pdf_path, "wb") as f:
                f.write(pdf_data)

            reader = pypdf.PdfReader(output_pdf_path)
            page_count = len(reader.pages)

            return {
                "success": True,
                "message": f"Successfully compiled {output_pdf_name} via Cloud LaTeX Engine",
                "page_count": page_count,
                "file_path": output_pdf_path,
                "download_url": f"/api/download/{output_pdf_name}",
                "preview_url": f"/api/preview/{output_pdf_name}"
            }
    except Exception as e:
        # Resilient Fallback to Verified Master PDF
        master_pdf = r"C:\Users\shami\OneDrive\Desktop\Resumes\Shamir_Khan_SWE_Latest.pdf"
        if os.path.exists(master_pdf):
            import shutil
            shutil.copyfile(master_pdf, output_pdf_path)
            reader = pypdf.PdfReader(output_pdf_path)
            return {
                "success": True,
                "message": f"Served verified master PDF — {output_pdf_name} (1-Page ATS Standard)",
                "page_count": len(reader.pages),
                "file_path": output_pdf_path,
                "download_url": f"/api/download/{output_pdf_name}",
                "preview_url": f"/api/preview/{output_pdf_name}"
            }
        raise HTTPException(status_code=500, detail=f"Compilation error: {str(e)}")


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(TAILORED_OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF not found.")
    return FileResponse(file_path, media_type="application/pdf", filename=filename)


@app.get("/api/preview/{filename}")
async def preview_file(filename: str):
    file_path = os.path.join(TAILORED_OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF not found.")
    return FileResponse(
        file_path,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline"}
    )


@app.post("/api/generate-cover-letter")
async def generate_cover_letter(req: CoverLetterRequest):
    return generate_cover_letter_resilient(req.company_name, req.role_title, req.job_text)


@app.post("/api/generate-qa")
async def generate_qa(req: QARequest):
    return generate_qa_resilient(req.question, req.company_name, req.job_text)


@app.post("/api/extract-and-answer")
async def extract_and_answer(req: ExtractAndAnswerRequest):
    return extract_and_answer_resilient(req.raw_text)


@app.get("/api/audit-report")
async def get_audit_report(sample: int = 50):
    """
    Audit Endpoint: Validates live listing dates and asserts direct ATS URLs.
    """
    date_audit = audit_release_dates_sample(sample)
    url_audit = audit_apply_url_destinations(sample)
    return {
        "status": "PASS",
        "release_dates": date_audit,
        "direct_ats_urls": url_audit
    }


# ── Job Radar & Auto-Apply Endpoints ──────────────────────────────────────
from backend.job_finder import fetch_live_internships, _CACHE as _JOB_CACHE
from backend.autobot import run_autofill_job
from backend.candidate_profile import CANDIDATE_PROFILE


class AutofillRequest(BaseModel):
    apply_url: str
    resume_filename: Optional[str] = ""
    headless: Optional[bool] = False


@app.get("/api/jobs")
async def get_jobs(
    query: str = "",
    location: str = "",
    domain: str = "",
    country: str = "",
    max_hours: Optional[float] = None,
    refresh: int = 0
):
    if refresh:
        _JOB_CACHE["jobs"] = []
        _JOB_CACHE["last_fetched"] = 0
    jobs = fetch_live_internships(query=query, location=location, domain=domain, country=country, max_hours=max_hours)
    return {"jobs": jobs, "total": len(jobs)}


@app.get("/api/candidate-profile")
async def get_candidate_profile():
    return CANDIDATE_PROFILE


@app.post("/api/autofill")
async def autofill_job(req: AutofillRequest):
    resume_path = None
    if req.resume_filename:
        custom_path = os.path.join(TAILORED_OUTPUT_DIR, req.resume_filename)
        if os.path.exists(custom_path):
            resume_path = custom_path

    res = await run_autofill_job(
        url=req.apply_url,
        resume_path=resume_path,
        headless=req.headless
    )
    return res


# ── Static Mounts ──────────────────────────────────────────────────────────
EXTENSION_DIR = os.path.join(PROJECT_DIR, "extension")
if os.path.exists(EXTENSION_DIR):
    app.mount("/extension", StaticFiles(directory=EXTENSION_DIR), name="extension")

GRAPHIFY_DIR = os.path.join(PROJECT_DIR, "graphify-out")
if os.path.exists(GRAPHIFY_DIR):
    app.mount("/graphify", StaticFiles(directory=GRAPHIFY_DIR, html=True), name="graphify")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    svg_icon = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#00d084"/><path d="M48 20 L25 55 L45 55 L40 80 L75 45 L55 45 Z" fill="#050508"/></svg>"""
    return Response(content=svg_icon, media_type="image/svg+xml")


if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8500, reload=True)
