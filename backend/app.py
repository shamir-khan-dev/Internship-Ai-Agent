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
import google.generativeai as genai
import pypdf

# Initialize App
app = FastAPI(title="AutoTailor AI | Resume & Internship Application Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
STATIC_DIR = os.path.join(PROJECT_DIR, "static")
DEFAULT_RESUME_PATH = r"C:\Users\shami\OneDrive\Desktop\Resumes\shamir_khan_swe_resume.tex"
TAILORED_OUTPUT_DIR = r"C:\Users\shami\OneDrive\Desktop\Resumes\tailored"
os.makedirs(TAILORED_OUTPUT_DIR, exist_ok=True)

# Load API Key
ENV_PATH = os.path.join(PROJECT_DIR, ".env")
GEMINI_KEY = None
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                GEMINI_KEY = line.strip().split("=", 1)[1].strip()

if not GEMINI_KEY:
    GEMINI_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

MODEL_NAME = "gemini-3.8-flash"

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

def get_master_resume():
    if os.path.exists(DEFAULT_RESUME_PATH):
        with open(DEFAULT_RESUME_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def clean_json_str(text: str):
    text = text.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return text

@app.get("/api/projects")
async def get_projects_catalog():
    """Returns the candidate's verified project catalog for dynamic selection."""
    return {
        "projects": list(PROJECTS_CATALOG.values())
    }

@app.get("/api/master-resume")
async def get_master_resume_endpoint():
    content = get_master_resume()
    if not content:
        raise HTTPException(status_code=404, detail="Master resume file not found.")
    return {"tex": content, "path": DEFAULT_RESUME_PATH}

@app.post("/api/analyze-job")
async def analyze_job(req: AnalyzeRequest):
    if not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")
    
    master_resume = get_master_resume()
    projects_summary = "\n".join([
        f"- {p['id']}: {p['name']} ({', '.join(p['skills'])})" for p in PROJECTS_CATALOG.values()
    ])
    
    prompt = f"""
You are an expert ATS Screener and Principal Tech Recruiter.
Analyze this Job Posting against the Candidate's Master Profile and Portfolio Projects.

Candidate's Projects Library:
{projects_summary}

Candidate's Current Master Resume:
```latex
{master_resume}
```

Job Posting:
```
{req.job_text}
```

Provide the output as JSON with this exact schema:
{{
  "company_name": "Company Name",
  "role_title": "Role Title",
  "location": "Location / Remote status",
  "term": "Work term (e.g. Winter 2027, Summer 2027, 4/8/12/16 months)",
  "match_score": 75,
  "matched_keywords": ["Python", "Docker", "PostgreSQL"],
  "missing_keywords": ["Go", "Kubernetes", "GraphQL"],
  "recommended_projects": ["alphapulse", "cloudguard", "instantservice"],
  "top_priorities": ["Highlight low-latency streaming", "Emphasize quantitative or distributed systems"],
  "recruiter_insights": "Brief 2-3 sentence strategic advice on how to stand out."
}}
"""
    try:
        model = genai.GenerativeModel(
            MODEL_NAME, 
            generation_config={"response_mime_type": "application/json"}
        )
        res = model.generate_content(prompt)
        data = json.loads(clean_json_str(res.text))
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")

@app.post("/api/tailor-resume")
async def tailor_resume(req: TailorRequest):
    if not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")
    
    master_tex = req.master_tex or get_master_resume()
    
    # Format project options
    projects_desc = ""
    for pid, pdata in PROJECTS_CATALOG.items():
        projects_desc += f"\n--- PROJECT ID: {pid} ---\n{pdata['latex_block']}\n"

    prompt = f"""
You are a Staff Technical Recruiter and LaTeX ATS Specialist.
Tailor the Candidate's LaTeX resume specifically for the target job posting.

CANDIDATE'S VERIFIED PROJECT LIBRARY:
{projects_desc}

CRITICAL RULES:
1. NEVER fabricate fake companies, degrees, or experiences. Only select, re-weight, re-frame, or re-order real achievements from the project library above and the Riipen Labs healthcare experience.
2. PROJECT SELECTION: Select the top 2-3 most relevant projects from the library that directly maximize ATS keywords for this specific role. (e.g., if FinTech, Quant, Data Science, Python, or Computer Vision: include 'alphapulse'; if Distributed Systems, Cloud, C++, or Kafka: include 'cloudguard'; if Node.js/Full-Stack/REST: include 'subscription_manager' or 'instantservice').
3. SKILLS & COURSEWORK: Front-load the technical skills and coursework that the company asks for (e.g. if company wants Java, put Java first; if C++, put C++ first; if React, put React first; if Python/NumPy, put Python first).
4. BULLET POINTS: Tune bullet phrasing to incorporate keywords from the job description while preserving honest metrics.
5. PRESERVE LaTeX Preamble, formatting, margins, and commands. Make sure every `\\begin{{itemize}}` closes with `\\resumeItemListEnd` or `\\end{{itemize}}`.
6. STRICT 1-PAGE CONSTRAINT: Keep spacing and bullet count strictly balanced so it compiles to EXACTLY 1 page (no 2nd page spillover).
7. Provide output in JSON format with:
{{
  "selected_project_ids": ["alphapulse", "cloudguard", "instantservice"],
  "tailored_tex": "the complete updated LaTeX code string",
  "changes_made": [
    "Swapped in AlphaPulse Quantitative Terminal to highlight Python, OpenCV, and NumPy...",
    "Re-ordered technical skills to prioritize Python, Docker, and FastAPI...",
    "Emphasized distributed event streaming in CloudGuard..."
  ],
  "projected_ats_score": 94
}}

Candidate's Current Master LaTeX:
```latex
{master_tex}
```

Target Company: {req.company_name}
Target Role: {req.role_title}
Job Posting:
```
{req.job_text}
```

Additional User Instructions:
{req.custom_instructions or "None"}
"""
    try:
        model = genai.GenerativeModel(
            MODEL_NAME,
            generation_config={"response_mime_type": "application/json"}
        )
        res = model.generate_content(prompt)
        data = json.loads(clean_json_str(res.text))
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Tailoring failed: {str(e)}")

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
        with urllib.request.urlopen(http_req, timeout=90) as resp:
            pdf_data = resp.read()
            with open(output_pdf_path, "wb") as f:
                f.write(pdf_data)
            
            reader = pypdf.PdfReader(output_pdf_path)
            page_count = len(reader.pages)
            
            return {
                "success": True,
                "message": f"Successfully compiled {output_pdf_name}",
                "page_count": page_count,
                "file_path": output_pdf_path,
                "download_url": f"/api/download/{output_pdf_name}",
                "preview_url": f"/api/preview/{output_pdf_name}"
            }
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', 'ignore')
        raise HTTPException(status_code=400, detail=f"LaTeX compilation failed:\n{err[:1500]}")
    except Exception as e:
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
    if not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")
    
    prompt = f"""
Write an authentic, high-impact, human cover letter for Shamir Khan applying to {req.company_name} for the {req.role_title} role.

Candidate Context:
- Shamir Khan, Computer Science student at Wilfrid Laurier University
- Real Projects:
  1. CloudGuard (real-time telemetry in C++ using OS APIs streaming to Apache Kafka, Python IsolationForest ML anomaly pipeline, Scala Spark distributed analytics, PostgreSQL, Docker, Render/Vercel with 99.9% uptime).
  2. ConHacks Team Lead (InstantService - AI-native PWA with Gemini 1.5 Pro, multi-weighted matching algorithm with FastAPI and Snowflake, 70% time reduction).
  3. Subscription Manager (scalable MVC REST API with Node.js, Express, MongoDB, Zod validation, JWT, Arcjet bot protection, Upstash serverless queues).
  4. The J Healthcare Initiative via Riipen Labs (Operations & Technical Lead, self-guided triage workflow cutting discovery to under 3 clicks).
- Style: Grounded, conversational, direct, energetic, professional. Avoid stiff corporate clichés like "I am writing with great pleasure to express my profound interest". Show true engineering passion and specific alignment with what {req.company_name} builds.
- Include contact details at the bottom: Shamir Khan, Kitchener ON, shamirk2121@gmail.com, (647) 606-6063, LinkedIn & GitHub links.

Job Description:
```
{req.job_text}
```

Output ONLY the plain text cover letter (copy-paste ready).
"""
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        res = model.generate_content(prompt)
        return {"cover_letter": res.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")

@app.post("/api/generate-qa")
async def generate_qa(req: QARequest):
    if not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")
    
    prompt = f"""
You are helping Shamir Khan answer an application or interview question for {req.company_name or 'the company'}.

Candidate Profile:
- Computer Science at Wilfrid Laurier University
- Real Projects: AlphaPulse (Python, FastAPI, OpenCV, NumPy, Quantitative Terminal), CloudGuard (C++, Kafka, Python ML, Spark, PostgreSQL), ConHacks (FastAPI, Snowflake, Gemini AI), Subscription Manager (Node.js, Express, MongoDB).
- Tone: High-energy, authentic, confident, technically grounded, zero fluff.

Application Question:
"{req.question}"

Target Job Description Context:
```
{req.job_text}
```

Provide 2 tailored variations:
1. High-Impact & Direct (Concise, 150-200 words)
2. Ultra-Punchy (Under 100 words, great for short text fields)
"""
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        res = model.generate_content(prompt)
        return {"answer": res.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QA generation failed: {str(e)}")

# --- Job Radar & Auto-Apply Endpoints ---
from backend.job_finder import fetch_live_internships, _CACHE as _JOB_CACHE
from backend.autobot import run_autofill_job
from backend.candidate_profile import CANDIDATE_PROFILE

class AutofillRequest(BaseModel):
    apply_url: str
    resume_filename: Optional[str] = ""
    headless: Optional[bool] = False

@app.get("/api/jobs")
async def get_jobs(query: str = "", location: str = "", domain: str = "", country: str = "", max_hours: Optional[float] = None, refresh: int = 0):
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

# Mount Static Files
if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8500, reload=True)

