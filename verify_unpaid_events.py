
import asyncio
from playwright.async_api import async_playwright
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
            # 1. Initial Load - An unpaid event from sample data should be visible
            await page.goto(url, wait_until='networkidle')
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/unpaid_events_01_initial.png")

            # 2. Go to the Events List to find and edit the unpaid event
            await page.click('button[data-screen="events-list-screen"]')
            await page.wait_for_timeout(500)

            # Find the unpaid event (Event 2, "Londra") and click edit.
            # We target it by looking for the "Non Pagato" text.
            await page.click('.event-item:has-text("Non Pagato") .edit-event-btn')
            await page.wait_for_selector('#event-form')
            await page.wait_for_timeout(500)

            # 3. Mark the event as paid
            await page.check('#event-paid')
            await page.screenshot(path=f"{SCREENSHOT_DIR}/unpaid_events_02_marking_as_paid.png")

            # 4. Save the event
            await page.click('button[type="submit"]')
            await page.wait_for_selector('#events-list-screen')
            await page.wait_for_timeout(500)

            # 5. Go back to the dashboard and verify the event is no longer in the unpaid list
            await page.click('button[data-screen="dashboard-screen"]')
            await page.wait_for_selector('#unpaid-events-list')
            await page.wait_for_timeout(1000) # Wait for render
            await page.screenshot(path=f"{SCREENSHOT_DIR}/unpaid_events_03_paid.png")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
