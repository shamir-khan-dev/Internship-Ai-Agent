# Candidate Profile & Form Filling Metadata for Shamir Khan
import os

RESUME_PLAIN_TEXT = """SHAMIR KHAN
Ontario, Canada | (647)-606-6063 | shamirk2121@gmail.com
LinkedIn: linkedin.com/in/shamir-khan-40698123b | GitHub: github.com/shamir-khan-dev | Portfolio: shamir-khan-dev.github.io/Personal-Website/

EDUCATION
Wilfrid Laurier University | Waterloo, ON
Bachelor of Science in Computer Science | Expected April 2028 | GPA: 3.8 / 4.0
Relevant Coursework: Object-Oriented Programming (OOP), Data Structures & Algorithms, Software Engineering, Database Systems, Computer Networks, Systems Architecture, Computer Architecture, Discrete Mathematics

TECHNICAL EXPERIENCE
Operations and Technical Lead | The J Healthcare Initiative (via Riipen Labs) | Remote, ON | August 2026
• Led technical discovery and digital audits for a healthcare non-profit, analyzing user journeys and information architecture to eliminate critical navigation bottlenecks.
• Architected a self-guided triage workflow and restructured intake funnels, cutting resource discovery pathways to under 3 clicks to reduce bounce rates and cognitive friction.
• Authored a 30-60-90 day technical execution roadmap with zero additional tech spend, aligning native web tooling and non-profit grant allocations.

Full-Stack Developer and Team Lead | ConHacks -- InstantService | Waterloo, ON | April 2026
• Led a team of 4 developers to architect an AI-native mobile-first Progressive Web Application (PWA) using Gemini AI, reducing client service-acquisition time by 70% via automated natural language request classification.
• Engineered a multi-weighted contractor matching algorithm with FastAPI and Snowflake, optimizing contractor allocation to drive a 40% increase in job volume and deliver instant, under-3-minute service confirmations.
• Architected secure backend infrastructure for tier-based pricing and contractor verification, automating verification of license/insurance certificates.

HIGH-IMPACT PROJECTS
AlphaPulse -- Quantitative Terminal & AI TradeBot | Python, FastAPI, NumPy, Pandas, OpenCV, Gemini AI | Jan 2026 -- Present
• Engineered a high-throughput quantitative trading terminal using Python, FastAPI, and NumPy/Pandas, computing multi-factor confluence scoring across 6 vectorized technical indicators (EMA ribbons, Supertrend, ATR, MACD).
• Architected a dual-mode Computer Vision engine with OpenCV and multimodal Gemini AI to parse clipboard chart screenshots (Ctrl+V), extracting candlestick distribution and trend momentum with zero API latency.
• Built an automated 12-month backtesting engine and institutional risk desk, calculating dynamic ATR volatility stops (1:2.5 R:R) and tracking Win Rate, Profit Factor, and Max Drawdown against benchmarks.

CloudGuard -- Cloud Security Posture Management (CSPM) | C++, Python, Java, Scala, Docker, Kafka, PostgreSQL, ML | July 2026
• Architected an event-driven distributed microservices platform containerized with Docker and deployed on Render and Vercel, achieving 99.9% uptime with a persistent PostgreSQL backend.
• Built a native C++ real-time telemetry agent using Windows APIs (GlobalMemoryStatusEx, GetSystemTimes) and Linux /proc parsers, streaming hardware metrics to Apache Kafka topics at 5-second intervals.
• Developed a Python IsolationForest ML anomaly pipeline processing live Kafka streams to detect SSH brute-force intrusions and abnormal cost surges, cutting security MTTR by 85%.

MSA Platform -- Digital Community Web Application | Next.js, React, TypeScript, Payload CMS | Jan 2026
• Architected responsive digital community platform serving 250+ active members using Next.js, React, and TypeScript, optimizing navigation flows and live event schedules.
• Engineered dynamic donation and registration modules integrated with Payload CMS, supporting student initiatives that generated $50K+ in charitable contributions.

TECHNICAL SKILLS SUMMARY
Languages: Python, Java, C++, C, TypeScript, JavaScript, SQL, HTML/CSS, Scala, Kotlin
Frameworks & Libraries: React.js, Next.js, FastAPI, Node.js, Express, Spring Boot, Apache Spark, NumPy, Pandas, OpenCV, Tailwind CSS
Developer Tools & Cloud: Docker, Apache Kafka, Snowflake, PostgreSQL, MongoDB, Git, GitHub Actions, CI/CD Pipelines, Linux/Unix, Render, Vercel
Core Concepts: Computer Science Fundamentals, Software Development Life Cycle (SDLC), Agile Methodologies, Object-Oriented Programming (OOP), Systems Architecture, Unit Testing, Distributed Systems, Real-Time Technology, RESTful APIs, Quantitative Modeling, Multimodal AI
"""

