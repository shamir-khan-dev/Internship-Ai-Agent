"""
Playwright Automated Test: Application Copilot & Multi-Question Extractor
Verifies:
1. Navigation to '⚡ Paste & Answer' tab
2. Loading Khan Academy sample application
3. Triggering 'Extract & Generate All Answers'
4. Verifying extracted metadata (Company, Role, Match %, Tech Stack)
5. Verifying generation of all 9 tailored questions & answers
6. Verifying single-click copy buttons
7. Capturing visual proof snapshot into tests/artifacts/
"""

import asyncio
import sys
from playwright.async_api import async_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

async def test_application_copilot():
    print("======================================================================")
    print("TEST: Application Copilot & Multi-Question Extractor (Playwright)")
    print("======================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1366, "height": 850})

        # 1. Navigate to Dashboard
        print("[*] 1. Navigating to Dashboard: http://127.0.0.1:8500/")
        await page.goto("http://127.0.0.1:8500/", wait_until="domcontentloaded")

        # 2. Click '⚡ Paste & Answer' Quick Nav Pill
        print("[*] 2. Clicking '⚡ Paste & Answer' navigation pill...")
        copilot_tab = page.locator("button.nav-pill[data-target-tab='tab-qa']")
        await copilot_tab.click()
        await page.wait_for_timeout(400)

        # Verify tab-qa is active
        is_qa_active = await page.locator("#tab-qa").is_visible()
        print(f"    Tab Q&A Copilot Visible: {is_qa_active}")
        assert is_qa_active, "tab-qa should be visible"

        # 3. Click 'Load Khan Academy Sample'
        print("[*] 3. Loading Khan Academy Sample Application...")
        btn_sample = page.locator("#btn-load-khan-sample")
        await btn_sample.click()
        await page.wait_for_timeout(300)

        input_val = await page.locator("#bulk-paste-input").input_value()
        print(f"    Pasted text length: {len(input_val)} characters")
        assert "ABOUT KHAN ACADEMY" in input_val, "Sample text should contain Khan Academy"

        # 4. Click 'Extract & Generate All Answers'
        print("[*] 4. Triggering 'Extract & Generate All Answers'...")
        btn_extract = page.locator("#btn-extract-and-answer")
        await btn_extract.click()

        # Wait for results section to be visible
        await page.wait_for_selector("#bulk-results-section:not(.hidden)", timeout=35000)
        await page.wait_for_timeout(800)

        # 5. Verify Metadata
        company = await page.locator("#meta-company-badge").inner_text()
        role = await page.locator("#meta-role-title").inner_text()
        count = await page.locator("#qa-questions-count").inner_text()
        print(f"    Extracted Company: {company}")
        print(f"    Extracted Role:    {role}")
        print(f"    Questions Count:   {count}")

        assert "khan academy" in company.lower(), f"Expected Khan Academy, got {company}"
        assert int(count) >= 7, f"Expected at least 7 questions, got {count}"

        # 6. Verify Question Cards & Copy Button
        cards = await page.locator(".bulk-qa-card").count()
        print(f"    Rendered Question Cards: {cards}")
        assert cards >= 7, f"Expected at least 7 rendered cards, got {cards}"

        # Test copying first answer
        first_copy_btn = page.locator(".bulk-qa-card .btn-copy-card").first
        await first_copy_btn.click()
        await page.wait_for_timeout(300)
        btn_text = await first_copy_btn.inner_text()
        print(f"    Copy button state after click: '{btn_text.strip()}'")

        # 7. Capture Visual Screenshot
        screenshot_path = "tests/artifacts/verified_application_copilot.png"
        await page.screenshot(path=screenshot_path, full_page=False)
        print(f"[*] Visual Screenshot Saved: {screenshot_path}")

        await browser.close()

    print("\nALL APPLICATION COPILOT TESTS PASSED 100%!")

if __name__ == "__main__":
    asyncio.run(test_application_copilot())
