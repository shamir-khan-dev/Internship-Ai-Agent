document.addEventListener('DOMContentLoaded', () => {
    // State
    let masterTex = '';
    let currentAnalysis = null;
    let projectsCatalog = [];
    let selectedProjectIds = new Set(['alphapulse', 'cloudguard', 'instantservice']);
    let latestPdfFilename = '';

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Elements
    const companyInput = document.getElementById('company-name-input');
    const roleInput = document.getElementById('role-title-input');
    const jobDescInput = document.getElementById('job-description-input');
    const customInstructions = document.getElementById('custom-instructions');
    
    const btnAnalyze = document.getElementById('btn-analyze-job');
    const btnTailor = document.getElementById('btn-tailor-resume');
    const btnCompile = document.getElementById('btn-compile-pdf');
    const btnCoverLetter = document.getElementById('btn-generate-cover-letter');
    const btnQA = document.getElementById('btn-generate-qa');
    const btnSample = document.getElementById('btn-sample-job');
    const btnClear = document.getElementById('btn-clear-job');
    const btnViewMaster = document.getElementById('btn-view-master');

    const analysisBox = document.getElementById('analysis-results');
    const matchScoreNum = document.getElementById('match-score-num');
    const detectedRole = document.getElementById('detected-role');
    const detectedCompanyTerm = document.getElementById('detected-company-term');
    const matchedKeywordsList = document.getElementById('matched-keywords-list');
    const missingKeywordsList = document.getElementById('missing-keywords-list');
    const topPrioritiesList = document.getElementById('top-priorities-list');
    const recruiterInsightsText = document.getElementById('recruiter-insights-text');

    const projectBankPills = document.getElementById('project-bank-pills');
    const selectedProjectsBadge = document.getElementById('selected-projects-badge');

    const latexEditor = document.getElementById('latex-editor');
    const tailoringSummary = document.getElementById('tailoring-summary');
    const newAtsScore = document.getElementById('new-ats-score');
    const changesList = document.getElementById('changes-list');
    
    // PDF Preview Elements
    const pdfPreviewContainer = document.getElementById('pdf-preview-container');
    const pdfPreviewFrame = document.getElementById('pdf-preview-frame');
    const btnOpenPdfTab = document.getElementById('btn-open-pdf-tab');
    const btnClosePdfPreview = document.getElementById('btn-close-pdf-preview');
    const btnViewPdfSplit = document.getElementById('btn-view-pdf-split');
    const compileResultCard = document.getElementById('compile-result-card');
    const compileFilename = document.getElementById('compile-filename');
    const compilePagesInfo = document.getElementById('compile-pages-info');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');

    const coverLetterOutput = document.getElementById('cover-letter-output');
    const qaQuestionInput = document.getElementById('qa-question-input');
    const qaOutput = document.getElementById('qa-output');

    // Modal
    const masterModal = document.getElementById('master-modal');
    const masterTexViewer = document.getElementById('master-tex-viewer');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCloseModal2 = document.getElementById('btn-close-modal-2');
    const btnResetToMaster = document.getElementById('btn-reset-to-master');

    // Tabs & Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchToTab(targetTab) {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        const targetBtn = document.querySelector(`[data-tab="${targetTab}"]`);
        const targetEl = document.getElementById(targetTab);
        if (targetBtn) targetBtn.classList.add('active');
        if (targetEl) targetEl.classList.add('active');

        // Sync header quick nav pills
        document.querySelectorAll('.nav-pill').forEach(pill => {
            if (pill.getAttribute('data-target-tab') === targetTab) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchToTab(targetTab);
        });
    });

    // Header Quick Nav Pills (Apple style)
    document.querySelectorAll('.nav-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const targetTab = pill.getAttribute('data-target-tab');
            switchToTab(targetTab);
            if (targetTab === 'tab-auto-apply') {
                const anchor = document.getElementById('jobs-container-anchor');
                if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // Apple Theme Management (Light / Dark)
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    const themeIcon = document.getElementById('theme-icon');
    const themeLabel = document.getElementById('theme-label');

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeLabel) themeLabel.textContent = 'Light';
            localStorage.setItem('autotailor_theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeLabel) themeLabel.textContent = 'Dark';
            localStorage.setItem('autotailor_theme', 'dark');
        }
    }

    const savedTheme = localStorage.getItem('autotailor_theme') || 'dark';
    applyTheme(savedTheme);

    if (btnToggleTheme) {
        btnToggleTheme.addEventListener('click', () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const nextTheme = isLight ? 'dark' : 'light';
            applyTheme(nextTheme);
            showToast(`Switched to Apple ${nextTheme === 'light' ? 'Clean Light' : 'Obsidian Dark'} Mode`, '🌓');
        });
    }

    // Apple Dynamic Island Toast Helper
    let toastTimeout = null;
    function showToast(message, icon = '✓') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        if (toastTimeout) clearTimeout(toastTimeout);
        toast.innerHTML = `<span style="color: var(--apple-green); font-weight: 700;">${icon}</span> <span>${message}</span>`;
        toast.classList.remove('hidden');
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3400);
    }

    // Number Counting Animation for Match Score
    function animateScoreCounter(targetScore) {
        if (!matchScoreNum) return;
        let start = 0;
        const duration = 750;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (targetScore - start) * ease);
            matchScoreNum.textContent = current + '%';

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                matchScoreNum.textContent = targetScore + '%';
            }
        }
        requestAnimationFrame(update);
    }

    // Load Project Catalog
    async function fetchProjectCatalog() {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                projectsCatalog = data.projects || [];
                renderProjectPills();
            }
        } catch (e) {
            console.error('Failed to load project catalog:', e);
        }
    }

    function renderProjectPills() {
        if (!projectBankPills) return;
        projectBankPills.innerHTML = '';

        projectsCatalog.forEach(p => {
            const pill = document.createElement('div');
            const isSelected = selectedProjectIds.has(p.id);
            const isRecommended = currentAnalysis && (currentAnalysis.recommended_projects || []).includes(p.id);

            pill.className = `project-pill ${isSelected ? 'active' : ''} ${isRecommended ? 'recommended' : ''}`;
            pill.title = `${p.name} (${p.category})`;

            pill.innerHTML = `
                <span class="project-pill-icon">${p.id === 'alphapulse' ? '📈' : p.id === 'cloudguard' ? '🛡️' : p.id === 'instantservice' ? '📱' : p.id === 'subscription_manager' ? '🔄' : '🌐'}</span>
                <strong>${p.id === 'alphapulse' ? 'AlphaPulse (Quant & AI)' : p.id === 'cloudguard' ? 'CloudGuard (C++/Kafka)' : p.id === 'instantservice' ? 'InstantService (AI Lead)' : p.id === 'subscription_manager' ? 'Subscription Mgr' : 'MSA Platform'}</strong>
                <span class="project-pill-badge">${isRecommended ? '⭐ Top Fit' : p.skills[0]}</span>
            `;

            pill.addEventListener('click', () => {
                if (selectedProjectIds.has(p.id)) {
                    if (selectedProjectIds.size <= 2) {
                        showToast('Keep at least 2 projects selected for a complete 1-page resume.', '⚠️');
                        return;
                    }
                    selectedProjectIds.delete(p.id);
                } else {
                    if (selectedProjectIds.size >= 4) {
                        showToast('Maximum 3-4 projects fit on a strict 1-page resume.', 'ℹ️');
                    }
                    selectedProjectIds.add(p.id);
                }
                renderProjectPills();
                updateSelectedProjectsBadge();
            });

            projectBankPills.appendChild(pill);
        });

        updateSelectedProjectsBadge();
    }

    function updateSelectedProjectsBadge() {
        if (selectedProjectsBadge) {
            selectedProjectsBadge.textContent = `${selectedProjectIds.size} Projects Active`;
        }
    }

    // Load Master Resume on Boot
    async function fetchMasterResume() {
        try {
            const res = await fetch('/api/master-resume');
            if (res.ok) {
                const data = await res.json();
                masterTex = data.tex;
                latexEditor.value = masterTex;
                masterTexViewer.value = masterTex;
            }
        } catch (e) {
            console.error('Could not load master resume:', e);
        }
    }

    fetchMasterResume();
    fetchProjectCatalog();

    // Sample Job Loader
    btnSample.addEventListener('click', () => {
        companyInput.value = 'IBM / Verkada';
        roleInput.value = 'Software Developer Intern - Cloud Platform & Backend Systems';
        jobDescInput.value = `We are seeking an ambitious Software Engineering Intern to join our Cloud Infrastructure and Core Backend Systems team.

In this role, you will design distributed microservices, architect real-time event-driven pipelines, optimize database queries, and build robust RESTful & GraphQL APIs used by millions.

Requirements & Qualifications:
- Proficiency in Python, C++, Go, or Java with deep understanding of data structures and algorithms
- Hands-on experience with relational databases (PostgreSQL/SQL), Redis, or message brokers (Apache Kafka)
- Experience designing RESTful APIs (FastAPI/Express/Flask) and containerized workflows (Docker, Kubernetes)
- Familiarity with modern frontend integration (React, TypeScript) or cloud platforms (AWS, Azure, GCP)
- Passion for solving distributed systems bottlenecks, system reliability, and high-throughput data processing`;
        showToast('Sample job loaded: Cloud & Backend SWE Intern');
    });

    btnClear.addEventListener('click', () => {
        companyInput.value = '';
        roleInput.value = '';
        jobDescInput.value = '';
        analysisBox.classList.add('hidden');
        showToast('Cleared job input');
    });

    // Analyze Job
    btnAnalyze.addEventListener('click', async () => {
        const text = jobDescInput.value.trim();
        if (!text) {
            showToast('Please paste a job description first.', '⚠️');
            return;
        }

        btnAnalyze.disabled = true;
        btnAnalyze.innerHTML = '<span class="btn-icon">⏳</span> Scanning with Gemini 3.8 Flash...';

        try {
            const res = await fetch('/api/analyze-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_text: text })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Analysis failed');
            }

            const data = await res.json();
            currentAnalysis = data;

            // Populate detected info if user didn't enter it
            if (!companyInput.value && data.company_name) companyInput.value = data.company_name;
            if (!roleInput.value && data.role_title) roleInput.value = data.role_title;

            animateScoreCounter(data.match_score || 85);
            detectedRole.textContent = data.role_title || 'Software Engineering Role';
            detectedCompanyTerm.textContent = `${data.company_name || 'Target Company'} • ${data.term || 'Upcoming Term'} • ${data.location || 'Remote/Hybrid'}`;

            // Matched keywords
            matchedKeywordsList.innerHTML = (data.matched_keywords || [])
                .map(kw => `<span>${kw}</span>`).join('');

            // Missing keywords
            missingKeywordsList.innerHTML = (data.missing_keywords || [])
                .map(kw => `<span>${kw}</span>`).join('');

            // Top priorities
            topPrioritiesList.innerHTML = (data.top_priorities || [])
                .map(p => `<li>${p}</li>`).join('');

            recruiterInsightsText.textContent = `Recruiter Tip: "${data.recruiter_insights || ''}"`;

            // Auto-select recommended projects
            if (data.recommended_projects && data.recommended_projects.length > 0) {
                selectedProjectIds = new Set(data.recommended_projects);
                renderProjectPills();
            }

            analysisBox.classList.remove('hidden');
            showToast(`Analysis complete: ${data.match_score}% ATS match score.`);
        } catch (e) {
            alert('Error analyzing job: ' + e.message);
        } finally {
            btnAnalyze.disabled = false;
            btnAnalyze.innerHTML = '<span class="btn-icon">🔍</span> Scan ATS & Extract Keywords';
        }
    });

    // Tailor Resume
    btnTailor.addEventListener('click', async () => {
        const text = jobDescInput.value.trim();
        if (!text) {
            showToast('Please paste a job description on the left first.', '⚠️');
            return;
        }

        btnTailor.disabled = true;
        btnTailor.innerHTML = '<span>⏳ Tailoring with Gemini 3.8 Flash...</span>';

        try {
            const res = await fetch('/api/tailor-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_text: text,
                    company_name: companyInput.value || (currentAnalysis && currentAnalysis.company_name) || '',
                    role_title: roleInput.value || (currentAnalysis && currentAnalysis.role_title) || '',
                    master_tex: latexEditor.value || masterTex,
                    custom_instructions: customInstructions.value.trim(),
                    included_project_ids: Array.from(selectedProjectIds)
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Tailoring failed');
            }

            const data = await res.json();
            latexEditor.value = data.tailored_tex;
            newAtsScore.textContent = (data.projected_ats_score || 95) + '%';

            if (data.selected_project_ids) {
                selectedProjectIds = new Set(data.selected_project_ids);
                renderProjectPills();
            }

            changesList.innerHTML = (data.changes_made || [])
                .map(ch => `<li>${ch}</li>`).join('');

            tailoringSummary.classList.remove('hidden');
            showToast('Resume tailored! Ready to compile 1-page PDF.');
        } catch (e) {
            alert('Error tailoring resume: ' + e.message);
        } finally {
            btnTailor.disabled = false;
            btnTailor.innerHTML = '<span>✨ Generate Tailored Resume</span>';
        }
    });

    // Improve Resume (AI Audit & Bullet Optimization)
    const btnImproveResume = document.getElementById('btn-improve-resume');
    const resumeImprovementBox = document.getElementById('resume-improvement-box');
    const impAtsScore = document.getElementById('imp-ats-score');
    const impProviderBadge = document.getElementById('imp-provider-badge');
    const impCriticalList = document.getElementById('imp-critical-list');
    const impBulletsContainer = document.getElementById('imp-bullets-container');
    const impSummaryQuote = document.getElementById('imp-summary-quote');
    const btnCloseImprovement = document.getElementById('btn-close-improvement');

    if (btnCloseImprovement && resumeImprovementBox) {
        btnCloseImprovement.addEventListener('click', () => {
            resumeImprovementBox.classList.add('hidden');
        });
    }

    if (btnImproveResume) {
        btnImproveResume.addEventListener('click', async () => {
            const currentTex = latexEditor.value.trim() || masterTex;
            const jobText = jobDescInput ? jobDescInput.value.trim() : '';
            const companyName = companyInput ? companyInput.value.trim() : '';

            btnImproveResume.disabled = true;
            btnImproveResume.innerHTML = '<span>⏳ Auditing with Gemini...</span>';

            try {
                const res = await fetch('/api/improve-resume', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resume_text: currentTex,
                        job_text: jobText,
                        company_name: companyName,
                        focus_areas: customInstructions ? customInstructions.value.trim() : ''
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || 'Audit failed');
                }

                const data = await res.json();

                if (impAtsScore) impAtsScore.textContent = `${data.ats_score_improved || 96}%`;
                if (impProviderBadge) impProviderBadge.textContent = data.provider_used || 'Gemini 3.8 Flash';

                if (impCriticalList) {
                    impCriticalList.innerHTML = (data.critical_issues || []).map(iss => `<li>${escapeHtml(iss)}</li>`).join('');
                }

                if (impBulletsContainer) {
                    impBulletsContainer.innerHTML = '';
                    const bullets = data.improved_bullets || {};
                    Object.entries(bullets).forEach(([key, bullet]) => {
                        const item = document.createElement('div');
                        item.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;display:flex;flex-direction:column;gap:4px;';
                        const label = key.replace(/_/g, ' ').replace(/\w/g, l => l.toUpperCase());
                        item.innerHTML = `
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <span style="font-size:11px;font-weight:600;color:#10b981;">⚡ ${escapeHtml(label)}</span>
                                <button class="btn-copy-bullet" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:11px;">📋 Copy</button>
                            </div>
                            <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">${escapeHtml(bullet)}</div>
                        `;
                        const copyBtn = item.querySelector('.btn-copy-bullet');
                        copyBtn.addEventListener('click', () => {
                            navigator.clipboard.writeText(bullet);
                            copyBtn.textContent = '✓ Copied';
                            setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
                            showToast('Copied upgraded bullet to clipboard!');
                        });
                        impBulletsContainer.appendChild(item);
                    });
                }

                if (impSummaryQuote) {
                    impSummaryQuote.textContent = `Recruiter Assessment: "${data.overall_feedback || ''}"`;
                }

                if (resumeImprovementBox) {
                    resumeImprovementBox.classList.remove('hidden');
                    resumeImprovementBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }

                showToast(`Resume Audit Complete: ${data.ats_score_improved || 96}% ATS potential!`, '🚀');
            } catch (e) {
                alert('Resume improvement error: ' + e.message);
            } finally {
                btnImproveResume.disabled = false;
                btnImproveResume.innerHTML = '<span>🚀 Audit & Improve Resume</span>';
            }
        });
    }

    // Compile PDF
    btnCompile.addEventListener('click', async () => {
        const tex = latexEditor.value.trim();
        if (!tex) {
            showToast('No LaTeX code to compile.', '⚠️');
            return;
        }

        const comp = companyInput.value.trim() || 'Company';
        const role = roleInput.value.trim() || 'SWE';
        const cleanName = `Shamir_Khan_${comp}_${role}`.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
        latestPdfFilename = cleanName;

        btnCompile.disabled = true;
        btnCompile.innerHTML = '<span class="btn-icon">⏳</span> Compiling LaTeX...';

        try {
            const res = await fetch('/api/compile-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tex_content: tex,
                    filename: cleanName
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Compilation failed');
            }

            const data = await res.json();
            compileFilename.textContent = cleanName;
            compilePagesInfo.textContent = `Page Count: ${data.page_count} Page${data.page_count > 1 ? 's (Warning: Ideal is 1 Page)' : ' (Verified 100% 1-Page ATS Standard)'}`;
            
            if (data.page_count === 1) {
                compilePagesInfo.style.color = '#30d158';
            } else {
                compilePagesInfo.style.color = '#ff9f0a';
            }

            btnDownloadPdf.href = data.download_url;
            compileResultCard.classList.remove('hidden');

            // Load into Live PDF preview split
            pdfPreviewFrame.src = data.download_url;
            btnOpenPdfTab.href = data.download_url;
            pdfPreviewContainer.classList.remove('hidden');

            showToast(`PDF Compiled: ${data.page_count} Page!`);
        } catch (e) {
            alert('PDF Compilation Notice: ' + e.message);
        } finally {
            btnCompile.disabled = false;
            btnCompile.innerHTML = '<span class="btn-icon">⚡</span> Compile 1-Page PDF';
        }
    });

    // Toggle PDF Split Preview
    if (btnViewPdfSplit) {
        btnViewPdfSplit.addEventListener('click', () => {
            if (btnDownloadPdf.href && btnDownloadPdf.href !== '#') {
                pdfPreviewFrame.src = btnDownloadPdf.href;
                pdfPreviewContainer.classList.remove('hidden');
                pdfPreviewContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (btnClosePdfPreview) {
        btnClosePdfPreview.addEventListener('click', () => {
            pdfPreviewContainer.classList.add('hidden');
        });
    }

    // Copy LaTeX
    document.getElementById('btn-copy-tex').addEventListener('click', () => {
        navigator.clipboard.writeText(latexEditor.value);
        showToast('LaTeX source copied to clipboard!');
    });

    // Generate Cover Letter
    btnCoverLetter.addEventListener('click', async () => {
        const text = jobDescInput.value.trim();
        btnCoverLetter.disabled = true;
        btnCoverLetter.textContent = 'Generating with Gemini...';

        try {
            const res = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_text: text || 'Software Engineering Internship',
                    company_name: companyInput.value.trim() || 'Hiring Team',
                    role_title: roleInput.value.trim() || 'Software Engineering Intern'
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Generation failed');
            }

            const data = await res.json();
            coverLetterOutput.value = data.cover_letter;
            showToast('Authentic cover letter generated!');
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            btnCoverLetter.disabled = false;
            btnCoverLetter.textContent = 'Generate Cover Letter';
        }
    });

    document.getElementById('btn-copy-cover-letter').addEventListener('click', () => {
        navigator.clipboard.writeText(coverLetterOutput.value);
        showToast('Cover letter copied to clipboard!');
    });

    // Application Q&A
    btnQA.addEventListener('click', async () => {
        const question = qaQuestionInput.value.trim();
        const text = jobDescInput.value.trim();

        if (!question) {
            showToast('Please enter an application question first.', '⚠️');
            return;
        }

        btnQA.disabled = true;
        btnQA.textContent = 'Solving with Gemini...';

        try {
            const res = await fetch('/api/generate-qa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_text: text || 'Software Engineering Internship',
                    question: question,
                    company_name: companyInput.value.trim() || 'the company'
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Generation failed');
            }

            const data = await res.json();
            qaOutput.value = data.answer;
            showToast('Tailored answer generated!');
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            btnQA.disabled = false;
            btnQA.textContent = 'Generate Answer';
        }
    });

    document.getElementById('btn-copy-qa').addEventListener('click', () => {
        navigator.clipboard.writeText(qaOutput.value);
        showToast('Answer copied to clipboard!');
    });

    // =========================================================================
    // Bulk Application & Multi-Question Copilot
    // =========================================================================
    const btnModeBulk = document.getElementById('btn-mode-bulk');
    const btnModeSingle = document.getElementById('btn-mode-single');
    const sectionBulkQA = document.getElementById('section-bulk-qa');
    const sectionSingleQA = document.getElementById('section-single-qa');
    const bulkPasteInput = document.getElementById('bulk-paste-input');
    const btnExtractAndAnswer = document.getElementById('btn-extract-and-answer');
    const btnLoadKhanSample = document.getElementById('btn-load-khan-sample');
    const btnClearBulkQA = document.getElementById('btn-clear-bulk-qa');
    const bulkStatusText = document.getElementById('bulk-status-text');
    const bulkJobMeta = document.getElementById('bulk-job-meta');
    const metaCompanyBadge = document.getElementById('meta-company-badge');
    const metaRoleTitle = document.getElementById('meta-role-title');
    const metaLocationPill = document.getElementById('meta-location-pill');
    const metaCompensationPill = document.getElementById('meta-compensation-pill');
    const metaScorePill = document.getElementById('meta-score-pill');
    const metaTechTags = document.getElementById('meta-tech-tags');
    const bulkResultsSection = document.getElementById('bulk-results-section');
    const qaQuestionsCount = document.getElementById('qa-questions-count');
    const bulkQACardsList = document.getElementById('bulk-qa-cards-list');
    const btnCopyAllQA = document.getElementById('btn-copy-all-qa');

    let currentBulkData = null;

    const KHAN_ACADEMY_SAMPLE = `New
Software Engineer Intern (Summer 2027)
Remote (US + Canada Only)
Let’s Strengthen Your Resume3 out of 10 keywords matched, add more to make you stand out.
Improve My Match
30Low Match
ABOUT KHAN ACADEMY
Khan Academy is a nonprofit with the mission to deliver a free, world-class education to anyone, anywhere. Our proven learning platform offers free, high-quality supplemental learning content and practice that cover Pre-K - 12th grade and early college core academic subjects, focusing on math and science.
OUR COMMUNITY
Our students, teachers, and parents come from all walks of life, and so do we. Our team includes people from academia, traditional/non-traditional education, big tech companies, and tiny startups.
THE ROLE
We are looking for talented software engineers for our 12-week remote Summer 2027 internship program.
We currently use: Go, JavaScript (React / React Native, Redux, Flow), Google Cloud Run, GraphQL and other technologies that best solve the problem at hand.
The target hourly rate for this position is $46.15 USD for individuals based in the US and $54.51 CAD for individuals based in Canada.
Apply for this job
Will you now, or in the future, require sponsorship to work in the U.S.?*No
If you answered 'Yes' above, please provide additional details on the sponsorship you require.
Are you able to work/live within the United States or Canada for the duration of your internship? Where will you be working from? *
How did you hear about this internship?*
What is your expected graduation date?*2028 academic school year
Have you completed an internship in Software Engineering?*No
What is your current major, and what inspired you to choose this field of study?*
Have you used Khan Academy before? What excites you about the opportunity to intern at Khan Academy, and how do you see our mission aligning with your personal goals or values?*
Can you provide a link to a recent project you’ve worked on? Please include a brief description of the project, any challenges you faced, and the link to it.*
Is there anything else you'd like us to know about you?`;

    // Mode Toggle
    if (btnModeBulk && btnModeSingle) {
        btnModeBulk.addEventListener('click', () => {
            btnModeBulk.classList.add('active');
            btnModeSingle.classList.remove('active');
            sectionBulkQA.classList.remove('hidden');
            sectionSingleQA.classList.add('hidden');
        });

        btnModeSingle.addEventListener('click', () => {
            btnModeSingle.classList.add('active');
            btnModeBulk.classList.remove('active');
            sectionSingleQA.classList.remove('hidden');
            sectionBulkQA.classList.add('hidden');
        });
    }

    // Load Khan Academy Sample
    if (btnLoadKhanSample) {
        btnLoadKhanSample.addEventListener('click', () => {
            bulkPasteInput.value = KHAN_ACADEMY_SAMPLE;
            showToast('Loaded Khan Academy Greenhouse posting!');
            // Auto switch to bulk tab if on single
            if (btnModeBulk) btnModeBulk.click();
        });
    }

    // Clear
    if (btnClearBulkQA) {
        btnClearBulkQA.addEventListener('click', () => {
            bulkPasteInput.value = '';
            if (bulkJobMeta) bulkJobMeta.classList.add('hidden');
            if (bulkResultsSection) bulkResultsSection.classList.add('hidden');
            bulkQACardsList.innerHTML = '';
            currentBulkData = null;
            showToast('Cleared application copilot');
        });
    }

    // Extract & Answer Action
    if (btnExtractAndAnswer) {
        btnExtractAndAnswer.addEventListener('click', async () => {
            const rawText = bulkPasteInput.value.trim();
            if (!rawText) {
                showToast('Please paste job text or application form questions first.', '⚠️');
                return;
            }

            btnExtractAndAnswer.disabled = true;
            btnExtractAndAnswer.innerHTML = '<span class="btn-icon">⏳</span> Analyzing & Generating Answers...';
            if (bulkStatusText) bulkStatusText.textContent = 'Scanning questions & tech stack...';

            try {
                const res = await fetch('/api/extract-and-answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ raw_text: rawText })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || 'Extraction failed');
                }

                const data = await res.json();
                currentBulkData = data;

                // Render Metadata
                if (bulkJobMeta) {
                    metaCompanyBadge.textContent = data.company_name || 'Target Company';
                    metaRoleTitle.textContent = data.role_title || 'Software Engineering Intern';
                    metaLocationPill.textContent = '📍 ' + (data.location || 'Remote');
                    metaCompensationPill.textContent = '💰 ' + (data.compensation || 'Competitive');
                    metaScorePill.textContent = '⚡ ' + (data.match_score || 96) + '% Match';

                    // Tech Stack Tags
                    metaTechTags.innerHTML = '';
                    if (data.tech_stack && data.tech_stack.length > 0) {
                        data.tech_stack.forEach(tech => {
                            const span = document.createElement('span');
                            span.textContent = tech;
                            metaTechTags.appendChild(span);
                        });
                    } else {
                        metaTechTags.innerHTML = '<span style="color:var(--text-muted);font-size:12px;">Full-Stack SWE</span>';
                    }
                    bulkJobMeta.classList.remove('hidden');
                }

                // Render Q&A Cards
                const qaList = data.qa_pairs || [];
                qaQuestionsCount.textContent = qaList.length;
                bulkQACardsList.innerHTML = '';

                if (qaList.length === 0) {
                    bulkQACardsList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">No direct application questions detected in the paste. Try pasting Greenhouse or Lever application questions.</div>';
                } else {
                    qaList.forEach((item, idx) => {
                        const card = document.createElement('div');
                        card.className = 'bulk-qa-card';
                        
                        const catClass = item.category || 'general';
                        const wordsCount = item.answer.trim().split(/\s+/).length;

                        card.innerHTML = `
                            <div class="qa-card-header">
                                <div style="flex:1;">
                                    <div class="qa-q-num">Question ${idx + 1}</div>
                                    <div class="qa-q-text">${escapeHtml(item.question)}</div>
                                </div>
                                <span class="qa-category-tag ${catClass}">${catClass}</span>
                            </div>
                            <div class="qa-answer-box">${escapeHtml(item.answer)}</div>
                            <div class="qa-card-footer">
                                <span class="qa-stats-hint">${wordsCount} words • Tailored to Shamir Khan</span>
                                <button class="btn-copy-card" data-answer-index="${idx}">
                                    <span class="copy-icon">📋</span> Copy Answer
                                </button>
                            </div>
                        `;

                        // Individual copy button handler
                        const copyBtn = card.querySelector('.btn-copy-card');
                        copyBtn.addEventListener('click', () => {
                            navigator.clipboard.writeText(item.answer);
                            copyBtn.classList.add('copied');
                            copyBtn.innerHTML = '<span>✓</span> Copied!';
                            showToast(`Copied Answer ${idx + 1}!`);
                            setTimeout(() => {
                                copyBtn.classList.remove('copied');
                                copyBtn.innerHTML = '<span class="copy-icon">📋</span> Copy Answer';
                            }, 2000);
                        });

                        bulkQACardsList.appendChild(card);
                    });
                }

                bulkResultsSection.classList.remove('hidden');
                showToast(`Generated tailored answers for ${qaList.length} questions!`);
            } catch (err) {
                console.error(err);
                alert('Error: ' + err.message);
            } finally {
                btnExtractAndAnswer.disabled = false;
                btnExtractAndAnswer.innerHTML = '<span class="btn-icon">✨</span> Extract & Generate All Answers';
                if (bulkStatusText) bulkStatusText.textContent = '';
            }
        });
    }

    // Copy All Answers
    if (btnCopyAllQA) {
        btnCopyAllQA.addEventListener('click', () => {
            if (!currentBulkData || !currentBulkData.qa_pairs || currentBulkData.qa_pairs.length === 0) {
                showToast('No answers generated yet to copy.', '⚠️');
                return;
            }

            let fullText = `=== ${currentBulkData.company_name} -- ${currentBulkData.role_title} Application Answers ===\n\n`;
            currentBulkData.qa_pairs.forEach((qa, idx) => {
                fullText += `[Question ${idx + 1}]: ${qa.question}\nAnswer:\n${qa.answer}\n\n`;
            });

            navigator.clipboard.writeText(fullText.trim());
            btnCopyAllQA.textContent = '✓ All Copied!';
            showToast('All application answers copied to clipboard!');
            setTimeout(() => {
                btnCopyAllQA.textContent = '📋 Copy All Answers';
            }, 2500);
        });
    }

    // Master Modal
    btnViewMaster.addEventListener('click', () => {
        masterModal.classList.remove('hidden');
    });

    btnCloseModal.addEventListener('click', () => masterModal.classList.add('hidden'));
    if (btnCloseModal2) btnCloseModal2.addEventListener('click', () => masterModal.classList.add('hidden'));

    btnResetToMaster.addEventListener('click', () => {
        latexEditor.value = masterTex;
        masterModal.classList.add('hidden');
        tailoringSummary.classList.add('hidden');
        compileResultCard.classList.add('hidden');
        pdfPreviewContainer.classList.add('hidden');
        showToast('Editor reset to master resume.');
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            if (document.activeElement === jobDescInput) {
                e.preventDefault();
                btnAnalyze.click();
            } else if (document.activeElement === latexEditor || document.activeElement === customInstructions) {
                e.preventDefault();
                btnTailor.click();
            }
        }
    });

    // ==========================================
    // Tab 4: Autonomous Internship Radar & Auto-Applier
    // ==========================================
    const btnScanJobs = document.getElementById('btn-scan-jobs');
    const radarSearchQuery = document.getElementById('radar-search-query');
    const radarSearchLocation = document.getElementById('radar-search-location');
    const jobsCountBadge = document.getElementById('jobs-count-badge');
    const jobsCardsList = document.getElementById('jobs-cards-list');
    const botStatusBanner = document.getElementById('bot-status-banner');
    const botConsoleTitle = document.getElementById('bot-console-title');
    const botConsoleMsg = document.getElementById('bot-console-msg');
    const radarTimeFilter = document.getElementById('radar-time-filter');

    // Stats Ribbon Elements
    const statTotalVal = document.getElementById('stat-total-val');
    const statFreshVal = document.getElementById('stat-fresh-val');
    const statFrontendVal = document.getElementById('stat-frontend-val');
    const statAiVal = document.getElementById('stat-ai-val');
    const statSystemVal = document.getElementById('stat-system-val');
    const statSavedVal = document.getElementById('stat-saved-val');
    const savedCountNum = document.getElementById('saved-count-num');

    // Local In-Memory Dataset & Filters State
    let allLoadedJobs = [];
    let activeCountry = 'all';
    let activeDomain = 'all';
    let savedJobIds = new Set(JSON.parse(localStorage.getItem('autotailor_saved_jobs') || '[]'));
    let appliedJobIds = new Set(JSON.parse(localStorage.getItem('autotailor_applied_jobs') || '[]'));

    const statAppliedVal = document.getElementById('stat-applied-val');
    const appliedCountNum = document.getElementById('applied-count-num');

    function updateSavedUI() {
        const count = savedJobIds.size;
        if (savedCountNum) savedCountNum.textContent = count;
        if (statSavedVal) statSavedVal.textContent = count;
    }
    updateSavedUI();

    function updateAppliedUI() {
        const count = appliedJobIds.size;
        if (appliedCountNum) appliedCountNum.textContent = count;
        if (statAppliedVal) statAppliedVal.textContent = count;
    }
    updateAppliedUI();

    function toggleSaveJob(jobId, btnEl) {
        if (savedJobIds.has(jobId)) {
            savedJobIds.delete(jobId);
            if (btnEl) {
                btnEl.classList.remove('saved');
                btnEl.innerHTML = '⭐ Save';
            }
            showToast('Removed from saved applications', 'ℹ️');
        } else {
            savedJobIds.add(jobId);
            if (btnEl) {
                btnEl.classList.add('saved');
                btnEl.innerHTML = '★ Saved';
            }
            showToast('Saved to your application tracker!', '⭐');
        }
        localStorage.setItem('autotailor_saved_jobs', JSON.stringify(Array.from(savedJobIds)));
        updateSavedUI();

        if (activeCountry === 'saved') {
            applyClientFilters();
        }
    }

    function toggleAppliedJob(jobId, explicitState = null) {
        const currentState = appliedJobIds.has(jobId);
        const newState = explicitState !== null ? explicitState : !currentState;

        if (newState) {
            appliedJobIds.add(jobId);
            localStorage.setItem('autotailor_applied_meta_' + jobId, JSON.stringify({
                appliedAt: new Date().toISOString()
            }));
            showToast('Marked internship as Applied! ✓', '✅');
        } else {
            appliedJobIds.delete(jobId);
            localStorage.removeItem('autotailor_applied_meta_' + jobId);
            showToast('Application marked unapplied', 'ℹ️');
        }

        localStorage.setItem('autotailor_applied_jobs', JSON.stringify(Array.from(appliedJobIds)));
        updateAppliedUI();

        // Update all DOM elements for this job across card & list
        document.querySelectorAll(`.job-card[data-job-id="${jobId}"]`).forEach(card => {
            card.classList.toggle('applied', newState);
            const chk = card.querySelector('.job-applied-checkbox');
            if (chk) chk.checked = newState;
            const wrapper = card.querySelector('.job-applied-check-wrapper');
            if (wrapper) wrapper.classList.toggle('is-applied', newState);
            const labelText = card.querySelector('.job-applied-text');
            if (labelText) labelText.textContent = newState ? 'Applied ✓' : 'Mark Applied';

            const metaRow = card.querySelector('.job-meta-row');
            if (metaRow) {
                let badge = metaRow.querySelector('.job-applied-badge');
                if (newState && !badge) {
                    badge = document.createElement('span');
                    badge.className = 'job-applied-badge';
                    badge.innerHTML = '✅ Applied';
                    metaRow.prepend(badge);
                } else if (!newState && badge) {
                    badge.remove();
                }
            }
        });

        if (currentDrawerJob && currentDrawerJob.id === jobId) {
            updateDrawerAppliedBtn(newState);
        }

        if (activeCountry === 'applied' || activeCountry === 'unapplied') {
            applyClientFilters(false);
        }
    }

    // Instant Client-Side Filter Engine (0ms Latency)
    function applyClientFilters(animated = false) {
        if (!jobsCardsList) return;

        if (animated) {
            showSkeletonCards(6);
            setTimeout(() => _doFilter(), 220);
        } else {
            _doFilter();
        }
    }

    function _doFilter() {
        const q = radarSearchQuery ? radarSearchQuery.value.trim().toLowerCase() : '';
        const loc = radarSearchLocation ? radarSearchLocation.value.trim().toLowerCase() : '';
        const maxH = radarTimeFilter ? parseFloat(radarTimeFilter.value) : 0;

        // Dynamic stats calculation across entire dataset
        let freshCount = 0;
        let frontendCount = 0;
        let aiCount = 0;
        let systemCount = 0;

        allLoadedJobs.forEach(j => {
            if (j.is_fresh_20h) freshCount++;
            if (j.domain === 'frontend' || j.domain === 'fullstack') frontendCount++;
            if (j.domain === 'ai') aiCount++;
            if (j.domain === 'backend' || j.domain === 'cloud' || j.domain === 'swe') systemCount++;
        });

        if (statTotalVal) statTotalVal.textContent = allLoadedJobs.length.toLocaleString() + '+';
        if (statFreshVal) statFreshVal.textContent = freshCount.toLocaleString();
        if (statFrontendVal) statFrontendVal.textContent = frontendCount.toLocaleString();
        if (statAiVal) statAiVal.textContent = aiCount.toLocaleString();
        if (statSystemVal) statSystemVal.textContent = systemCount.toLocaleString();
        updateSavedUI();
        updateAppliedUI();

        const filtered = allLoadedJobs.filter(j => {
            // Market & Application Status Filter
            if (activeCountry === 'saved') {
                if (!savedJobIds.has(j.id)) return false;
            } else if (activeCountry === 'applied') {
                if (!appliedJobIds.has(j.id)) return false;
            } else if (activeCountry === 'unapplied') {
                if (appliedJobIds.has(j.id)) return false;
            } else if (activeCountry !== 'all') {
                if (j.country !== activeCountry) {
                    if (activeCountry === 'remote' && !j.location.toLowerCase().includes('remote')) return false;
                    if (activeCountry !== 'remote') return false;
                }
            }

            // Technical Domain Filter
            if (activeDomain !== 'all') {
                if (j.domain !== activeDomain) return false;
            }

            // Freshness Filter
            if (maxH > 0) {
                if (j.posted_hours_ago > maxH) return false;
            }

            // Location Text Filter
            if (loc && loc !== 'all') {
                const jLoc = (j.location || '').toLowerCase();
                if (loc === 'canada' || loc === 'ca') {
                    if (!['canada', 'toronto', 'vancouver', 'montreal', 'waterloo', 'ottawa', 'calgary', 'bc', 'on', 'qc', 'ab'].some(c => jLoc.includes(c))) {
                        return false;
                    }
                } else if (!jLoc.includes(loc)) {
                    return false;
                }
            }

            // Search Query Filter
            if (q) {
                const searchable = `${j.company} ${j.title} ${(j.tags || []).join(' ')} ${j.location} ${j.domain} ${j.source}`.toLowerCase();
                if (!searchable.includes(q)) return false;
            }

            return true;
        });

        const filterSummary = [];
        if (activeCountry !== 'all') {
            if (activeCountry === 'saved') filterSummary.push('Saved');
            else if (activeCountry === 'applied') filterSummary.push('Applied ✓');
            else if (activeCountry === 'unapplied') filterSummary.push('New / Unapplied');
            else filterSummary.push(activeCountry.toUpperCase());
        }
        if (activeDomain !== 'all') filterSummary.push(activeDomain.toUpperCase());
        if (maxH > 0) filterSummary.push(`≤ ${maxH}h`);
        if (loc) filterSummary.push(loc);
        if (q) filterSummary.push(`"${q}"`);
        const labelExtra = filterSummary.length > 0 ? ` (${filterSummary.join(' • ')})` : '';

        if (jobsCountBadge) {
            jobsCountBadge.textContent = `${filtered.length} Positions${labelExtra}`;
        }

        // Live Active Filter Announcement Banner Update
        const activeFilterBanner = document.getElementById('active-filter-indicator');
        const activeFilterText = document.getElementById('active-filter-text');
        if (activeFilterBanner && activeFilterText) {
            if (activeCountry !== 'all' || activeDomain !== 'all' || maxH > 0 || loc || q) {
                activeFilterBanner.classList.remove('hidden');
                activeFilterText.textContent = `Active Filter: ${filtered.length} positions matching [${filterSummary.join(' • ')}]`;
            } else {
                activeFilterBanner.classList.add('hidden');
            }
        }

        renderJobs(filtered);
    }

    // Reset filters button
    const btnClearFilters = document.getElementById('btn-clear-active-filters');
    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            activeCountry = 'all';
            activeDomain = 'all';
            if (radarSearchQuery) radarSearchQuery.value = '';
            if (radarSearchLocation) radarSearchLocation.value = '';
            if (radarTimeFilter) radarTimeFilter.value = '0';
            document.querySelectorAll('.market-pill').forEach(b => b.classList.toggle('active', b.getAttribute('data-country') === 'all'));
            document.querySelectorAll('.domain-pill').forEach(b => b.classList.toggle('active', b.getAttribute('data-domain') === 'all'));
            applyClientFilters(true);
            showToast('Reset all filters to All Positions');
        });
    }

    // Drawer Toggles (Extension Guide & Profile Snapshot)
    const btnToggleExt = document.getElementById('btn-toggle-ext');
    const extGuideDrawer = document.getElementById('ext-guide-drawer');
    if (btnToggleExt && extGuideDrawer) {
        btnToggleExt.addEventListener('click', () => {
            const isClosed = extGuideDrawer.classList.contains('hidden');
            extGuideDrawer.classList.toggle('hidden');
            btnToggleExt.classList.toggle('active', isClosed);
            btnToggleExt.textContent = isClosed ? '🧩 Chrome Extension (JobRight Style) ▴' : '🧩 Chrome Extension (JobRight Style) ▾';
        });
    }

    const btnToggleProfile = document.getElementById('btn-toggle-profile');
    const profileSnapshotDrawer = document.getElementById('profile-snapshot-drawer');
    if (btnToggleProfile && profileSnapshotDrawer) {
        btnToggleProfile.addEventListener('click', () => {
            const isClosed = profileSnapshotDrawer.classList.contains('hidden');
            profileSnapshotDrawer.classList.toggle('hidden');
            btnToggleProfile.classList.toggle('active', isClosed);
            btnToggleProfile.textContent = isClosed ? '👤 Candidate Profile (Shamir Khan) ▴' : '👤 Candidate Profile (Shamir Khan) ▾';
        });
    }

    function scrollResultsIntoView() {
        const target = document.getElementById('jobs-container-anchor');
        if (target) {
            const rect = target.getBoundingClientRect();
            // If the table is below the fold or not fully visible, smooth scroll to it
            if (rect.top > window.innerHeight * 0.5 || rect.top < 0) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    // Skeleton Loader
    function showSkeletonCards(count) {
        if (!jobsCardsList) return;
        jobsCardsList.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const sk = document.createElement('div');
            sk.className = 'job-card job-card-skeleton';
            sk.innerHTML = `
                <div class="skel-info">
                    <div class="skel-line skel-title"></div>
                    <div class="skel-line skel-meta"></div>
                    <div class="skel-tags">
                        <div class="skel-tag"></div>
                        <div class="skel-tag"></div>
                        <div class="skel-tag"></div>
                    </div>
                </div>
                <div class="skel-actions">
                    <div class="skel-btn"></div>
                    <div class="skel-btn"></div>
                </div>
            `;
            jobsCardsList.appendChild(sk);
        }
    }

    // Market Pills Click
    document.querySelectorAll('.market-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.market-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCountry = btn.getAttribute('data-country') || 'all';
            showToast(`Market: ${btn.textContent.trim()}`);
            applyClientFilters(true); // animated reload
            scrollResultsIntoView();
        });
    });

    // Domain Pills Click
    document.querySelectorAll('.domain-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.domain-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeDomain = btn.getAttribute('data-domain') || 'all';
            showToast(`Track: ${btn.textContent.trim()}`);
            applyClientFilters(true); // animated reload
            scrollResultsIntoView();
        });
    });

    // Time filter change
    if (radarTimeFilter) {
        radarTimeFilter.addEventListener('change', () => {
            applyClientFilters(true);
            scrollResultsIntoView();
        });
    }

    // Debounced Search Inputs (Instant 120ms feedback)
    let searchDebounce = null;
    if (radarSearchQuery) {
        radarSearchQuery.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => applyClientFilters(false), 120);
        });
    }
    if (radarSearchLocation) {
        radarSearchLocation.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => applyClientFilters(false), 120);
        });
    }

    if (radarTimeFilter) {
        // Time filter already wired above
    }

    // Load full live dataset from server
    async function loadJobs(forceRefresh = false) {
        if (!jobsCardsList) return;
        if (jobsCountBadge) jobsCountBadge.textContent = 'Syncing live feeds...';
        showSkeletonCards(5);

        try {
            const url = forceRefresh ? '/api/jobs?country=all&refresh=1' : '/api/jobs?country=all';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch jobs');
            const data = await res.json();
            allLoadedJobs = data.jobs || [];

            applyClientFilters(false);
        } catch (e) {
            console.error('Jobs fetch error:', e);
            if (jobsCountBadge) jobsCountBadge.textContent = 'Sync error — retrying';
            if (jobsCardsList) jobsCardsList.innerHTML = `<div class="jobs-empty-state"><div class="empty-icon">⚡</div><div class="empty-title">Radar sync error</div><div class="empty-sub">Click Refresh Radar to retry</div></div>`;
        }
    }

    function renderJobs(jobs) {
        if (!jobsCardsList) return;
        jobsCardsList.innerHTML = '';

        if (jobs.length === 0) {
            jobsCardsList.innerHTML = `
                <div class="jobs-empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">No matching internships found</div>
                    <div class="empty-sub">Try clearing keywords, selecting "All Locations", or switching technical domains.</div>
                </div>
            `;
            return;
        }

        // Render first 100 for high performance, scroll for more
        const slice = jobs.slice(0, 100);

        slice.forEach(job => {
            const card = document.createElement('div');
            const isSaved = savedJobIds.has(job.id);
            const isApplied = appliedJobIds.has(job.id);

            card.className = `job-card ${isApplied ? 'applied' : ''}`;
            card.setAttribute('data-job-id', job.id);

            const tagsHtml = (job.tags || []).map(t => `<span class="job-tag">${t}</span>`).join('');

            // Company avatar initials
            const initials = (job.company || '??').split(/[\s&]+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const avatarColors = {
                'quant': 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                'ai': 'linear-gradient(135deg, #bf5af2, #9933cc)',
                'backend': 'linear-gradient(135deg, #30d158, #24a143)',
                'cloud': 'linear-gradient(135deg, #ff9f0a, #e67700)',
                'fullstack': 'linear-gradient(135deg, #0071e3, #0062cc)',
                'swe': 'linear-gradient(135deg, #64748b, #475569)'
            };
            const avatarBg = avatarColors[job.domain] || avatarColors['swe'];

            // Country & Domain Badges
            const countryLabel = job.country === 'ca' ? '🇨🇦 Canada' : job.country === 'remote' ? '☁️ Remote' : '🇺🇸 USA';
            const domainLabels = {
                'quant': '📈 Quant & Trading',
                'ai': '🤖 AI & ML',
                'backend': '⚙️ Systems / C++',
                'cloud': '🛡️ Cloud / Sec',
                'fullstack': '🌐 Full-Stack',
                'swe': '💻 SWE'
            };
            const domainBadge = domainLabels[job.domain] || '💻 SWE';
            const matchColor = job.match_score >= 95 ? 'var(--apple-green)' : job.match_score >= 90 ? '#38bdf8' : 'var(--text-secondary)';

            card.innerHTML = `
                <div class="job-avatar" style="background: ${avatarBg}">${initials}</div>
                <div class="job-info-col">
                    <div class="job-card-title-row">
                        <a href="${job.apply_url}" target="_blank" rel="noopener noreferrer" class="job-title-link" title="Click to open direct application page">
                            <span class="job-company-name">${job.company}</span>
                            <span class="job-title-sep">—</span>
                            <span class="job-title-role">${job.title}</span>
                            <span class="job-link-arrow">↗</span>
                        </a>
                    </div>
                    <div class="job-meta-row">
                        ${isApplied ? '<span class="job-applied-badge">✅ Applied</span>' : ''}
                        ${job.is_fresh_20h 
                            ? `<span class="badge-fresh">🔥 ${job.posted_time_label || (job.posted_hours_ago + 'h ago')}</span>` 
                            : `<span class="badge-time">🕒 ${job.posted_time_label || (job.posted_hours_ago + 'h ago')}</span>`}
                        <span class="country-badge">${countryLabel}</span>
                        <span class="domain-badge">${domainBadge}</span>
                        <span>📍 ${job.location}</span>
                        <span>🗓️ ${job.term || 'Upcoming Term'}</span>
                        <span class="match-score-badge" style="color: ${matchColor}; border-color: ${matchColor}40; background: ${matchColor}12;">${job.match_score || 92}% Match</span>
                        <span class="badge-neutral" style="font-size: 11px;">via ${job.source || 'Direct ATS'}</span>
                    </div>
                    <div class="job-tags-row">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="job-action-col">
                    <div style="display: flex; gap: 6px; align-items: center; width: 100%; justify-content: flex-end;">
                        <button class="btn-save-job ${isSaved ? 'saved' : ''}" data-id="${job.id}">
                            ${isSaved ? '★ Saved' : '⭐ Save'}
                        </button>
                        <label class="job-applied-check-wrapper ${isApplied ? 'is-applied' : ''}" title="Check when you've applied to this role">
                            <input type="checkbox" class="job-applied-checkbox" data-id="${job.id}" ${isApplied ? 'checked' : ''} />
                            <span class="job-applied-text">${isApplied ? 'Applied ✓' : 'Mark Applied'}</span>
                        </label>
                    </div>
                    <a href="${job.apply_url}" target="_blank" rel="noopener noreferrer" class="btn-direct-link" title="Open direct application in new tab">
                        <span>↗ Direct Apply</span>
                    </a>
                    <button class="btn-autofill btn-run-autofill" data-url="${job.apply_url}" data-company="${job.company}" data-title="${job.title}" title="Autofill form via Playwright bot">
                        <span>⚡ Auto-Apply (Bot)</span>
                    </button>
                    <button class="btn-secondary btn-import-job" data-company="${job.company}" data-title="${job.title}" title="Tailor LaTeX resume for this position">
                        <span>✨ Tailor Resume</span>
                    </button>
                </div>
            `;

            // Wire Save button
            const btnSave = card.querySelector('.btn-save-job');
            btnSave.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSaveJob(job.id, btnSave);
            });

            // Wire Applied Checkbox
            const chkApplied = card.querySelector('.job-applied-checkbox');
            if (chkApplied) {
                chkApplied.addEventListener('click', (e) => e.stopPropagation());
                chkApplied.addEventListener('change', (e) => {
                    e.stopPropagation();
                    toggleAppliedJob(job.id, chkApplied.checked);
                });
            }
            const wrapperApplied = card.querySelector('.job-applied-check-wrapper');
            if (wrapperApplied) {
                wrapperApplied.addEventListener('click', (e) => e.stopPropagation());
            }

            // Wire Direct Apply link to auto-mark applied
            const btnDirect = card.querySelector('.btn-direct-link');
            if (btnDirect) {
                btnDirect.addEventListener('click', () => {
                    if (!appliedJobIds.has(job.id)) {
                        toggleAppliedJob(job.id, true);
                    }
                });
            }

            // Wire Auto-Apply button
            const btnRun = card.querySelector('.btn-run-autofill');
            btnRun.addEventListener('click', async (e) => {
                e.stopPropagation();
                await triggerAutofill(job);
                toggleAppliedJob(job.id, true);
            });

            // Wire Tailor button
            const btnImport = card.querySelector('.btn-import-job');
            btnImport.addEventListener('click', (e) => {
                e.stopPropagation();
                companyInput.value = job.company;
                roleInput.value = job.title;
                jobDescInput.value = `Target Role: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nTerm: ${job.term}\nTags & Tech: ${(job.tags || []).join(', ')}\n\nApply URL: ${job.apply_url}\n\nPlease tailor my resume for this ${job.company} ${job.title} internship position.`;
                
                // Switch to resume tab
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                const resumeTabBtn = document.querySelector('[data-tab="tab-resume"]');
                if (resumeTabBtn) resumeTabBtn.classList.add('active');
                const resumeTabContent = document.getElementById('tab-resume');
                if (resumeTabContent) resumeTabContent.classList.add('active');

                // Trigger ATS Analysis
                btnAnalyze.click();
                showToast(`Imported ${job.company} into Tailoring Engine!`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            // Wire Card click to open Apple-style Slide-out Detail Drawer
            card.addEventListener('click', (e) => {
                if (e.target.closest('a, button')) return;
                openJobDrawer(job);
            });

            jobsCardsList.appendChild(card);
        });

        if (jobs.length > 100) {
            const moreBanner = document.createElement('div');
            moreBanner.style.cssText = 'padding: 16px; text-align: center; color: var(--text-tertiary); font-size: 12.5px;';
            moreBanner.textContent = `Showing top 100 of ${jobs.length.toLocaleString()} matching positions. Use search or domain filters to narrow down.`;
            jobsCardsList.appendChild(moreBanner);
        }
    }

    // Slide-out Job Detail Drawer (Apple Style Side Sheet)
    const drawerBackdrop = document.getElementById('drawer-backdrop');
    const jobDetailDrawer = document.getElementById('job-detail-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const drawerAvatar = document.getElementById('drawer-avatar');
    const drawerTitle = document.getElementById('drawer-title');
    const drawerCompany = document.getElementById('drawer-company');
    const drawerLocation = document.getElementById('drawer-location');
    const drawerTerm = document.getElementById('drawer-term');
    const drawerDirectApply = document.getElementById('drawer-direct-apply');
    const drawerTailorBtn = document.getElementById('drawer-tailor-btn');
    const drawerCoverLetterBtn = document.getElementById('drawer-cover-letter-btn');
    const drawerAutofillBtn = document.getElementById('drawer-autofill-btn');
    const drawerAppliedBtn = document.getElementById('drawer-applied-btn');
    const drawerAppliedIcon = document.getElementById('drawer-applied-icon');
    const drawerAppliedText = document.getElementById('drawer-applied-text');
    const drawerTimeBadge = document.getElementById('drawer-time-badge');
    const drawerCountryBadge = document.getElementById('drawer-country-badge');
    const drawerDomainBadge = document.getElementById('drawer-domain-badge');
    const drawerMatchBadge = document.getElementById('drawer-match-badge');
    const drawerPortalBadge = document.getElementById('drawer-portal-badge');
    const drawerScorePill = document.getElementById('drawer-score-pill');
    const drawerMatchedSkills = document.getElementById('drawer-matched-skills');
    const drawerTargetSkills = document.getElementById('drawer-target-skills');
    const drawerDescription = document.getElementById('drawer-description');

    let currentDrawerJob = null;

    function updateDrawerAppliedBtn(isApplied) {
        if (!drawerAppliedBtn) return;
        drawerAppliedBtn.classList.toggle('is-applied', isApplied);
        if (drawerAppliedIcon) drawerAppliedIcon.textContent = isApplied ? '✅' : '⬜';
        if (drawerAppliedText) drawerAppliedText.textContent = isApplied ? 'Applied ✓' : 'Mark as Applied';
    }

    function openJobDrawer(job) {
        if (!jobDetailDrawer) return;
        currentDrawerJob = job;

        const initials = (job.company || '??').split(/[\s&]+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const avatarColors = {
            'quant': 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
            'ai': 'linear-gradient(135deg, #bf5af2, #9933cc)',
            'backend': 'linear-gradient(135deg, #30d158, #24a143)',
            'cloud': 'linear-gradient(135deg, #ff9f0a, #e67700)',
            'fullstack': 'linear-gradient(135deg, #0071e3, #0062cc)',
            'swe': 'linear-gradient(135deg, #64748b, #475569)'
        };

        if (drawerAvatar) {
            drawerAvatar.textContent = initials;
            drawerAvatar.style.background = avatarColors[job.domain] || avatarColors['swe'];
        }

        if (drawerTitle) drawerTitle.textContent = job.title;
        if (drawerCompany) drawerCompany.textContent = job.company;
        if (drawerLocation) drawerLocation.textContent = job.location || 'Location Not Specified';
        if (drawerTerm) drawerTerm.textContent = job.term || 'Upcoming Term';

        if (drawerDirectApply) {
            drawerDirectApply.href = job.apply_url;
            drawerDirectApply.setAttribute('title', `Open direct application at ${job.company}`);
        }

        updateDrawerAppliedBtn(appliedJobIds.has(job.id));

        if (drawerTimeBadge) {
            const timeText = job.posted_time_label || `${job.posted_hours_ago || 0}h ago`;
            if (job.is_fresh_20h) {
                drawerTimeBadge.className = 'drawer-badge fresh';
                drawerTimeBadge.textContent = `🔥 ${timeText}`;
            } else {
                drawerTimeBadge.className = 'drawer-badge';
                drawerTimeBadge.textContent = `🕒 ${timeText}`;
            }
        }

        if (drawerCountryBadge) {
            drawerCountryBadge.textContent = job.country === 'ca' ? '🇨🇦 Canada' : job.country === 'remote' ? '☁️ Remote' : '🇺🇸 United States';
        }

        if (drawerDomainBadge) {
            const domainLabels = {
                'ai': '🤖 AI / ML Systems',
                'backend': '⚙️ Backend & Systems',
                'cloud': '🛡️ Cloud & Infra',
                'fullstack': '🌐 Full-Stack Web',
                'frontend': '🎨 Frontend & UI',
                'mobile': '📱 Mobile Engineering',
                'swe': '💻 Software Engineering'
            };
            drawerDomainBadge.textContent = domainLabels[job.domain] || '💻 SWE';
        }

        const matchScore = job.match_score || 96;
        if (drawerMatchBadge) drawerMatchBadge.textContent = `${matchScore}% Match`;
        if (drawerScorePill) drawerScorePill.textContent = `${matchScore}% Match`;
        if (drawerPortalBadge) drawerPortalBadge.textContent = `🔗 ${job.source || 'Direct ATS'}`;

        // Skills tags
        const jobTags = job.tags || [];
        const baseSkills = ['Distributed Systems', 'Python / C++', 'API Architecture', 'Docker', 'PostgreSQL', 'Cloud Infrastructure'];
        const displaySkills = jobTags.length > 0 ? jobTags : baseSkills;
        
        if (drawerMatchedSkills) {
            drawerMatchedSkills.innerHTML = displaySkills.slice(0, 6).map(s => `<span class="tag-badge">✓ ${s}</span>`).join('');
        }
        if (drawerTargetSkills) {
            const highImpact = ['High Concurrency', 'Kafka Streaming', 'Kubernetes'].filter(k => !jobTags.includes(k));
            drawerTargetSkills.innerHTML = highImpact.slice(0, 3).map(s => `<span class="tag-badge missing">⚡ ${s}</span>`).join('');
        }

        if (drawerDescription) {
            drawerDescription.textContent = `Target Position: ${job.title} at ${job.company}\nLocation: ${job.location}\nHiring Term: ${job.term || 'Upcoming Term'}\nDirect ATS Portal: ${job.apply_url}\n\nCandidate Alignment:\n• Wilfrid Laurier University Computer Science '28 (GPA 3.8)\n• High-Impact Projects: AlphaPulse (High-Throughput Order Engine) & CloudGuard (Zero-Trust Security Engine)\n• Skills Aligned: ${(job.tags || ['Distributed Systems', 'Python', 'TypeScript', 'Docker']).join(', ')}`;
        }

        if (drawerBackdrop) drawerBackdrop.classList.remove('hidden');
        if (jobDetailDrawer) {
            jobDetailDrawer.classList.remove('hidden');
            jobDetailDrawer.setAttribute('aria-hidden', 'false');
        }
    }

    function closeJobDrawer() {
        if (drawerBackdrop) drawerBackdrop.classList.add('hidden');
        if (jobDetailDrawer) {
            jobDetailDrawer.classList.add('hidden');
            jobDetailDrawer.setAttribute('aria-hidden', 'true');
        }
        currentDrawerJob = null;
    }

    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeJobDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeJobDrawer);

    if (drawerAppliedBtn) {
        drawerAppliedBtn.addEventListener('click', () => {
            if (!currentDrawerJob) return;
            toggleAppliedJob(currentDrawerJob.id);
        });
    }

    if (drawerDirectApply) {
        drawerDirectApply.addEventListener('click', () => {
            if (currentDrawerJob && !appliedJobIds.has(currentDrawerJob.id)) {
                toggleAppliedJob(currentDrawerJob.id, true);
            }
        });
    }

    if (drawerTailorBtn) {
        drawerTailorBtn.addEventListener('click', () => {
            if (!currentDrawerJob) return;
            const job = currentDrawerJob;
            closeJobDrawer();
            companyInput.value = job.company;
            roleInput.value = job.title;
            jobDescInput.value = `Target Role: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nTerm: ${job.term}\nTags & Tech: ${(job.tags || []).join(', ')}\n\nApply URL: ${job.apply_url}\n\nPlease tailor my resume for this position.`;
            switchToTab('tab-resume');
            btnAnalyze.click();
            showToast(`Loaded ${job.company} into Resume Studio!`);
        });
    }

    if (drawerCoverLetterBtn) {
        drawerCoverLetterBtn.addEventListener('click', () => {
            if (!currentDrawerJob) return;
            const job = currentDrawerJob;
            closeJobDrawer();
            companyInput.value = job.company;
            roleInput.value = job.title;
            jobDescInput.value = `Target Role: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nTerm: ${job.term}`;
            switchToTab('tab-cover-letter');
            btnCoverLetter.click();
            showToast(`Generating authentic Cover Letter for ${job.company}...`);
        });
    }

    if (drawerAutofillBtn) {
        drawerAutofillBtn.addEventListener('click', async () => {
            if (!currentDrawerJob) return;
            const job = currentDrawerJob;
            closeJobDrawer();
            await triggerAutofill(job);
            toggleAppliedJob(job.id, true);
        });
    }

    // Keyboard Shortcuts (Linear / Apple style)
    let selectedJobIndex = -1;
    document.addEventListener('keydown', (e) => {
        const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

        if (e.key === 'Escape') {
            closeJobDrawer();
            if (masterModal && !masterModal.classList.contains('hidden')) {
                masterModal.classList.add('hidden');
            }
            return;
        }

        if (isInput) return;

        if (e.key === '/') {
            e.preventDefault();
            if (radarSearchQuery) {
                radarSearchQuery.focus();
                radarSearchQuery.select();
            }
            return;
        }

        const cards = Array.from(document.querySelectorAll('.job-card'));
        if (cards.length === 0) return;

        if (e.key === 'j' || e.key === 'ArrowDown') {
            e.preventDefault();
            selectedJobIndex = Math.min(selectedJobIndex + 1, cards.length - 1);
            highlightNavCard(cards, selectedJobIndex);
        } else if (e.key === 'k' || e.key === 'ArrowUp') {
            e.preventDefault();
            selectedJobIndex = Math.max(selectedJobIndex - 1, 0);
            highlightNavCard(cards, selectedJobIndex);
        } else if (e.key === 'a' || e.key === 'A') {
            if (selectedJobIndex >= 0 && selectedJobIndex < cards.length) {
                const card = cards[selectedJobIndex];
                const jobId = card.getAttribute('data-job-id');
                if (jobId) {
                    toggleAppliedJob(jobId);
                }
            }
        } else if (e.key === 'Enter') {
            if (selectedJobIndex >= 0 && selectedJobIndex < cards.length) {
                cards[selectedJobIndex].click();
            }
        }
    });

    function highlightNavCard(cards, index) {
        cards.forEach((c, idx) => {
            if (idx === index) {
                c.classList.add('keyboard-focused');
                c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                c.classList.remove('keyboard-focused');
            }
        });
    }

    async function triggerAutofill(job) {
        if (!botStatusBanner) return;
        botStatusBanner.classList.remove('hidden');
        botConsoleTitle.textContent = `🤖 Playwright Bot Active for ${job.company}`;
        botConsoleMsg.textContent = `Opening direct portal: ${job.apply_url}...`;

        showToast(`Launching Playwright bot for ${job.company}... Watch your screen!`, '🚀');

        try {
            const res = await fetch('/api/autofill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apply_url: job.apply_url,
                    resume_filename: latestPdfFilename || 'Shamir_Khan_SWE_Latest.pdf',
                    headless: false
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Auto-fill failed');
            }

            const data = await res.json();
            botConsoleTitle.textContent = `✅ ${job.company}: Form Autofilled!`;
            botConsoleMsg.textContent = data.message || `Filled ${data.fields_filled ? data.fields_filled.length : 0} fields. Resume attached. Review window is open for 45s.`;
            showToast(`Auto-fill complete for ${job.company}! Review & submit.`, '✨');
        } catch (e) {
            botConsoleTitle.textContent = `⚠️ Bot Notice (${job.company})`;
            botConsoleMsg.textContent = `Automation note: ${e.message}. You can still complete the portal directly via the 'Direct Apply' button.`;
        }
    }

    if (btnScanJobs) {
        btnScanJobs.addEventListener('click', () => loadJobs(true));
    }

    // Auto-load on boot
    loadJobs();
});

