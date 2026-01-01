import asyncio
from playwright.async_api import async_playwright
import os

PORT = 8000
SCREENSHOT_DIR = "verifications"

# Ensure the verification directory exists
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_viewport_size({"width": 500, "height": 800})

        url = f"http://localhost:{PORT}/index.html"

        try:
            # 1. Initial load
            await page.goto(url)
            await page.wait_for_load_state('networkidle')

            # 2. Navigate to projects screen
            await page.click('button[data-screen="projects-screen"]')
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/01_projects_list.png")

            # 3. Create a new project
            await page.click('#new-project-btn')
            await page.wait_for_timeout(500)
            await page.fill('#project-name', 'Test Project')
            await page.fill('#project-icon', '🧪')
            await page.fill('#project-description', 'This is a test project')
            await page.click('#project-form button[type="submit"]') # Corrected selector
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/02_project_created.png")

            # 4. Edit the project
            # Select the last project item, which is the one just created
            await page.click('#projects-list .project-item:last-of-type .edit-project-btn')
            await page.wait_for_timeout(500)
            await page.fill('#project-name', 'Test Project Edited')
            await page.click('#project-form button[type="submit"]') # Corrected selector
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/03_project_edited.png")

            # 5. Delete the project
            page.on("dialog", lambda dialog: dialog.accept())
            # Select the last project item to delete it
            await page.click('#projects-list .project-item:last-of-type .delete-project-btn')
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{SCREENSHOT_DIR}/04_project_deleted.png")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