CANDIDATE_PROFILE = {
    # Core Identity
    'first_name': 'Shamir',
    'last_name': 'Khan',
    'full_name': 'Shamir Khan',
    'email': 'shamirk2121@gmail.com',
    'phone': '(647) 606-6063',
    'phone_raw': '6476066063',
    'phone_country_code': '+1',
    'street_address': 'University Avenue West',
    'city': 'Waterloo',
    'alternate_city': 'Kitchener',
    'state_province': 'Ontario',
    'province_code': 'ON',
    'country': 'Canada',
    'country_code': 'CA',
    'postal_code': 'N2L 3C5',
    'address': 'Waterloo / Kitchener, ON, Canada',
    
    # Social / Links
    'linkedin': 'https://www.linkedin.com/in/shamir-khan-40698123b/',
    'github': 'https://github.com/shamir-khan-dev',
    'portfolio': 'https://shamir-khan-dev.github.io/Personal-Website/',
    'website': 'https://shamir-khan-dev.github.io/Personal-Website/',
    
    # Education
    'university': 'Wilfrid Laurier University',
    'school_location': 'Waterloo, Ontario, Canada',
    'degree': 'Bachelor of Science',
    'degree_type': 'Undergraduate / Bachelor',
    'discipline': 'Computer Science',
    'major': 'Computer Science',
    'gpa': '3.8',
    'gpa_scale': '4.0',
    'start_month': '09',
    'start_year': '2024',
    'graduation_month': '04',
    'graduation_month_name': 'April',
    'graduation_year': '2028',
    'grad_date': '04/2028',
    'current_year_of_study': '2nd Year',
    'is_credited_internship': True,
    'currently_enrolled': True,
    'education_level': "Bachelor's Degree",
    
    # Work Authorization & Legal
    'authorized_in_canada': True,
    'authorized_in_us': False,
    'requires_sponsorship': False,
    'require_visa_sponsorship': False,
    'work_auth_canada': True,
    'sponsorship_required': False,
    'will_relocate': True,
    'over_18': True,
    'notice_period': 'Available immediately for upcoming term',
    'can_commute_or_relocate': True,
    'sponsorship_answer': 'No',
    'work_auth_answer': 'Yes',
    
    # Demographics & EEO (Defaulting to preferred or decline to state)
    'gender': 'Male',
    'preferred_pronoun': 'He/Him',
    'preferred_language': 'English',
    'race_ethnicity': 'Asian / South Asian',
    'veteran_status': 'No / Not a protected veteran',
    'disability_status': 'No, I do not have a disability',
    'hear_about_us': 'Company Careers Website / GitHub Early Career Tech Repository',
    
    # Quick Text Snippets
    'elevator_pitch': 'Computer Science undergraduate at Wilfrid Laurier University with production experience building quantitative trading systems (Python/FastAPI/OpenCV) and distributed telemetry architectures (C++/Kafka/PostgreSQL). Passionate about high-throughput engineering and backend infrastructure.',
    'resume_plain_text': RESUME_PLAIN_TEXT.strip(),
    
    # Resume Paths
    'default_resume_pdf': r'C:\Users\shami\OneDrive\Desktop\Resumes\Shamir_Khan_SWE_Latest.pdf',
    'tailored_dir': r'C:\Users\shami\OneDrive\Desktop\Resumes\tailored'
}
