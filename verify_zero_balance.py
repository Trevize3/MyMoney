
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
            # 1. Initial Load - Filtered balance should be €0.00
            await page.goto(url, wait_until='networkidle')
            # Clear any saved filters from previous sessions for a clean test
            await page.evaluate("localStorage.removeItem('myMoneyData')")
            await page.reload(wait_until='networkidle')

            # Click the privacy toggle to make balances visible for the test
            await page.click('#privacy-toggle')

            filtered_balance_el = page.locator('#filtered-balance')
            await expect(filtered_balance_el).to_have_text("€0.00")
            await page.screenshot(path=f"{SCREENSHOT_DIR}/zero_balance_01_initial.png")

            # 2. Select a project and verify the balance updates
            await page.check('input[data-project-id="1"]') # Concerti Live
            await expect(filtered_balance_el).not_to_have_text("€0.00")
            await page.screenshot(path=f"{SCREENSHOT_DIR}/zero_balance_02_project_selected.png")

            # 3. Deselect the project and verify the balance returns to €0.00
            await page.uncheck('input[data-project-id="1"]')
            await expect(filtered_balance_el).to_have_text("€0.00")
            await page.screenshot(path=f"{SCREENSHOT_DIR}/zero_balance_03_deselected.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            # Ensure screenshot is taken on failure for debugging
            await page.screenshot(path=f"{SCREENSHOT_DIR}/zero_balance_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
