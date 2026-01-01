
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
            # Go to the page to establish origin, then clear storage
            await page.goto(url)
            await page.evaluate('localStorage.removeItem("myMoneyData")')
            # Reload to ensure the app starts with the default state
            await page.reload()
            await page.wait_for_load_state('networkidle')

            # 1. Initial Load - Balances should be hidden by default
            await page.screenshot(path=f"{SCREENSHOT_DIR}/privacy_01_default_hidden.png")

            # 2. Click the privacy toggle to show balances
            await page.click('#privacy-toggle')
            await page.wait_for_timeout(500) # Wait for UI update
            await page.screenshot(path=f"{SCREENSHOT_DIR}/privacy_02_visible.png")

            # 3. Click the privacy toggle again to hide balances
            await page.click('#privacy-toggle')
            await page.wait_for_timeout(500) # Wait for UI update
            await page.screenshot(path=f"{SCREENSHOT_DIR}/privacy_03_hidden_again.png")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
