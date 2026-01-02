
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
        # Use a common mobile viewport size
        await page.set_viewport_size({"width": 375, "height": 667})

        url = f"http://localhost:{PORT}/index.html"

        try:
            # 1. Load the page and navigate to the new event screen
            await page.goto(url, wait_until='networkidle')
            await page.click('button[data-screen="events-list-screen"]')
            await page.wait_for_timeout(500)
            await page.click('#new-event-btn')
            await page.wait_for_selector('#event-detail-screen')
            await page.wait_for_timeout(500)

            # 2. Scroll to the bottom of the page
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(500) # Wait for scroll to finish

            # 3. Take a screenshot to verify the save button is visible
            await page.screenshot(path=f"{SCREENSHOT_DIR}/mobile_layout_fix.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path=f"{SCREENSHOT_DIR}/mobile_layout_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
