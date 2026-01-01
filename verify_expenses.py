
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
            # 1. Initial Load - Go to Dashboard and take a screenshot
            await page.goto(url)
            await page.wait_for_load_state('networkidle')
            await page.screenshot(path=f"{SCREENSHOT_DIR}/spese_01_dashboard_initial.png")

            # 2. Go to Events List
            await page.click('button[data-screen="events-list-screen"]')
            await page.wait_for_timeout(500)

            # 3. Click to create a new event
            await page.click('#new-event-btn')
            await page.wait_for_selector('#event-form')
            await page.wait_for_timeout(500)

            # 4. Fill out the form for a new event with an unpaid expense
            await page.select_option('#event-project', '1') # Concerti Live
            await page.fill('#event-date', '2024-07-15')
            await page.fill('#event-location', 'Milano')
            await page.fill('#event-compensation', '500')
            await page.check('#event-paid')

            # Add an expense
            await page.fill('#expenses-list input[type="text"]', 'Cena')
            await page.fill('#expenses-list input[type="number"]', '75')
            # The checkbox for 'pagata' is unchecked by default
            await page.screenshot(path=f"{SCREENSHOT_DIR}/spese_02_new_event_form.png")

            # 5. Save the event
            await page.click('button[type="submit"]')
            await page.wait_for_selector('#events-list-screen')
            await page.wait_for_timeout(500)

            # 6. Go back to Dashboard to check the unpaid expenses list
            await page.click('button[data-screen="dashboard-screen"]')
            await page.wait_for_selector('#unpaid-expenses-list')
            await page.wait_for_timeout(1000) # Wait for render
            await page.screenshot(path=f"{SCREENSHOT_DIR}/spese_03_dashboard_with_unpaid.png")

            # 7. Go back to events to "pay" the expense
            await page.click('button[data-screen="events-list-screen"]')
            await page.wait_for_timeout(500)

            # Find the new event and click edit
            # This assumes the new event is the last one in the list
            await page.click('.event-item:last-child .edit-event-btn')
            await page.wait_for_selector('#event-form')
            await page.wait_for_timeout(500)

            # 8. Check the 'pagata' checkbox for the expense
            await page.check('#expenses-list input[type="checkbox"]')
            await page.screenshot(path=f"{SCREENSHOT_DIR}/spese_04_editing_event_to_pay.png")

            # 9. Save the changes
            await page.click('button[type="submit"]')
            await page.wait_for_selector('#events-list-screen')
            await page.wait_for_timeout(500)

            # 10. Go back to dashboard and verify the expense is gone
            await page.click('button[data-screen="dashboard-screen"]')
            await page.wait_for_selector('#unpaid-expenses-list')
            await page.wait_for_timeout(1000) # Wait for render
            await page.screenshot(path=f"{SCREENSHOT_DIR}/spese_05_dashboard_paid.png")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
