// AutoTailor AI — Popup Controller

document.addEventListener("DOMContentLoaded", () => {
    const statusText = document.getElementById("status-text");
    const statusBadge = document.getElementById("agent-status");
    const btnAutofill = document.getElementById("btn-popup-autofill");
    const btnCopyResume = document.getElementById("btn-popup-copy-resume");
    const feedbackMsg = document.getElementById("autofill-feedback");
    const btnQA = document.getElementById("btn-popup-qa");
    const qaInput = document.getElementById("qa-input");
    const qaResult = document.getElementById("qa-result");

    let cachedResumeText = "";

    // Check connectivity to AutoTailor local server and fetch profile
    fetch("http://127.0.0.1:8500/api/candidate-profile")
        .then(res => res.json())
        .then(data => {
            statusText.textContent = "Agent Active";
            if (data && data.resume_plain_text) {
                cachedResumeText = data.resume_plain_text;
            }
        })
        .catch(() => {
            statusText.textContent = "Local Profile Mode";
            statusBadge.style.color = "#38bdf8";
            statusBadge.style.borderColor = "rgba(56, 189, 248, 0.3)";
        });

    // 1-Click Autofill Current Tab
    btnAutofill.addEventListener("click", async () => {
        btnAutofill.disabled = true;
        btnAutofill.innerHTML = `<span>⏳ Autofilling Fields...</span>`;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) {
                throw new Error("No active tab found");
            }

            // Send message to content script
            chrome.tabs.sendMessage(tab.id, { action: "autofill" }, (response) => {
                btnAutofill.disabled = false;
                btnAutofill.innerHTML = `<span>⚡ 1-Click Autofill Current Step</span>`;

                if (chrome.runtime.lastError || !response) {
                    feedbackMsg.textContent = "Please ensure you are on an active job application page or refresh the page.";
                    feedbackMsg.style.color = "#ff9f0a";
                    feedbackMsg.classList.remove("hidden");
                } else {
                    feedbackMsg.textContent = `✓ Filled ${response.count} fields (${response.fields.slice(0, 4).join(", ")}${response.fields.length > 4 ? "..." : ""})`;
                    feedbackMsg.style.color = "#30d158";
                    feedbackMsg.classList.remove("hidden");
                }
            });
        } catch (e) {
            btnAutofill.disabled = false;
            btnAutofill.innerHTML = `<span>⚡ 1-Click Autofill Current Step</span>`;
            feedbackMsg.textContent = "Autofill notice: " + e.message;
            feedbackMsg.classList.remove("hidden");
        }
    });

    // Copy Resume Plain-Text
    if (btnCopyResume) {
        btnCopyResume.addEventListener("click", async () => {
            const fallbackResume = `SHAMIR KHAN\nOntario, Canada | (647)-606-6063 | shamirk2121@gmail.com\nLinkedIn: linkedin.com/in/shamir-khan-40698123b | GitHub: github.com/shamir-khan-dev\nWilfrid Laurier University | Computer Science '28 | GPA: 3.8`;
            const textToCopy = cachedResumeText || fallbackResume;

            try {
                await navigator.clipboard.writeText(textToCopy);
                feedbackMsg.textContent = "✓ Copied Shamir's Plain-Text Resume to Clipboard!";
                feedbackMsg.style.color = "#30d158";
                feedbackMsg.classList.remove("hidden");
            } catch (err) {
                // Try sending to content script
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: "copy_resume" });
                    feedbackMsg.textContent = "✓ Copied Shamir's Plain-Text Resume!";
                    feedbackMsg.style.color = "#30d158";
                    feedbackMsg.classList.remove("hidden");
                }
            }
        });
    }

    // AI Q&A Solver
    btnQA.addEventListener("click", async () => {
        const question = qaInput.value.trim();
        if (!question) return;

        btnQA.disabled = true;
        btnQA.textContent = "Solving with Gemini...";

        try {
            const res = await fetch("http://127.0.0.1:8500/api/generate-qa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_text: "Software Engineering Internship",
                    question: question,
                    company_name: "the company"
                })
            });

            if (!res.ok) throw new Error("Q&A generation failed");
            const data = await res.json();
            qaResult.value = data.answer;
            qaResult.classList.remove("hidden");
        } catch (e) {
            qaResult.value = "Tip: Make sure AutoTailor dashboard is running on port 8500.\n\nError: " + e.message;
            qaResult.classList.remove("hidden");
        } finally {
            btnQA.disabled = false;
            btnQA.textContent = "Solve with Gemini";
        }
    });
});
