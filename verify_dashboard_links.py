
import asyncio
from playwright.async_api import async_playwright, expect
import os

PORT = 8000
SCREENSHOT_DIR = "verifications"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_viewport_size({"width": 500, "height": 900})

        url = f"http://localhost:{PORT}/index.html"

        try:
            # 1. Load the page
            await page.goto(url, wait_until='networkidle')
            await page.wait_for_timeout(500)

            # --- Test Link from Unpaid Expense ---

            # 2. Click on the first unpaid expense item
            unpaid_expense_item = page.locator('#unpaid-expenses-list .dashboard-link').first
            await unpaid_expense_item.click()

            # 3. Verify it navigated to the event detail screen of the correct event
            await page.wait_for_selector('#event-detail-screen')
            await expect(page.locator('#event-form-title')).to_have_text("Modifica Evento")
            # The unpaid expense "Hotel" is part of the "Londra" event (ID 2)
            await expect(page.locator('#event-location')).to_have_value("Londra")
            await page.screenshot(path=f"{SCREENSHOT_DIR}/dashboard_link_01_from_expense.png")

            # --- Test Link from Unpaid Event ---

            # 4. Go back to the dashboard
            await page.click('#back-to-events-btn') # This btn now goes back to last screen, which should be dashboard
            await page.click('button[data-screen="dashboard-screen"]') # Explicitly go to dashboard
            await page.wait_for_selector('#dashboard-screen')
            await page.wait_for_timeout(500)

            # 5. Click on the first unpaid event item
            unpaid_event_item = page.locator('#unpaid-events-list .dashboard-link').first
            await unpaid_event_item.click()

            # 6. Verify it navigated to the event detail screen of the same event
            await page.wait_for_selector('#event-detail-screen')
            await expect(page.locator('#event-form-title')).to_have_text("Modifica Evento")
            await expect(page.locator('#event-location')).to_have_value("Londra")
            await page.screenshot(path=f"{SCREENSHOT_DIR}/dashboard_link_02_from_event.png")


        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path=f"{SCREENSHOT_DIR}/dashboard_link_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
