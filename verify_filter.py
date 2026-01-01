import asyncio
from playwright.async_api import async_playwright
import os

PORT = 8000
SCREENSHOT_DIR = "/home/jules/verification"

# Ensure the verification directory exists
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_viewport_size({"width": 500, "height": 800})

        url = f"http://localhost:{PORT}/index.html"

        try:
            # 1. Initial load & navigate to events screen
            await page.goto(url)
            await page.wait_for_load_state('networkidle')
            await page.click('button[data-screen="events-list-screen"]')
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/01_events_list_all.png")

            # 2. Select the first project ("Concerti Live")
            await page.check('#events-project-filter-container input[data-project-id="1"]')
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/02_events_list_single_project.png")

            # 3. Select the second project ("Mix & Master") as well
            await page.check('#events-project-filter-container input[data-project-id="2"]')
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/03_events_list_multiple_projects.png")

            # 4. Unselect the first project, leaving only the second one
            await page.uncheck('#events-project-filter-container input[data-project-id="1"]')
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/04_events_list_one_project_left.png")


        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
