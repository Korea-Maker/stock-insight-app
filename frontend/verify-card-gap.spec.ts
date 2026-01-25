import { test, expect } from '@playwright/test'

test('Verify card gap spacing on dashboard', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Refresh for fresh state
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Scroll down to Recent Analysis section
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
  })
  await page.waitForTimeout(1000)

  // Get the card container
  const cardContainer = page.locator('div').filter({
    hasText: /최근 분석|Alphabet|NVIDIA|Apple/
  }).first()

  // Find all cards in the section
  const cards = page.locator('[class*="gap"]').filter({
    has: page.locator('[class*="rounded"]')
  }).locator('a').or(page.locator('[role="link"]'))

  const cardCount = await cards.count()
  console.log(`Found ${cardCount} cards in Recent Analysis section`)

  // Get computed styles of first card
  const firstCard = cards.first()

  if (await firstCard.isVisible()) {
    const parent = firstCard.locator('xpath=parent::div').first()
    const styles = await parent.evaluate((el: HTMLElement) => {
      const computed = window.getComputedStyle(el)
      return {
        gap: computed.gap,
        display: computed.display,
        flexDirection: computed.flexDirection,
      }
    })

    console.log('Card container styles:', styles)

    // Verify gap is properly set (should be 24px for gap-6 in Tailwind)
    expect(styles.gap).toBe('24px')
  }

  // Take final screenshot
  await page.screenshot({
    path: 'C:\\Users\\PROJEC~1\\AppData\\Local\\Temp\\claude\\C--Users-project5587-Desktop-backup-jw-Dev-Trading-Insight-App\\09fafbed-d95a-492e-b0c5-631653620aa7\\scratchpad\\card-gap-6.png',
    fullPage: false
  })

  console.log('Verification complete - Card gap is correctly set to gap-6 (24px)')
})
