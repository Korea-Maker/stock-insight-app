import { test, expect } from '@playwright/test'
import path from 'path'

test('Check dashboard card spacing', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

  // Wait for content to load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Take full page screenshot
  const screenshotPath = path.join(
    'C:\\Users\\PROJEC~1\\AppData\\Local\\Temp\\claude\\C--Users-project5587-Desktop-backup-jw-Dev-Trading_Insight_App\\09fafbed-d95a-492e-b0c5-631653620aa7\\scratchpad',
    'card-spacing-fixed.png'
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Screenshot saved to: ${screenshotPath}`)

  // Check for history/recent analysis sections
  const historySection = await page.locator('[class*="history"], [class*="recent"], main').first()
  await expect(historySection).toBeVisible()

  // Get all card elements
  const cards = await page.locator('[class*="card"]').all()
  console.log(`Found ${cards.length} card elements`)

  // Check spacing styles
  if (cards.length > 0) {
    const firstCard = cards[0]
    const cardStyles = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        gap: styles.gap,
        margin: styles.margin,
        padding: styles.padding,
        width: rect.width,
        height: rect.height
      }
    })
    console.log('Card styles:', JSON.stringify(cardStyles, null, 2))
  }

  // Verify page loaded successfully
  await expect(page).toHaveTitle(/Dashboard|Trading|Analysis/i)
})
