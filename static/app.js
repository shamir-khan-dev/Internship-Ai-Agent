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
            const targetEl = document.getElementById(targetTab);
            if (targetEl) {
                targetEl.classList.add('active');
            }
        });
    });

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
    const statQuantVal = document.getElementById('stat-quant-val');
    const statAiVal = document.getElementById('stat-ai-val');
    const statSystemVal = document.getElementById('stat-system-val');
    const statSavedVal = document.getElementById('stat-saved-val');
    const savedCountNum = document.getElementById('saved-count-num');

    // Local In-Memory Dataset & Filters State
    let allLoadedJobs = [];
    let activeCountry = 'all';
    let activeDomain = 'all';
    let savedJobIds = new Set(JSON.parse(localStorage.getItem('autotailor_saved_jobs') || '[]'));

    function updateSavedUI() {
        const count = savedJobIds.size;
        if (savedCountNum) savedCountNum.textContent = count;
        if (statSavedVal) statSavedVal.textContent = count;
    }
    updateSavedUI();

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

    // Instant Client-Side Filter Engine (0ms Latency)
    function applyClientFilters() {
        if (!jobsCardsList) return;
        
        const q = radarSearchQuery ? radarSearchQuery.value.trim().toLowerCase() : '';
        const loc = radarSearchLocation ? radarSearchLocation.value.trim().toLowerCase() : '';
        const maxH = radarTimeFilter ? parseFloat(radarTimeFilter.value) : 0;

        // Dynamic stats calculation across entire dataset
        let freshCount = 0;
        let quantCount = 0;
        let aiCount = 0;
        let systemCount = 0;

        allLoadedJobs.forEach(j => {
            if (j.is_fresh_20h) freshCount++;
            if (j.domain === 'quant') quantCount++;
            if (j.domain === 'ai') aiCount++;
            if (j.domain === 'backend') systemCount++;
        });

        if (statTotalVal) statTotalVal.textContent = allLoadedJobs.length.toLocaleString() + '+';
        if (statFreshVal) statFreshVal.textContent = freshCount.toLocaleString();
        if (statQuantVal) statQuantVal.textContent = quantCount.toLocaleString();
        if (statAiVal) statAiVal.textContent = aiCount.toLocaleString();
        if (statSystemVal) statSystemVal.textContent = systemCount.toLocaleString();
        updateSavedUI();

        const filtered = allLoadedJobs.filter(j => {
            // Market Filter
            if (activeCountry === 'saved') {
                if (!savedJobIds.has(j.id)) return false;
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
        if (activeCountry !== 'all') filterSummary.push(activeCountry === 'saved' ? 'Saved' : activeCountry.toUpperCase());
        if (activeDomain !== 'all') filterSummary.push(activeDomain.toUpperCase());
        if (maxH > 0) filterSummary.push(`≤ ${maxH}h`);
        const labelExtra = filterSummary.length > 0 ? ` (${filterSummary.join(' • ')})` : '';

        if (jobsCountBadge) {
            jobsCountBadge.textContent = `${filtered.length} Positions${labelExtra}`;
        }

        renderJobs(filtered);
    }

    // Market Pills Click
    document.querySelectorAll('.market-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.market-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCountry = btn.getAttribute('data-country') || 'all';
            applyClientFilters();
        });
    });

    // Domain Pills Click
    document.querySelectorAll('.domain-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.domain-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeDomain = btn.getAttribute('data-domain') || 'all';
            applyClientFilters();
        });
    });

    // Debounced Search Inputs (Instant 120ms feedback)
    let searchDebounce = null;
    if (radarSearchQuery) {
        radarSearchQuery.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(applyClientFilters, 120);
        });
    }
    if (radarSearchLocation) {
        radarSearchLocation.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(applyClientFilters, 120);
        });
    }

    if (radarTimeFilter) {
        radarTimeFilter.addEventListener('change', () => {
            applyClientFilters();
        });
    }

    // Load full live dataset from server
    async function loadJobs() {
        if (!jobsCardsList) return;
        if (jobsCountBadge) jobsCountBadge.textContent = 'Syncing 1,750+ verified feeds...';

        try {
            const res = await fetch('/api/jobs?country=all');
            if (!res.ok) throw new Error('Failed to fetch jobs');
            const data = await res.json();
            allLoadedJobs = data.jobs || [];

            applyClientFilters();
        } catch (e) {
            console.error('Jobs fetch error:', e);
            if (jobsCountBadge) jobsCountBadge.textContent = 'Sync error — retrying';
        }
    }

    function renderJobs(jobs) {
        if (!jobsCardsList) return;
        jobsCardsList.innerHTML = '';

        if (jobs.length === 0) {
            jobsCardsList.innerHTML = `
                <div style="padding: 44px 20px; text-align: center; color: var(--text-tertiary); background: var(--apple-surface-card); border-radius: var(--radius-lg); border: 1px solid var(--apple-border);">
                    <div style="font-size: 36px; margin-bottom: 8px;">🔍</div>
                    <div style="font-size: 14.5px; font-weight: 600; color: var(--text-secondary);">No matching internships found</div>
                    <div style="font-size: 12.5px; margin-top: 4px; color: var(--text-tertiary);">Try clearing keywords, selecting "All Locations", or switching technical domains.</div>
                </div>
            `;
            return;
        }

        // Render first 100 for high performance, scroll for more
        const slice = jobs.slice(0, 100);

        slice.forEach(job => {
            const card = document.createElement('div');
            card.className = 'job-card';

            const tagsHtml = (job.tags || []).map(t => `<span class="job-tag">${t}</span>`).join('');
            const isSaved = savedJobIds.has(job.id);

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

            card.innerHTML = `
                <div class="job-info-col">
                    <div class="job-card-title-row">
                        <a href="${job.apply_url}" target="_blank" rel="noopener noreferrer" class="job-title-link" title="Click to open direct application page">
                            <span>${job.company}</span>
                            <span style="color: var(--text-tertiary); font-weight: 300;">—</span>
                            <span class="job-title-role">${job.title}</span>
                            <span style="font-size: 13px; opacity: 0.65;">↗</span>
                        </a>
                    </div>
                    <div class="job-meta-row">
                        ${job.is_fresh_20h 
                            ? `<span class="badge-fresh">🔥 Posted ${job.posted_time_label || (job.posted_hours_ago + 'h ago')}</span>` 
                            : `<span class="badge-time">🕒 Posted ${job.posted_time_label || (job.posted_hours_ago + 'h ago')}</span>`}
                        <span class="country-badge">${countryLabel}</span>
                        <span class="domain-badge">${domainBadge}</span>
                        <span>📍 ${job.location}</span>
                        <span>🗓️ ${job.term || 'Upcoming Term'}</span>
                        <span class="badge-success">${job.match_score || 92}% Match</span>
                        <span class="badge-neutral" style="font-size: 11px;">via ${job.source || 'Direct ATS'}</span>
                    </div>
                    <div class="job-tags-row">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="job-action-col">
                    <button class="btn-save-job ${isSaved ? 'saved' : ''}" data-id="${job.id}">
                        ${isSaved ? '★ Saved' : '⭐ Save'}
                    </button>
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

            // Wire Auto-Apply button
            const btnRun = card.querySelector('.btn-run-autofill');
            btnRun.addEventListener('click', async (e) => {
                e.stopPropagation();
                await triggerAutofill(job);
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

            jobsCardsList.appendChild(card);
        });

        if (jobs.length > 100) {
            const moreBanner = document.createElement('div');
            moreBanner.style.cssText = 'padding: 16px; text-align: center; color: var(--text-tertiary); font-size: 12.5px;';
            moreBanner.textContent = `Showing top 100 of ${jobs.length.toLocaleString()} matching positions. Use search or domain filters to narrow down.`;
            jobsCardsList.appendChild(moreBanner);
        }
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
        btnScanJobs.addEventListener('click', loadJobs);
    }

    // Auto-load on boot
    loadJobs();
});
