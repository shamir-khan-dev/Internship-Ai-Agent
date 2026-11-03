# Playwright Auto-Applier Engine for Tech Internships
import os
import time
import asyncio
from typing import Dict, Any, Optional
from backend.candidate_profile import CANDIDATE_PROFILE

async def run_autofill_job(url: str, resume_path: Optional[str] = None, headless: bool = False) -> Dict[str, Any]:
    """
    Launches browser automation using Playwright to navigate to the job application URL,
    identify standard ATS form inputs (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, IBM/BrassRing),
    autofill Shamir's profile information, and attach the tailored resume PDF.
    """
    from playwright.async_api import async_playwright
    
    pdf_to_upload = resume_path or CANDIDATE_PROFILE['default_resume_pdf']
    if not os.path.exists(pdf_to_upload):
        # Fallback to master
        pdf_to_upload = r"C:\Users\shami\OneDrive\Desktop\Resumes\Shamir_Khan_SWE_Latest.pdf"
        
    results = {
        "url": url,
        "fields_filled": [],
        "resume_attached": False,
        "status": "In Progress",
        "message": ""
    }

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=headless,
                args=["--start-maximized", "--disable-blink-features=AutomationControlled"]
            )
            context = await browser.new_context(
                no_viewport=True,
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
            )
            page = await context.new_page()

            # Navigate
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            await asyncio.sleep(2)

            # Check if this is an option screen (e.g. IBM "Copy & Paste" vs "From Device")
            copy_paste_btn = await page.query_selector("button:has-text('Copy & Paste'), div:has-text('Copy & Paste'), a:has-text('Copy & Paste')")
            if copy_paste_btn and await copy_paste_btn.is_visible():
                try:
                    await copy_paste_btn.click()
                    await asyncio.sleep(1)
                    # Check for resume textarea
                    resume_ta = await page.query_selector("textarea")
                    if resume_ta:
                        await resume_ta.fill(CANDIDATE_PROFILE.get('resume_plain_text', ''))
                        results["fields_filled"].append("Resume Plain-Text Pasted")
                except Exception:
                    pass

            # Comprehensive ATS input mappings (Greenhouse, Lever, Workday, Ashby, iCIMS)
            mappings = [
                # First Name
                ([
                    "input[name*='first_name' i]", "input[id*='first_name' i]", "input[autocomplete='given-name']",
                    "input[data-automation-id*='firstName' i]", "input[placeholder*='first name' i]",
                    "input[aria-label*='first name' i]"
                ], CANDIDATE_PROFILE['first_name'], "First Name"),

                # Last Name
                ([
                    "input[name*='last_name' i]", "input[id*='last_name' i]", "input[autocomplete='family-name']",
                    "input[data-automation-id*='lastName' i]", "input[placeholder*='last name' i]",
                    "input[aria-label*='last name' i]"
                ], CANDIDATE_PROFILE['last_name'], "Last Name"),

                # Email
                ([
                    "input[type='email']", "input[name*='email' i]", "input[id*='email' i]",
                    "input[autocomplete='email']", "input[data-automation-id*='email' i]"
                ], CANDIDATE_PROFILE['email'], "Email"),

                # Confirm Email
                ([
                    "input[name*='confirm' i][name*='email' i]", "input[id*='confirm' i][id*='email' i]",
                    "input[data-automation-id*='confirmEmail' i]"
                ], CANDIDATE_PROFILE['email'], "Confirm Email"),

                # Phone
                ([
                    "input[type='tel']", "input[name*='phone' i]", "input[id*='phone' i]",
                    "input[data-automation-id*='phone' i]", "input[placeholder*='phone' i]"
                ], CANDIDATE_PROFILE['phone'], "Phone Number"),

                # Street Address
                ([
                    "input[name*='street' i]", "input[name*='addressLine1' i]", "input[id*='addressLine1' i]",
                    "input[autocomplete='address-line1']", "input[data-automation-id*='addressLine1' i]"
                ], CANDIDATE_PROFILE['street_address'], "Street Address"),

                # City
                ([
                    "input[name*='city' i]", "input[id*='city' i]", "input[autocomplete='address-level2']",
                    "input[data-automation-id*='city' i]", "input[placeholder*='city' i]"
                ], CANDIDATE_PROFILE['city'], "City"),

                # State / Province
                ([
                    "input[name*='state' i]", "input[name*='province' i]", "input[id*='province' i]",
                    "input[data-automation-id*='countryRegion' i]"
                ], CANDIDATE_PROFILE['state_province'], "Province"),

                # Postal / Zip Code
                ([
                    "input[name*='postal' i]", "input[name*='zip' i]", "input[id*='postal' i]",
                    "input[data-automation-id*='postalCode' i]"
                ], CANDIDATE_PROFILE['postal_code'], "Postal Code"),

                # LinkedIn
                ([
                    "input[name*='linkedin' i]", "input[id*='linkedin' i]", "input[placeholder*='linkedin' i]",
                    "input[aria-label*='linkedin' i]"
                ], CANDIDATE_PROFILE['linkedin'], "LinkedIn URL"),

                # GitHub
                ([
                    "input[name*='github' i]", "input[id*='github' i]", "input[placeholder*='github' i]",
                    "input[aria-label*='github' i]"
                ], CANDIDATE_PROFILE['github'], "GitHub URL"),

                # Website / Portfolio
                ([
                    "input[name*='website' i]", "input[name*='portfolio' i]", "input[id*='website' i]",
                    "input[placeholder*='portfolio' i]"
                ], CANDIDATE_PROFILE['portfolio'], "Personal Website"),

                # University
                ([
                    "input[name*='school' i]", "input[name*='university' i]", "input[id*='school' i]",
                    "input[id*='university' i]", "input[data-automation-id*='school' i]"
                ], CANDIDATE_PROFILE['university'], "University"),

                # Degree
                ([
                    "input[name*='degree' i]", "input[id*='degree' i]", "input[data-automation-id*='degree' i]"
                ], CANDIDATE_PROFILE['degree'], "Degree"),

                # Discipline / Major
                ([
                    "input[name*='discipline' i]", "input[name*='major' i]", "input[id*='major' i]"
                ], CANDIDATE_PROFILE['discipline'], "Major / Discipline"),

                # GPA
                ([
                    "input[name*='gpa' i]", "input[id*='gpa' i]", "input[data-automation-id*='gpa' i]"
                ], CANDIDATE_PROFILE['gpa'], "GPA"),

                # Graduation Year
                ([
                    "input[name*='grad' i][name*='year' i]", "input[id*='grad' i][id*='year' i]"
                ], CANDIDATE_PROFILE['graduation_year'], "Grad Year")
            ]

            for selectors, value, label in mappings:
                for sel in selectors:
                    try:
                        el = await page.query_selector(sel)
                        if el and await el.is_visible() and await el.is_enabled():
                            curr = await el.input_value()
                            if not curr:
                                await el.fill(str(value))
                                results["fields_filled"].append(label)
                                break
                    except Exception:
                        continue

            # Full Name fallback
            if "First Name" not in results["fields_filled"] and "Last Name" not in results["fields_filled"]:
                name_selectors = ["input[name*='name' i]", "input[id*='name' i]", "input[placeholder*='full name' i]"]
                for sel in name_selectors:
                    try:
                        el = await page.query_selector(sel)
                        if el and await el.is_visible() and await el.is_enabled():
                            curr = await el.input_value()
                            if not curr:
                                await el.fill(CANDIDATE_PROFILE['full_name'])
                                results["fields_filled"].append("Full Name")
                                break
                    except Exception:
                        pass

            # Resume file upload
            if os.path.exists(pdf_to_upload):
                file_inputs = await page.query_selector_all("input[type='file']")
                for finput in file_inputs:
                    try:
                        accept = await finput.get_attribute("accept") or ""
                        name = await finput.get_attribute("name") or ""
                        if "pdf" in accept or "resume" in name.lower() or "cv" in name.lower() or len(file_inputs) == 1:
                            await finput.set_input_files(pdf_to_upload)
                            results["resume_attached"] = True
                            results["fields_filled"].append("Resume PDF Attached")
                            break
                    except Exception:
                        continue

            # Radio Buttons & Checkboxes (Work Auth = Yes, Sponsorship = No, 18+ = Yes, Enrolled = Yes)
            try:
                labels = await page.query_selector_all("label, span, div")
                for lbl in labels:
                    txt = (await lbl.inner_text() or "").lower()
                    if len(txt) > 250:
                        continue

                    # Authorized in Canada = YES
                    if ("legally" in txt and "authorized" in txt) or ("eligible to work" in txt and "canada" in txt):
                        parent = await lbl.query_selector("xpath=..")
                        radio = await parent.query_selector("input[value*='yes' i], input[value='1'], input[id*='yes' i]") if parent else None
                        if radio and not await radio.is_checked():
                            await radio.check()
                            results["fields_filled"].append("Work Auth (Yes)")

                    # Sponsorship = NO
                    if ("require" in txt and "sponsorship" in txt) or ("visa sponsorship" in txt):
                        parent = await lbl.query_selector("xpath=..")
                        radio = await parent.query_selector("input[value*='no' i], input[value='0'], input[id*='no' i]") if parent else None
                        if radio and not await radio.is_checked():
                            await radio.check()
                            results["fields_filled"].append("Sponsorship (No)")

                    # 18 or older = YES
                    if "18 years of age" in txt or "are you 18" in txt:
                        parent = await lbl.query_selector("xpath=..")
                        radio = await parent.query_selector("input[value*='yes' i], input[value='1'], input[id*='yes' i]") if parent else None
                        if radio and not await radio.is_checked():
                            await radio.check()
                            results["fields_filled"].append("Age 18+ (Yes)")
            except Exception:
                pass

            results["status"] = "Ready For Review"
            results["message"] = f"Auto-filled {len(results['fields_filled'])} fields. Resume: {'Attached' if results['resume_attached'] else 'Manual'}. Ready for submission review."

            # Save snapshot proof in artifacts/scratch
            screenshot_path = os.path.join(os.path.dirname(__file__), "..", "autofill_last_run.png")
            try:
                await page.screenshot(path=screenshot_path, full_page=False)
                results["screenshot"] = screenshot_path
            except Exception:
                pass

            await browser.close()
            return results

    except Exception as e:
        results["status"] = "Error"
        results["message"] = f"Automation encountered an error: {str(e)}"
        return results

if __name__ == "__main__":
    import sys
    test_url = sys.argv[1] if len(sys.argv) > 1 else "https://boards.greenhouse.io/hrt/jobs/7004186002"
    res = asyncio.run(run_autofill_job(test_url, headless=True))
    print("Autofill Result:", res)
