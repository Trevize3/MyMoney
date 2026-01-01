
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
            # 1. Initial Load and take screenshot
            await page.goto(url, wait_until='networkidle')
            await page.wait_for_timeout(500) # Ensure rendering is complete

            # 2. Check for the location text in the unpaid expense item
            unpaid_expense_item = page.locator('#unpaid-expenses-list .bg-white').first
            await expect(unpaid_expense_item).to_contain_text("Londra")

            # 3. Take a screenshot for visual confirmation
            await page.screenshot(path=f"{SCREENSHOT_DIR}/expense_location_visible.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path=f"{SCREENSHOT_DIR}/expense_location_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
