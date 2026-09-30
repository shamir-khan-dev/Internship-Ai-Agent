# Playwright Auto-Applier Engine for Tech Internships
import os
import time
import asyncio
from typing import Dict, Any, Optional
from backend.candidate_profile import CANDIDATE_PROFILE

async def run_autofill_job(url: str, resume_path: Optional[str] = None, headless: bool = False) -> Dict[str, Any]:
    """
    Launches browser automation using Playwright to navigate to the job application URL,
    identify standard ATS form inputs (Greenhouse, Lever, Workday, Ashby, etc.),
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
            context = await browser.new_context(no_viewport=True)
            page = await context.new_page()

            # Navigate
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            await asyncio.sleep(2)

            # Heuristics for common ATS form fields
            mappings = [
                # First Name
                (["input[name*='first_name' i]", "input[id*='first_name' i]", "input[autocomplete='given-name']"], CANDIDATE_PROFILE['first_name'], "First Name"),
                # Last Name
                (["input[name*='last_name' i]", "input[id*='last_name' i]", "input[autocomplete='family-name']"], CANDIDATE_PROFILE['last_name'], "Last Name"),
                # Email
                (["input[type='email']", "input[name*='email' i]", "input[id*='email' i]"], CANDIDATE_PROFILE['email'], "Email"),
                # Phone
                (["input[type='tel']", "input[name*='phone' i]", "input[id*='phone' i]"], CANDIDATE_PROFILE['phone'], "Phone Number"),
                # LinkedIn
                (["input[name*='linkedin' i]", "input[id*='linkedin' i]", "input[placeholder*='linkedin' i]"], CANDIDATE_PROFILE['linkedin'], "LinkedIn URL"),
                # GitHub
                (["input[name*='github' i]", "input[id*='github' i]", "input[placeholder*='github' i]"], CANDIDATE_PROFILE['github'], "GitHub URL"),
                # Website / Portfolio
                (["input[name*='website' i]", "input[name*='portfolio' i]", "input[id*='website' i]"], CANDIDATE_PROFILE['website'], "Personal Website"),
                # Location / City
                (["input[name*='location' i]", "input[name*='city' i]", "input[id*='location' i]"], CANDIDATE_PROFILE['city'] + ", ON, Canada", "Location"),
                # University
                (["input[name*='school' i]", "input[name*='university' i]", "input[id*='school' i]"], CANDIDATE_PROFILE['university'], "University"),
                # Degree
                (["input[name*='degree' i]", "input[id*='degree' i]"], CANDIDATE_PROFILE['degree'], "Degree"),
                # Discipline
                (["input[name*='discipline' i]", "input[name*='major' i]"], CANDIDATE_PROFILE['discipline'], "Major / Discipline")
            ]

            for selectors, value, label in mappings:
                for sel in selectors:
                    try:
                        el = await page.query_selector(sel)
                        if el and await el.is_visible() and await el.is_enabled():
                            # Check if empty
                            curr = await el.input_value()
                            if not curr:
                                await el.fill(value)
                                results["fields_filled"].append(label)
                                break
                    except Exception:
                        continue

            # Full Name fallback if first/last not found
            if "First Name" not in results["fields_filled"]:
                name_selectors = ["input[name*='name' i]", "input[id*='name' i]"]
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
                        # Most resume uploads have resume or pdf in accept/name or are the first file input
                        if "pdf" in accept or "resume" in name.lower() or "cv" in name.lower() or len(file_inputs) == 1:
                            await finput.set_input_files(pdf_to_upload)
                            results["resume_attached"] = True
                            results["fields_filled"].append("Resume PDF Attached")
                            break
                    except Exception:
                        continue

            # Legal work authorization radios / selects
            try:
                # Click 'Yes' for legal work auth in Canada
                labels = await page.query_selector_all("label")
                for lbl in labels:
                    txt = (await lbl.inner_text()).lower()
                    if ("legally" in txt and "authorized" in txt) or ("eligible to work" in txt):
                        # Find closest radio or parent
                        radio = await lbl.query_selector("input[type='radio']")
                        if radio:
                            await radio.check()
                            results["fields_filled"].append("Work Auth (Yes)")
            except Exception:
                pass

            results["status"] = "Ready For Review"
            results["message"] = f"Auto-filled {len(results['fields_filled'])} fields. Resume: {'Attached' if results['resume_attached'] else 'Manual'}. Ready for submission review."

            # If headed mode, keep window open so the user can inspect & submit
            if not headless:
                # Keep alive for 45s for the user to review
                await asyncio.sleep(45)

            await browser.close()
            return results

    except Exception as e:
        results["status"] = "Error"
        results["message"] = str(e)
        return results
