// AutoTailor AI — Content Script & Smart ATS Autofill
(function() {
    // Default Candidate Profile for Shamir Khan
    let profile = {
        first_name: "Shamir",
        last_name: "Khan",
        full_name: "Shamir Khan",
        email: "shamirk2121@gmail.com",
        phone: "(647) 606-6063",
        linkedin: "https://linkedin.com/in/shamir-khan-dev",
        github: "https://github.com/shamir-khan-dev",
        website: "https://shamirkhan.dev",
        location: "Kitchener, ON, Canada",
        city: "Kitchener",
        province: "Ontario",
        country: "Canada",
        university: "Wilfrid Laurier University",
        degree: "Bachelor of Science (BSc)",
        major: "Computer Science",
        grad_month: "April",
        grad_year: "2028",
        grad_date: "04/2028",
        gpa: "3.9",
        work_auth_canada: true,
        sponsorship_required: false
    };

    // Try fetching latest candidate profile from local AutoTailor backend
    fetch("http://127.0.0.1:8500/api/candidate-profile")
        .then(r => r.json())
        .then(data => {
            if (data && data.first_name) {
                profile = Object.assign(profile, data);
            }
        })
        .catch(() => {
            // Local server offline or not running, use embedded default
        });

    // Helper: simulate human typing and dispatch reactive events for React/Workday/Angular
    function setInputValue(input, val) {
        if (!input || !val) return false;
        
        input.focus();
        
        // Native setter for React-controlled inputs
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        
        if (input.tagName === "TEXTAREA" && nativeTextAreaValueSetter) {
            nativeTextAreaValueSetter.call(input, val);
        } else if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, val);
        } else {
            input.value = val;
        }

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        return true;
    }

    // Smart Heuristic Autofill Engine
    function executeAutofill() {
        let filledCount = 0;
        const filledFields = [];

        const mappings = [
            // First Name
            {
                selectors: ["input[name*='first_name' i]", "input[id*='first_name' i]", "input[autocomplete='given-name']", "input[aria-label*='first name' i]"],
                val: profile.first_name,
                name: "First Name"
            },
            // Last Name
            {
                selectors: ["input[name*='last_name' i]", "input[id*='last_name' i]", "input[autocomplete='family-name']", "input[aria-label*='last name' i]"],
                val: profile.last_name,
                name: "Last Name"
            },
            // Email
            {
                selectors: ["input[type='email']", "input[name*='email' i]", "input[id*='email' i]", "input[autocomplete='email']"],
                val: profile.email,
                name: "Email"
            },
            // Phone
            {
                selectors: ["input[type='tel']", "input[name*='phone' i]", "input[id*='phone' i]", "input[placeholder*='phone' i]"],
                val: profile.phone,
                name: "Phone Number"
            },
            // LinkedIn
            {
                selectors: ["input[name*='linkedin' i]", "input[id*='linkedin' i]", "input[placeholder*='linkedin' i]"],
                val: profile.linkedin,
                name: "LinkedIn"
            },
            // GitHub
            {
                selectors: ["input[name*='github' i]", "input[id*='github' i]", "input[placeholder*='github' i]"],
                val: profile.github,
                name: "GitHub"
            },
            // Portfolio / Website
            {
                selectors: ["input[name*='website' i]", "input[name*='portfolio' i]", "input[id*='website' i]", "input[placeholder*='website' i]"],
                val: profile.website,
                name: "Website"
            },
            // Location / City
            {
                selectors: ["input[name*='location' i]", "input[name*='city' i]", "input[id*='location' i]", "input[placeholder*='city' i]"],
                val: profile.location,
                name: "Location"
            },
            // School / University
            {
                selectors: ["input[name*='school' i]", "input[name*='university' i]", "input[id*='school' i]", "input[placeholder*='school' i]"],
                val: profile.university,
                name: "University"
            },
            // Degree
            {
                selectors: ["input[name*='degree' i]", "input[id*='degree' i]", "input[placeholder*='degree' i]"],
                val: profile.degree,
                name: "Degree"
            },
            // Major / Discipline
            {
                selectors: ["input[name*='discipline' i]", "input[name*='major' i]", "input[id*='major' i]", "input[placeholder*='major' i]"],
                val: profile.major,
                name: "Major"
            }
        ];

        // Execute mapped field filling
        mappings.forEach(m => {
            for (const sel of m.selectors) {
                const el = document.querySelector(sel);
                if (el && !el.value && el.offsetParent !== null) {
                    if (setInputValue(el, m.val)) {
                        filledCount++;
                        filledFields.push(m.name);
                        break;
                    }
                }
            }
        });

        // Full Name fallback if first/last not detected
        if (!filledFields.includes("First Name")) {
            const nameSels = ["input[name*='name' i]", "input[id*='name' i]", "input[placeholder*='full name' i]"];
            for (const sel of nameSels) {
                const el = document.querySelector(sel);
                if (el && !el.value && el.type !== "hidden" && el.offsetParent !== null) {
                    if (setInputValue(el, profile.full_name)) {
                        filledCount++;
                        filledFields.push("Full Name");
                        break;
                    }
                }
            }
        }

        // Radio Buttons (Work authorization, legal eligibility, sponsorship)
        const labels = Array.from(document.querySelectorAll("label, span, div"));
        labels.forEach(lbl => {
            const txt = (lbl.innerText || "").toLowerCase();
            
            // Work authorization = Yes
            if ((txt.includes("legally") && txt.includes("authorized")) || 
                (txt.includes("eligible to work") && txt.includes("canada")) ||
                (txt.includes("right to work") && txt.includes("canada"))) {
                
                const yesRadio = lbl.parentElement?.querySelector("input[value*='yes' i], input[value='1'], input[id*='yes' i]") ||
                                 document.querySelector("input[value*='yes' i]");
                if (yesRadio && !yesRadio.checked) {
                    yesRadio.click();
                    filledCount++;
                }
            }

            // Sponsorship = No
            if ((txt.includes("require") && txt.includes("sponsorship")) ||
                (txt.includes("visa sponsorship"))) {
                const noRadio = lbl.parentElement?.querySelector("input[value*='no' i], input[value='0'], input[id*='no' i]");
                if (noRadio && !noRadio.checked) {
                    noRadio.click();
                    filledCount++;
                }
            }
        });

        return { count: filledCount, fields: filledFields };
    }

    // Floating Apple-Style Glass Widget
    function injectFloatingWidget() {
        if (document.getElementById("autotailor-floating-widget")) return;

        const widget = document.createElement("div");
        widget.id = "autotailor-floating-widget";
        widget.className = "autotailor-widget";

        widget.innerHTML = `
            <div class="autotailor-widget-inner">
                <div class="autotailor-widget-header">
                    <div class="autotailor-badge">
                        <span class="autotailor-dot"></span>
                        <span class="autotailor-title">AutoTailor AI</span>
                    </div>
                    <button class="autotailor-btn-min" id="autotailor-min-btn" title="Minimize">✕</button>
                </div>
                <div class="autotailor-widget-body" id="autotailor-body">
                    <div class="autotailor-candidate-name">Shamir Khan (Laurier CS)</div>
                    <div class="autotailor-status-msg" id="autotailor-status">ATS Portal Detected</div>
                    <button class="autotailor-btn-autofill" id="autotailor-fill-btn">
                        <span>⚡ 1-Click Autofill</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        // Wire actions
        const fillBtn = document.getElementById("autotailor-fill-btn");
        const statusMsg = document.getElementById("autotailor-status");
        const minBtn = document.getElementById("autotailor-min-btn");
        const bodyEl = document.getElementById("autotailor-body");

        fillBtn.addEventListener("click", () => {
            fillBtn.disabled = true;
            fillBtn.innerHTML = `<span>⏳ Autofilling...</span>`;
            
            setTimeout(() => {
                const res = executeAutofill();
                fillBtn.disabled = false;
                fillBtn.innerHTML = `<span>✓ Completed (${res.count} Fields)</span>`;
                statusMsg.textContent = res.count > 0 ? `Filled: ${res.fields.join(", ")}` : "Fields already filled or manual review needed";
                statusMsg.style.color = "#30d158";
            }, 300);
        });

        minBtn.addEventListener("click", () => {
            widget.classList.toggle("autotailor-collapsed");
            minBtn.textContent = widget.classList.contains("autotailor-collapsed") ? "⚡" : "✕";
        });
    }

    // Auto-inject when ATS forms are present
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectFloatingWidget);
    } else {
        injectFloatingWidget();
    }

    // Listen for extension popup trigger
    chrome.runtime?.onMessage?.addListener((req, sender, sendResponse) => {
        if (req.action === "autofill") {
            const res = executeAutofill();
            sendResponse(res);
        }
    });
})();
