import { test, expect } from '@playwright/test'

test('Capture Recent Analysis Records section', async ({ page }) => {
  // Navigate to the dashboard
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

  // Wait for page to fully load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Refresh the page
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Get page height first
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight)
  console.log(`Page body height: ${bodyHeight}px`)

  // Scroll to bottom to reveal all sections
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
  })
  await page.waitForTimeout(1500)

  // Take full page screenshot
  const screenshotPath = 'C:\\Users\\PROJEC~1\\AppData\\Local\\Temp\\claude\\C--Users-project5587-Desktop-backup-jw-Dev-Trading-Insight-App\\09fafbed-d95a-492e-b0c5-631653620aa7\\scratchpad\\card-gap-6.png'

  await page.screenshot({
    path: screenshotPath,
    fullPage: false
  })

  console.log(`Screenshot saved to: ${screenshotPath}`)

  // Also log visible content
  const allHeadings = await page.locator('h1, h2, h3, [role="heading"]').allTextContents()
  console.log('Page headings found:', allHeadings)
})
