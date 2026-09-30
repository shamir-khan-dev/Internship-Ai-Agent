document.addEventListener('DOMContentLoaded', () => {
    // State
    let masterTex = '';
    let currentAnalysis = null;
    let projectsCatalog = [];
    let selectedProjectIds = new Set(['alphapulse', 'cloudguard', 'instantservice']);
    let latestPdfFilename = '';

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

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Toast helper
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3500);
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
                        showToast('Keep at least 2 projects selected for a complete 1-page resume.');
                        return;
                    }
                    selectedProjectIds.delete(p.id);
                } else {
                    if (selectedProjectIds.size >= 4) {
                        showToast('Maximum 3-4 projects fit on a strict 1-page resume.');
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
        companyInput.value = 'Citadel / Bloomberg';
        roleInput.value = 'Quantitative Software Engineer / Python Intern';
        jobDescInput.value = `We are seeking an exceptional Software Engineering Intern to join our Quantitative Technology and Market Data Analytics team.
        
In this role, you will build ultra-low-latency data pipelines, implement vectorized technical indicators, and develop automated algorithmic trading execution tools.

Requirements & Qualifications:
- Strong proficiency in Python, C++, or Go with deep understanding of data structures and algorithms
- Hands-on experience with NumPy, Pandas, vectorized mathematical analysis, or financial time-series
- Familiarity with computer vision (OpenCV) or multimodal LLMs is a strong plus
- Experience designing RESTful APIs (FastAPI) and event-driven architectures
- Demonstrated passion for market structure, quantitative analysis, backtesting, or automated trading systems`;
        showToast('Sample job loaded: Quantitative & Python Intern');
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
            showToast('Please paste a job description first.');
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

            matchScoreNum.textContent = data.match_score + '%';
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
            btnAnalyze.innerHTML = '<span class="btn-icon">🔍</span> Analyze & Scan ATS Keywords';
        }
    });

    // Tailor Resume
    btnTailor.addEventListener('click', async () => {
        const text = jobDescInput.value.trim();
        if (!text) {
            showToast('Please paste a job description on the left first.');
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
            showToast('Resume successfully tailored! Ready to compile 1-page PDF.');
        } catch (e) {
            alert('Error tailoring resume: ' + e.message);
        } finally {
            btnTailor.disabled = false;
            btnTailor.innerHTML = '<span>✨ Generate Tailored Resume</span>';
        }
    });

    // Compile PDF
    btnCompile.addEventListener('click', async () => {
        const tex = latexEditor.value.trim();
        if (!tex) {
            showToast('No LaTeX code to compile.');
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
                compilePagesInfo.style.color = '#34d399';
            } else {
                compilePagesInfo.style.color = '#f59e0b';
            }

            btnDownloadPdf.href = data.download_url;
            compileResultCard.classList.remove('hidden');

            // Load into Live PDF preview split
            loadPdfPreview(data.preview_url || `/api/preview/${cleanName}`);

            showToast(`PDF Compiled successfully! (${data.page_count} page${data.page_count > 1 ? 's' : ''})`);
        } catch (e) {
            alert('Compilation error: ' + e.message);
        } finally {
            btnCompile.disabled = false;
            btnCompile.innerHTML = '<span class="btn-icon">⚡</span> Compile & Verify 1-Page PDF';
        }
    });

    function loadPdfPreview(previewUrl) {
        if (!pdfPreviewContainer || !pdfPreviewFrame) return;
        pdfPreviewFrame.src = previewUrl;
        btnOpenPdfTab.href = previewUrl;
        pdfPreviewContainer.classList.remove('hidden');
    }

    if (btnViewPdfSplit) {
        btnViewPdfSplit.addEventListener('click', () => {
            if (latestPdfFilename) {
                loadPdfPreview(`/api/preview/${latestPdfFilename}`);
            }
        });
    }

    if (btnClosePdfPreview) {
        btnClosePdfPreview.addEventListener('click', () => {
            pdfPreviewContainer.classList.add('hidden');
            pdfPreviewFrame.src = 'about:blank';
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
        if (!text) {
            showToast('Please paste a job description first.');
            return;
        }

        btnCoverLetter.disabled = true;
        btnCoverLetter.textContent = 'Writing authentic cover letter...';

        try {
            const res = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_text: text,
                    company_name: companyInput.value.trim() || 'Hiring Team',
                    role_title: roleInput.value.trim() || 'Software Engineer Intern'
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Generation failed');
            }

            const data = await res.json();
            coverLetterOutput.value = data.cover_letter;
            showToast('Cover letter generated!');
        } catch (e) {
            alert('Error generating cover letter: ' + e.message);
        } finally {
            btnCoverLetter.disabled = false;
            btnCoverLetter.textContent = 'Generate Cover Letter';
        }
    });

    document.getElementById('btn-copy-cover-letter').addEventListener('click', () => {
        navigator.clipboard.writeText(coverLetterOutput.value);
        showToast('Cover letter copied to clipboard!');
    });

    // Generate QA Answer
    btnQA.addEventListener('click', async () => {
        const text = jobDescInput.value.trim();
        const question = qaQuestionInput.value.trim();

        if (!question) {
            showToast('Please enter an application question.');
            return;
        }

        btnQA.disabled = true;
        btnQA.textContent = 'Generating answer...';

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
    // Tab 4: Auto-Applier & Internship Radar
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

    async function loadJobs() {
        if (!jobsCardsList) return;
        const q = radarSearchQuery ? radarSearchQuery.value.trim() : '';
        const loc = radarSearchLocation ? radarSearchLocation.value.trim() : 'Canada';
        const maxH = radarTimeFilter ? radarTimeFilter.value : '20';

        if (jobsCountBadge) jobsCountBadge.textContent = 'Scanning live feeds...';

        try {
            let url = `/api/jobs?query=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`;
            if (maxH && maxH !== '0') {
                url += `&max_hours=${encodeURIComponent(maxH)}`;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch jobs');
            const data = await res.json();
            const jobs = data.jobs || [];

            const filterLabel = maxH && maxH !== '0' ? ` (Posted ≤ ${maxH}h ago)` : '';
            if (jobsCountBadge) jobsCountBadge.textContent = `${jobs.length} Positions${filterLabel}`;
            renderJobs(jobs);
        } catch (e) {
            console.error('Jobs fetch error:', e);
            if (jobsCountBadge) jobsCountBadge.textContent = 'Scan error';
        }
    }

    if (radarTimeFilter) {
        radarTimeFilter.addEventListener('change', () => {
            loadJobs();
        });
    }

    function renderJobs(jobs) {
        if (!jobsCardsList) return;
        jobsCardsList.innerHTML = '';

        if (jobs.length === 0) {
            jobsCardsList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No matching internships found. Try clearing filters.</div>';
            return;
        }

        jobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'job-card';

            const tagsHtml = (job.tags || []).map(t => `<span class="job-tag">${t}</span>`).join('');

            card.innerHTML = `
                <div class="job-info-col">
                    <h4>${job.company} — <span style="font-weight: 400; color: #cbd5e1;">${job.title}</span></h4>
                    <div class="job-meta-row">
                        ${job.is_fresh_20h 
                            ? `<span class="badge-fresh">🔥 Posted ${job.posted_time_label || (job.posted_hours_ago + 'h ago')}</span>` 
                            : `<span class="badge-time">🕒 Posted ${job.posted_time_label || (job.posted_hours_ago + 'h ago')}</span>`}
                        <span>📍 ${job.location}</span>
                        <span>🗓️ ${job.term || 'Upcoming Term'}</span>
                        <span class="badge-success">${job.match_score || 90}% Match</span>
                        <span style="color: var(--text-dim);">via ${job.source}</span>
                    </div>
                    <div class="job-tags-row">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="job-action-col">
                    <button class="btn-autofill btn-run-autofill" data-url="${job.apply_url}" data-company="${job.company}" data-title="${job.title}">
                        ⚡ Auto-Apply (Bot)
                    </button>
                    <button class="btn-secondary btn-import-job" data-company="${job.company}" data-title="${job.title}">
                        📥 Tailor Resume
                    </button>
                    <a href="${job.apply_url}" target="_blank" class="btn-ghost">↗ Portal</a>
                </div>
            `;

            // Wire Auto-Apply button
            const btnRun = card.querySelector('.btn-run-autofill');
            btnRun.addEventListener('click', async () => {
                await triggerAutofill(job);
            });

            // Wire Tailor button
            const btnImport = card.querySelector('.btn-import-job');
            btnImport.addEventListener('click', () => {
                companyInput.value = job.company;
                roleInput.value = job.title;
                jobDescInput.value = `Target Role: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nTerm: ${job.term}\nTags & Tech: ${(job.tags || []).join(', ')}\n\nApply URL: ${job.apply_url}\n\nPlease tailor my resume for this ${job.company} ${job.title} internship position.`;
                
                // Switch to resume tab
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                document.querySelector('[data-tab="tab-resume"]').classList.add('active');
                document.getElementById('tab-resume').classList.add('active');

                // Trigger ATS Analysis
                btnAnalyze.click();
                showToast(`Imported ${job.company} into Tailor Panel!`);
            });

            jobsCardsList.appendChild(card);
        });
    }

    async function triggerAutofill(job) {
        if (!botStatusBanner) return;
        botStatusBanner.classList.remove('hidden');
        botConsoleTitle.textContent = `🤖 Browser Bot Active for ${job.company}`;
        botConsoleMsg.textContent = `Launching Playwright browser engine... Navigating to ${job.apply_url}...`;

        showToast(`Launching Playwright bot for ${job.company}... Watch your screen!`);

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
            showToast(`Auto-fill complete for ${job.company}! Review & submit.`);
        } catch (e) {
            botConsoleTitle.textContent = `⚠️ Bot Notice (${job.company})`;
            botConsoleMsg.textContent = `Automation note: ${e.message}. You can still complete the portal directly.`;
        }
    }

    if (btnScanJobs) {
        btnScanJobs.addEventListener('click', loadJobs);
    }

    // Auto-load on boot
    loadJobs();
});
