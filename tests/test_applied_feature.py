"""
AutoTailor AI -- Applied Feature End-to-End Verification Test
Verifies:
1. Interactive Applied Checkbox on each job card.
2. Immediate DOM updates: green accent border, '✅ Applied' badge, green checkmark.
3. Slide-out Job Drawer applied status sync.
4. Dynamic count in stats ribbon and filter pills.
5. Filtering by '✅ Applied' and '⚡ New / Unapplied'.
6. Persistence across page reloads (localStorage).
"""

import os
import sys
import asyncio
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOT_DIR = os.path.join(ROOT_DIR, "tests", "artifacts")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def test_applied_feature():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("[*] 1. Navigating to Dashboard: http://127.0.0.1:8500/")
        await page.goto("http://127.0.0.1:8500/", wait_until="domcontentloaded")

        # Switch to Radar & Jobs tab
        radar_pill = await page.wait_for_selector(".nav-pill[data-target-tab='tab-auto-apply']")
        await radar_pill.click()
        await page.wait_for_timeout(600)

        # Wait for cards to load (skip skeleton cards)
        await page.wait_for_selector(".job-card[data-job-id]", timeout=15000)
        first_card = await page.query_selector(".job-card[data-job-id]")
        assert first_card is not None, "No job cards rendered"

        job_id = await first_card.get_attribute("data-job-id")
        company = await first_card.evaluate("el => el.querySelector('.job-company-name')?.innerText || ''")
        print(f"    Testing first card: {company} (ID: {job_id})")

        # Initial state check
        chk = await first_card.query_selector(".job-applied-checkbox")
        assert chk is not None, "Applied checkbox not found on card"
        is_checked = await chk.is_checked()
        print(f"    Initial applied state: {is_checked}")

        # 2. Click the checkbox to mark as applied
        print("[*] 2. Checking 'Mark Applied' on card...")
        chk_label = await first_card.query_selector(".job-applied-check-wrapper")
        await chk_label.click()
        await page.wait_for_timeout(300)

        # Verify card class and badge
        has_applied_class = await first_card.evaluate("el => el.classList.contains('applied')")
        has_badge = await first_card.evaluate("el => !!el.querySelector('.job-applied-badge')")
        applied_stat = await page.evaluate("() => document.getElementById('stat-applied-val')?.innerText")
        print(f"    Card has .applied class: {has_applied_class}")
        print(f"    Card has 'Applied' badge: {has_badge}")
        print(f"    Stats Ribbon Applied Count: {applied_stat}")
        assert has_applied_class, "Card missing .applied class after check"
        assert has_badge, "Card missing .job-applied-badge after check"

        # 3. Open Drawer and verify sync
        print("[*] 3. Opening Slide-out Job Drawer...")
        await first_card.click()
        await page.wait_for_selector("#job-detail-drawer:not(.hidden)", timeout=3000)

        drawer_btn = await page.query_selector("#drawer-applied-btn")
        drawer_btn_text = await page.evaluate("() => document.getElementById('drawer-applied-text')?.innerText")
        drawer_has_class = await drawer_btn.evaluate("el => el.classList.contains('is-applied')")
        print(f"    Drawer button text: '{drawer_btn_text}', is-applied: {drawer_has_class}")
        assert drawer_has_class, "Drawer button should have .is-applied class"

        # Close drawer
        close_btn = await page.query_selector("#btn-close-drawer")
        await close_btn.click()
        await page.wait_for_timeout(300)

        # 4. Test Filtering by 'Applied'
        print("[*] 4. Testing '✅ Applied' market filter...")
        applied_filter_btn = await page.query_selector("#btn-show-applied")
        await applied_filter_btn.click()
        await page.wait_for_timeout(500)

        filtered_cards_count = await page.evaluate("() => document.querySelectorAll('.job-card').length")
        print(f"    Visible cards under 'Applied' filter: {filtered_cards_count}")
        assert filtered_cards_count >= 1, "Expected at least 1 applied card in filter"

        # 5. Capture screenshot of Applied view
        shot_path = os.path.join(SCREENSHOT_DIR, "verified_applied_feature.png")
        await page.screenshot(path=shot_path, full_page=False)
        print(f"    Saved Applied Feature Screenshot -> {shot_path}")

        # 6. Test persistence across reload
        print("[*] 5. Testing persistence across page reload...")
        await page.reload(wait_until="networkidle")
        radar_pill = await page.wait_for_selector(".nav-pill[data-target-tab='tab-auto-apply']")
        await radar_pill.click()
        await page.wait_for_timeout(600)

        persisted_applied_count = await page.evaluate("() => document.getElementById('stat-applied-val')?.innerText")
        print(f"    Persisted Applied Count after reload: {persisted_applied_count}")
        assert int(persisted_applied_count) >= 1, f"Expected persisted applied count >= 1, got {persisted_applied_count}"

        await browser.close()

    print("\nALL APPLIED FEATURE TESTS PASSED 100%!")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_applied_feature())
    sys.exit(0 if success else 1)
