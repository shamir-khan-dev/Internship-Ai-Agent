// AutoTailor AI — Autonomous ATS Autofill & Career Agent (Content Script)
// Designed for Shamir Khan (Wilfrid Laurier University - Computer Science)
// Provides 1-Click multi-step autofill, auto-pilot monitoring, and AI question solving.

(function () {
    "use strict";

    // Prevent duplicate injection
    if (window.__AUTOTAILOR_INJECTED__) return;
    window.__AUTOTAILOR_INJECTED__ = true;

    // Default rich candidate profile for Shamir Khan
    let profile = {
        first_name: "Shamir",
        last_name: "Khan",
        full_name: "Shamir Khan",
        email: "shamirk2121@gmail.com",
        phone: "(647) 606-6063",
        phone_raw: "6476066063",
        phone_country_code: "+1",
        street_address: "University Avenue West",
        city: "Waterloo",
        alternate_city: "Kitchener",
        state_province: "Ontario",
        province_code: "ON",
        country: "Canada",
        country_code: "CA",
        postal_code: "N2L 3C5",
        address: "Waterloo / Kitchener, ON, Canada",
        linkedin: "https://www.linkedin.com/in/shamir-khan-40698123b/",
        github: "https://github.com/shamir-khan-dev",
        portfolio: "https://shamir-khan-dev.github.io/Personal-Website/",
        website: "https://shamir-khan-dev.github.io/Personal-Website/",
        university: "Wilfrid Laurier University",
        school_location: "Waterloo, Ontario, Canada",
        degree: "Bachelor of Science",
        degree_type: "Undergraduate",
        discipline: "Computer Science",
        major: "Computer Science",
        gpa: "3.8",
        gpa_scale: "4.0",
        start_year: "2024",
        graduation_year: "2028",
        graduation_month: "04",
        graduation_month_name: "April",
        grad_date: "04/2028",
        current_year_of_study: "2nd Year",
        work_auth_canada: true,
        sponsorship_required: false,
        will_relocate: true,
        over_18: true,
        currently_enrolled: true,
        default_resume_pdf: "C:\\Users\\shami\\OneDrive\\Desktop\\Resumes\\Shamir_Khan_SWE_Latest.pdf",
        resume_plain_text: `SHAMIR KHAN
Ontario, Canada | (647)-606-6063 | shamirk2121@gmail.com
LinkedIn: linkedin.com/in/shamir-khan-40698123b | GitHub: github.com/shamir-khan-dev | Portfolio: shamir-khan-dev.github.io/Personal-Website/

EDUCATION
Wilfrid Laurier University | Waterloo, ON
Bachelor of Science in Computer Science | Expected April 2028 | GPA: 3.8 / 4.0
Relevant Coursework: Data Structures & Algorithms, OOP, Software Engineering, Database Systems, Computer Networks, Systems Architecture

TECHNICAL EXPERIENCE
Operations and Technical Lead | The J Healthcare Initiative (via Riipen Labs) | Remote, ON | August 2026
• Led technical discovery and digital audits for healthcare non-profit, cutting triage discovery pathways to under 3 clicks.
• Authored 30-60-90 day technical execution roadmap aligning native web tooling and non-profit grant allocations.

Full-Stack Developer and Team Lead | ConHacks -- InstantService | Waterloo, ON | April 2026
• Led team of 4 developers architecting AI-native PWA using Gemini AI, reducing service acquisition time by 70%.
• Built multi-weighted contractor matching algorithm with FastAPI and Snowflake, driving 40% increase in job volume.

HIGH-IMPACT PROJECTS
AlphaPulse -- Quantitative Terminal & AI TradeBot | Python, FastAPI, NumPy, Pandas, OpenCV, Gemini AI
• High-throughput quantitative trading terminal computing multi-factor confluence scoring across 6 vectorized indicators.
• Dual-mode Computer Vision engine with OpenCV and multimodal Gemini AI parsing clipboard chart screenshots with zero latency.

CloudGuard -- Cloud Security Posture Management (CSPM) | C++, Python, Java, Scala, Docker, Kafka, PostgreSQL, ML
• Distributed microservices platform containerized with Docker, streaming hardware telemetry to Kafka topics at 5-sec intervals.
• Python IsolationForest ML anomaly pipeline detecting SSH brute-force intrusions and abnormal cost surges.

TECHNICAL SKILLS
Languages: Python, Java, C++, TypeScript, JavaScript, SQL, HTML/CSS, Scala
Frameworks: React.js, Next.js, FastAPI, Node.js, Express, Spring Boot, Apache Spark, NumPy, Pandas, OpenCV, Tailwind CSS
Tools & Cloud: Docker, Apache Kafka, Snowflake, PostgreSQL, MongoDB, Git, GitHub Actions, Linux/Unix`
    };

    // Auto-pilot state
    let autoPilotEnabled = false;
    let lastFilledCount = 0;
    let observer = null;

    // Fetch live candidate profile from local AutoTailor backend if running
    function refreshCandidateProfile() {
        fetch("http://127.0.0.1:8500/api/candidate-profile")
            .then(r => r.json())
            .then(data => {
                if (data && data.first_name) {
                    profile = Object.assign(profile, data);
                    updateWidgetProfileDisplay();
                }
            })
            .catch(() => {
                // Local server offline, using rich embedded default profile
            });
    }
    refreshCandidateProfile();

    // Check if the current page looks like a job application, careers portal, or form
    function isApplicationPage() {
        const url = window.location.href.toLowerCase();
        const host = window.location.hostname.toLowerCase();
        const text = (document.body ? document.body.innerText.slice(0, 3000) : "").toLowerCase();

        const atsDomains = [
            "greenhouse.io", "lever.co", "myworkdayjobs.com", "ashbyhq.com",
            "smartrecruiters.com", "icims.com", "eightfold.ai", "ibm.com",
            "brassring.com", "taleo.net", "bamboohr.com", "jobvite.com",
            "workday.com", "ripplematch.com", "successfactors.com"
        ];

        const isKnownDomain = atsDomains.some(d => host.includes(d));
        const hasJobKeywords = url.includes("job") || url.includes("career") || url.includes("apply") || url.includes("intern");
        const hasFormKeywords = text.includes("application") || text.includes("resume") || text.includes("candidate") || text.includes("estimated completion time") || text.includes("choose an option to apply");
        const hasInputs = document.querySelectorAll("input, select, textarea").length >= 2;

        return isKnownDomain || (hasJobKeywords && hasInputs) || hasFormKeywords;
    }

    // Safely set value on React/Angular/Vue/Workday controlled inputs
    function setInputValue(input, val) {
        if (!input || val === undefined || val === null) return false;

        input.focus();

        const isTextArea = input.tagName === "TEXTAREA";
        const isSelect = input.tagName === "SELECT";

        if (isSelect) {
            // Select dropdown: look for matching option text or value
            const valStr = String(val).toLowerCase();
            let matched = false;
            for (let i = 0; i < input.options.length; i++) {
                const opt = input.options[i];
                const optText = (opt.text || "").toLowerCase();
                const optVal = (opt.value || "").toLowerCase();
                if (optVal === valStr || optText === valStr || optText.includes(valStr) || valStr.includes(optText)) {
                    input.selectedIndex = i;
                    matched = true;
                    break;
                }
            }
            if (!matched && input.options.length > 1) {
                // fallback to first non-empty option if available
                input.selectedIndex = 1;
            }
        } else if (isTextArea) {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            if (nativeSetter) {
                nativeSetter.call(input, val);
            } else {
                input.value = val;
            }
        } else {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
            if (nativeSetter) {
                nativeSetter.call(input, val);
            } else {
                input.value = val;
            }
        }

        // Fire input and change events that frameworks listen to
        input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true, cancelable: true }));

        // Visual feedback indicator (Simplify & JobRight signature style)
        try {
            input.style.setProperty("outline", "2px solid #30d158", "important");
            input.style.setProperty("box-shadow", "0 0 8px rgba(48, 209, 88, 0.3)", "important");
            input.style.setProperty("transition", "outline 0.3s ease, box-shadow 0.3s ease", "important");
        } catch (e) {}

        return true;
    }

    // Set radio button or checkbox
    function setCheckable(el, shouldCheck) {
        if (!el) return false;
        if (el.checked !== shouldCheck) {
            el.click();
            el.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
        }
        return false;
    }

    // Main Field Matching Engine
    function executeAutofill() {
        let filledCount = 0;
        const filledFields = [];

        // 1. Text & Email & Phone Inputs
        const fieldRules = [
            // First Name
            {
                name: "First Name",
                val: profile.first_name,
                selectors: [
                    "input[name*='first_name' i]", "input[id*='first_name' i]", "input[autocomplete='given-name']",
                    "input[aria-label*='first name' i]", "input[data-automation-id*='firstName' i]",
                    "input[placeholder*='first name' i]", "input[name*='legalNameSection_firstName' i]"
                ]
            },
            // Last Name
            {
                name: "Last Name",
                val: profile.last_name,
                selectors: [
                    "input[name*='last_name' i]", "input[id*='last_name' i]", "input[autocomplete='family-name']",
                    "input[aria-label*='last name' i]", "input[data-automation-id*='lastName' i]",
                    "input[placeholder*='last name' i]", "input[name*='legalNameSection_lastName' i]"
                ]
            },
            // Email
            {
                name: "Email",
                val: profile.email,
                selectors: [
                    "input[type='email']", "input[name*='email' i]", "input[id*='email' i]",
                    "input[autocomplete='email']", "input[data-automation-id*='email' i]"
                ]
            },
            // Confirm Email
            {
                name: "Confirm Email",
                val: profile.email,
                selectors: [
                    "input[name*='confirm' i][name*='email' i]", "input[id*='confirm' i][id*='email' i]",
                    "input[data-automation-id*='confirmEmail' i]"
                ]
            },
            // Phone
            {
                name: "Phone Number",
                val: profile.phone,
                selectors: [
                    "input[type='tel']", "input[name*='phone' i]", "input[id*='phone' i]",
                    "input[autocomplete='tel']", "input[data-automation-id*='phone' i]",
                    "input[placeholder*='phone' i]"
                ]
            },
            // Address / Street
            {
                name: "Street Address",
                val: profile.street_address,
                selectors: [
                    "input[name*='street' i]", "input[name*='addressLine1' i]", "input[id*='addressLine1' i]",
                    "input[autocomplete='address-line1']", "input[data-automation-id*='addressLine1' i]"
                ]
            },
            // City
            {
                name: "City",
                val: profile.city,
                selectors: [
                    "input[name*='city' i]", "input[id*='city' i]", "input[autocomplete='address-level2']",
                    "input[data-automation-id*='city' i]", "input[placeholder*='city' i]"
                ]
            },
            // State / Province
            {
                name: "Province",
                val: profile.state_province,
                selectors: [
                    "input[name*='state' i]", "input[name*='province' i]", "input[id*='province' i]",
                    "select[name*='province' i]", "select[name*='state' i]", "input[data-automation-id*='countryRegion' i]"
                ]
            },
            // Postal Code / Zip
            {
                name: "Postal Code",
                val: profile.postal_code,
                selectors: [
                    "input[name*='postal' i]", "input[name*='zip' i]", "input[id*='postal' i]", "input[id*='zip' i]",
                    "input[autocomplete='postal-code']", "input[data-automation-id*='postalCode' i]"
                ]
            },
            // Country
            {
                name: "Country",
                val: profile.country,
                selectors: [
                    "select[name*='country' i]", "input[name*='country' i]", "input[data-automation-id*='country' i]"
                ]
            },
            // LinkedIn
            {
                name: "LinkedIn",
                val: profile.linkedin,
                selectors: [
                    "input[name*='linkedin' i]", "input[id*='linkedin' i]", "input[placeholder*='linkedin' i]",
                    "input[aria-label*='linkedin' i]"
                ]
            },
            // GitHub
            {
                name: "GitHub",
                val: profile.github,
                selectors: [
                    "input[name*='github' i]", "input[id*='github' i]", "input[placeholder*='github' i]",
                    "input[aria-label*='github' i]"
                ]
            },
            // Portfolio / Website
            {
                name: "Website",
                val: profile.portfolio,
                selectors: [
                    "input[name*='website' i]", "input[name*='portfolio' i]", "input[id*='website' i]",
                    "input[placeholder*='website' i]", "input[placeholder*='portfolio' i]"
                ]
            },
            // School / University
            {
                name: "University",
                val: profile.university,
                selectors: [
                    "input[name*='school' i]", "input[name*='university' i]", "input[id*='school' i]",
                    "input[id*='university' i]", "input[placeholder*='school' i]", "input[data-automation-id*='school' i]"
                ]
            },
            // Degree
            {
                name: "Degree",
                val: profile.degree,
                selectors: [
                    "input[name*='degree' i]", "input[id*='degree' i]", "select[name*='degree' i]",
                    "input[placeholder*='degree' i]", "input[data-automation-id*='degree' i]"
                ]
            },
            // Major / Discipline
            {
                name: "Major",
                val: profile.discipline,
                selectors: [
                    "input[name*='major' i]", "input[name*='discipline' i]", "input[id*='major' i]",
                    "input[placeholder*='major' i]", "input[placeholder*='field of study' i]"
                ]
            },
            // GPA
            {
                name: "GPA",
                val: profile.gpa,
                selectors: [
                    "input[name*='gpa' i]", "input[id*='gpa' i]", "input[placeholder*='gpa' i]",
                    "input[aria-label*='gpa' i]"
                ]
            },
            // Graduation Year
            {
                name: "Grad Year",
                val: profile.graduation_year,
                selectors: [
                    "input[name*='grad' i][name*='year' i]", "input[id*='grad' i][id*='year' i]",
                    "select[name*='grad' i][name*='year' i]", "input[placeholder*='grad' i][placeholder*='year' i]"
                ]
            }
        ];

        // Execute mapped field filling
        fieldRules.forEach(rule => {
            for (const sel of rule.selectors) {
                try {
                    const el = document.querySelector(sel);
                    if (el && (!el.value || el.value.trim() === "") && el.type !== "hidden" && el.offsetParent !== null) {
                        if (setInputValue(el, rule.val)) {
                            filledCount++;
                            filledFields.push(rule.name);
                            break;
                        }
                    }
                } catch (e) {}
            }
        });

        // Fallback for full name if separate first/last name wasn't detected
        if (!filledFields.includes("First Name") && !filledFields.includes("Last Name")) {
            const nameSels = [
                "input[name*='candidate_name' i]", "input[name='name']", "input[id*='name' i]",
                "input[placeholder*='full name' i]", "input[aria-label*='full name' i]"
            ];
            for (const sel of nameSels) {
                try {
                    const el = document.querySelector(sel);
                    if (el && (!el.value || el.value.trim() === "") && el.type !== "hidden" && el.offsetParent !== null) {
                        if (setInputValue(el, profile.full_name)) {
                            filledCount++;
                            filledFields.push("Full Name");
                            break;
                        }
                    }
                } catch (e) {}
            }
        }

        // 2. Radio & Checkbox Questions (Work Authorization, Sponsorship, Eligibility)
        const labelNodes = Array.from(document.querySelectorAll("label, span, div, p"));
        labelNodes.forEach(lbl => {
            const txt = (lbl.innerText || "").toLowerCase();
            if (!txt || txt.length > 250) return;

            // Work Authorization in Canada = YES
            if (
                (txt.includes("legally") && txt.includes("authorized")) ||
                (txt.includes("eligible to work") && (txt.includes("canada") || txt.includes("country"))) ||
                (txt.includes("right to work") && txt.includes("canada")) ||
                (txt.includes("authorized to work in canada"))
            ) {
                const parent = lbl.closest("fieldset, .field, div, tr") || lbl.parentElement;
                const yesRadio = parent?.querySelector("input[value*='yes' i], input[value='1'], input[id*='yes' i], input[aria-label*='yes' i]");
                if (yesRadio && setCheckable(yesRadio, true)) {
                    filledCount++;
                    filledFields.push("Work Auth: Yes");
                }
            }

            // Visa Sponsorship = NO
            if (
                (txt.includes("require") && txt.includes("sponsorship")) ||
                (txt.includes("visa sponsorship")) ||
                (txt.includes("require sponsorship now or in the future"))
            ) {
                const parent = lbl.closest("fieldset, .field, div, tr") || lbl.parentElement;
                const noRadio = parent?.querySelector("input[value*='no' i], input[value='0'], input[id*='no' i], input[aria-label*='no' i]");
                if (noRadio && setCheckable(noRadio, true)) {
                    filledCount++;
                    filledFields.push("Sponsorship: No");
                }
            }

            // Over 18 = YES
            if (txt.includes("18 years of age") || txt.includes("are you 18")) {
                const parent = lbl.closest("fieldset, .field, div, tr") || lbl.parentElement;
                const yesRadio = parent?.querySelector("input[value*='yes' i], input[value='1'], input[id*='yes' i]");
                if (yesRadio && setCheckable(yesRadio, true)) {
                    filledCount++;
                    filledFields.push("Age: 18+");
                }
            }

            // Currently enrolled in post-secondary = YES
            if (txt.includes("currently enrolled") || txt.includes("returning to school") || txt.includes("student status")) {
                const parent = lbl.closest("fieldset, .field, div, tr") || lbl.parentElement;
                const yesRadio = parent?.querySelector("input[value*='yes' i], input[value='1'], input[id*='yes' i]");
                if (yesRadio && setCheckable(yesRadio, true)) {
                    filledCount++;
                    filledFields.push("Enrolled: Yes");
                }
            }
        });

        // 3. Resume text area check (e.g. for "Copy & Paste" application screens like IBM)
        const resumeTextareas = document.querySelectorAll("textarea[name*='resume' i], textarea[id*='resume' i], textarea[placeholder*='paste' i], textarea[aria-label*='resume' i]");
        resumeTextareas.forEach(ta => {
            if (!ta.value || ta.value.trim().length < 50) {
                if (setInputValue(ta, profile.resume_plain_text)) {
                    filledCount++;
                    filledFields.push("Resume Textarea");
                }
            }
        });

        lastFilledCount = filledCount;
        return { count: filledCount, fields: filledFields };
    }

    // Copy text directly to clipboard
    function copyToClipboard(text, successMsg, statusEl) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            if (statusEl) {
                statusEl.textContent = successMsg;
                statusEl.style.color = "#30d158";
                setTimeout(() => {
                    statusEl.textContent = "AutoTailor AI Active";
                    statusEl.style.color = "#a1a1a6";
                }, 2500);
            }
        }).catch(err => {
            // Fallback execCommand
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            if (statusEl) {
                statusEl.textContent = successMsg;
                statusEl.style.color = "#30d158";
            }
        });
    }

    // Update candidate profile name/school in widget
    function updateWidgetProfileDisplay() {
        const nameEl = document.getElementById("autotailor-candidate-name");
        if (nameEl) {
            nameEl.textContent = `${profile.full_name} (${profile.university ? "Laurier CS" : ""})`;
        }
    }

    // Inject Floating JobRight-Style In-Page Sidebar
    function injectFloatingWidget() {
        if (document.getElementById("autotailor-floating-widget")) return;

        // Detect company & job title from page
        let detectedCompany = "Company";
        let detectedTitle = "Software Engineer Intern";
        const pageTitle = (document.title || "").trim();
        const host = window.location.hostname.toLowerCase();

        if (pageTitle.includes(" at ")) {
            const parts = pageTitle.split(" at ");
            detectedCompany = parts[parts.length - 1].split("|")[0].split("-")[0].trim();
            detectedTitle = parts[0].replace(/job application for/i, "").trim();
        } else if (pageTitle.includes(" - ")) {
            const parts = pageTitle.split(" - ");
            detectedTitle = parts[0].trim();
            detectedCompany = parts[1].split("|")[0].trim();
        } else if (host.includes("greenhouse.io")) {
            const pathParts = window.location.pathname.split("/").filter(Boolean);
            if (pathParts.length > 0) {
                detectedCompany = pathParts[0].replace(/canada/i, " Canada").replace(/jobs/i, "").trim();
            }
        }

        const h1 = document.querySelector("h1, .app-title, .job-title, [data-automation-id='jobTitle']");
        if (h1 && h1.innerText.trim().length > 3) {
            detectedTitle = h1.innerText.trim();
        }

        // Initials avatar
        const initials = detectedCompany.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "DD";

        // Count detected inputs
        const detectedInputs = document.querySelectorAll("input:not([type='hidden']), select, textarea").length;

        // Create Sidebar Container
        const widget = document.createElement("div");
        widget.id = "autotailor-floating-widget";

        widget.innerHTML = `
            <div class="autotailor-widget-inner" id="autotailor-inner">
                <!-- Header (Matches JobRight Screenshot) -->
                <div class="autotailor-widget-header">
                    <div class="autotailor-brand-logo">
                        <span class="autotailor-brand-icon">⚡</span>
                        <span>AutoTailor</span>
                    </div>
                    <div class="autotailor-header-actions">
                        <button class="autotailor-header-btn" id="autotailor-feedback-btn">💬 Feedback</button>
                        <button class="autotailor-header-btn" id="autotailor-settings-btn" title="Settings">⚙️</button>
                        <button class="autotailor-collapse-btn" id="autotailor-min-btn" title="Collapse sidebar">❯</button>
                    </div>
                </div>

                <!-- Job Card (Matches JobRight Screenshot) -->
                <div class="autotailor-job-card">
                    <div class="autotailor-job-header-row">
                        <div class="autotailor-company-badge">
                            <div class="autotailor-company-logo-avatar" id="autotailor-avatar">${initials}</div>
                            <div>
                                <div class="autotailor-company-name-text" id="autotailor-company-name">${detectedCompany}</div>
                                <div class="autotailor-company-sub">Software Engineering</div>
                            </div>
                        </div>
                        <div class="autotailor-match-pill" id="autotailor-match-badge">96%</div>
                    </div>
                    <div class="autotailor-role-title" id="autotailor-role-title">${detectedTitle}</div>
                    <div class="autotailor-job-meta-row">
                        <span>🕒 Verified Posting</span>
                        <span>•</span>
                        <span id="autotailor-detected-count">${detectedInputs} Fields Detected</span>
                    </div>
                </div>

                <!-- Big Green Autofill Button (Signature JobRight Element) -->
                <button class="autotailor-btn-autofill-green" id="autotailor-fill-btn">
                    <span id="fill-btn-text">Autofill</span>
                </button>
                <div class="autotailor-sub-credits">
                    <strong>⚡ AutoTailor Pro</strong> • Unlimited Fills Active (Laurier CS '28)
                </div>

                <!-- Accordion Sections (Matches JobRight Screenshot) -->
                <div class="autotailor-accordion-list">
                    <!-- 1. Your Autofill Information -->
                    <div class="autotailor-accordion-item">
                        <div class="autotailor-accordion-header" id="acc-header-info">
                            <span>📁 Your Autofill Information</span>
                            <span id="acc-icon-info">▾</span>
                        </div>
                        <div class="autotailor-accordion-content" id="acc-content-info">
                            <div class="autotailor-candidate-grid">
                                <div><strong>Candidate:</strong> ${profile.full_name}</div>
                                <div><strong>Email:</strong> ${profile.email}</div>
                                <div><strong>Phone:</strong> ${profile.phone}</div>
                                <div><strong>School:</strong> ${profile.university} (CS '28, GPA 3.8)</div>
                                <div><strong>Work Auth:</strong> Canada (Yes) | Sponsorship (No)</div>
                            </div>
                            <button class="autotailor-btn-pill-action" id="autotailor-copy-plain-resume">📋 Copy Plain-Text Resume</button>
                        </div>
                    </div>

                    <!-- 2. Upload Resume -->
                    <div class="autotailor-accordion-item">
                        <div class="autotailor-accordion-header" id="acc-header-resume">
                            <span>📄 Upload Resume</span>
                            <span id="acc-icon-resume">▾</span>
                        </div>
                        <div class="autotailor-accordion-content hidden" id="acc-content-resume">
                            <div>Target: <strong>Shamir_Khan_SWE_Latest.pdf</strong></div>
                            <a href="http://127.0.0.1:8500" target="_blank" class="autotailor-btn-pill-action" id="autotailor-btn-tailor-ext">✨ Generate Custom Resume</a>
                        </div>
                    </div>

                    <!-- 3. Upload Cover Letter -->
                    <div class="autotailor-accordion-item">
                        <div class="autotailor-accordion-header" id="acc-header-cover">
                            <span>✉️ Upload Cover Letter</span>
                            <span id="acc-icon-cover">▾</span>
                        </div>
                        <div class="autotailor-accordion-content hidden" id="acc-content-cover">
                            <button class="autotailor-btn-pill-action" id="autotailor-btn-cover-ext">✨ Generate Cover Letter</button>
                            <div id="autotailor-cover-result" style="display:none; font-size: 11px; max-height: 120px; overflow-y: auto; background: #fff; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; white-space: pre-wrap; line-height: 1.4;"></div>
                        </div>
                    </div>
                </div>

                <div class="autotailor-bottom-link">
                    <a href="http://127.0.0.1:8500" target="_blank" rel="noopener noreferrer">Autofill for Another Job ↗</a>
                </div>
            </div>
        `;

        // Create Collapsed Bubble Tab (Click to reopen)
        const bubble = document.createElement("div");
        bubble.id = "autotailor-collapsed-bubble";
        bubble.className = "autotailor-collapsed-bubble hidden";
        bubble.innerHTML = `<span>⚡</span> <span>Autofill</span>`;

        document.body.appendChild(widget);
        document.body.appendChild(bubble);

        // Wire Event Listeners
        const fillBtn = document.getElementById("autotailor-fill-btn");
        const fillBtnText = document.getElementById("fill-btn-text");
        const minBtn = document.getElementById("autotailor-min-btn");

        // Accordion 1: Info
        const accHeaderInfo = document.getElementById("acc-header-info");
        const accContentInfo = document.getElementById("acc-content-info");
        const accIconInfo = document.getElementById("acc-icon-info");
        accHeaderInfo.addEventListener("click", () => {
            const isHidden = accContentInfo.classList.toggle("hidden");
            accIconInfo.textContent = isHidden ? "▸" : "▾";
        });

        // Accordion 2: Resume
        const accHeaderResume = document.getElementById("acc-header-resume");
        const accContentResume = document.getElementById("acc-content-resume");
        const accIconResume = document.getElementById("acc-icon-resume");
        accHeaderResume.addEventListener("click", () => {
            const isHidden = accContentResume.classList.toggle("hidden");
            accIconResume.textContent = isHidden ? "▸" : "▾";
        });

        // Accordion 3: Cover Letter
        const accHeaderCover = document.getElementById("acc-header-cover");
        const accContentCover = document.getElementById("acc-content-cover");
        const accIconCover = document.getElementById("acc-icon-cover");
        accHeaderCover.addEventListener("click", () => {
            const isHidden = accContentCover.classList.toggle("hidden");
            accIconCover.textContent = isHidden ? "▸" : "▾";
        });

        // 1. Primary Autofill Trigger
        fillBtn.addEventListener("click", () => {
            fillBtn.disabled = true;
            fillBtnText.textContent = "Autofilling Application...";

            // Scroll to the first empty input
            const firstInput = document.querySelector("input:not([type='hidden']), select, textarea");
            if (firstInput) {
                firstInput.scrollIntoView({ behavior: "smooth", block: "center" });
            }

            setTimeout(() => {
                const res = executeAutofill();
                fillBtn.disabled = false;
                if (res.count > 0) {
                    fillBtnText.textContent = `✓ ${res.count} Fields Autofilled!`;
                    fillBtn.style.background = "#059669";
                } else {
                    fillBtnText.textContent = "✓ Fields Already Populated";
                }

                setTimeout(() => {
                    fillBtnText.textContent = "Autofill";
                    fillBtn.style.background = "#00d084";
                }, 4000);
            }, 300);
        });

        // 2. Copy Plain-Text Resume button
        const copyResumeBtn = document.getElementById("autotailor-copy-plain-resume");
        if (copyResumeBtn) {
            copyResumeBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(profile.resume_plain_text);
                copyResumeBtn.textContent = "✓ Copied to Clipboard!";
                setTimeout(() => { copyResumeBtn.textContent = "📋 Copy Plain-Text Resume"; }, 2500);
            });
        }

        // 3. Generate Cover Letter via local backend
        const btnCoverExt = document.getElementById("autotailor-btn-cover-ext");
        const coverResultBox = document.getElementById("autotailor-cover-result");
        if (btnCoverExt) {
            btnCoverExt.addEventListener("click", () => {
                btnCoverExt.disabled = true;
                btnCoverExt.textContent = "Generating Cover Letter...";
                coverResultBox.style.display = "block";
                coverResultBox.textContent = "Connecting to AutoTailor AI Engine...";

                fetch("http://127.0.0.1:8500/api/generate-cover-letter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        company_name: detectedCompany,
                        role_title: detectedTitle,
                        job_text: document.body ? document.body.innerText.slice(0, 1500) : ""
                    })
                })
                .then(r => r.json())
                .then(data => {
                    btnCoverExt.disabled = false;
                    btnCoverExt.textContent = "✓ Cover Letter Ready (Copied!)";
                    if (data && data.cover_letter) {
                        coverResultBox.textContent = data.cover_letter;
                        navigator.clipboard.writeText(data.cover_letter);
                    }
                    setTimeout(() => { btnCoverExt.textContent = "✨ Generate Cover Letter"; }, 4000);
                })
                .catch(() => {
                    btnCoverExt.disabled = false;
                    btnCoverExt.textContent = "✨ Generate Cover Letter";
                    coverResultBox.textContent = "Could not reach local AutoTailor backend at http://localhost:8500.";
                });
            });
        }

        // 4. Minimize to bubble / Reopen
        minBtn.addEventListener("click", () => {
            widget.classList.add("hidden");
            bubble.classList.remove("hidden");
        });

        bubble.addEventListener("click", () => {
            bubble.classList.add("hidden");
            widget.classList.remove("hidden");
        });

        // Start DOM Mutation Observer for step advances
        initStepAdvanceObserver();
    }

    // Step Advance Observer (JobRight / Simplify feature for multi-page flows)
    function initStepAdvanceObserver() {
        if (observer) observer.disconnect();

        let debounceTimer = null;
        observer = new MutationObserver(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const detectedInputs = document.querySelectorAll("input, select, textarea").length;
                const pill = document.getElementById("autotailor-detected-pill");
                if (pill) {
                    pill.textContent = `${detectedInputs} Fields Detected`;
                }

                // If Auto-Pilot is ON and new empty inputs appeared, automatically autofill!
                if (autoPilotEnabled) {
                    const emptyInputs = Array.from(document.querySelectorAll("input, select, textarea")).filter(
                        el => el.type !== "hidden" && (!el.value || el.value.trim() === "") && el.offsetParent !== null
                    );
                    if (emptyInputs.length > 0) {
                        executeAutofill();
                    }
                }
            }, 600);
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Inject widget if on application page or career portal
    function tryInject() {
        if (isApplicationPage()) {
            injectFloatingWidget();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", tryInject);
    } else {
        tryInject();
    }

    // Also check on URL/history navigation in single-page apps (SPAs)
    window.addEventListener("popstate", tryInject);
    window.addEventListener("hashchange", tryInject);

    // Listen for extension popup message
    chrome.runtime?.onMessage?.addListener((req, sender, sendResponse) => {
        if (req.action === "autofill") {
            const res = executeAutofill();
            sendResponse(res);
        } else if (req.action === "copy_resume") {
            copyToClipboard(profile.resume_plain_text);
            sendResponse({ success: true });
        }
    });

})();
