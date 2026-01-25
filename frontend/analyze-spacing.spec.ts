import { test, expect } from '@playwright/test'

test('Analyze card spacing in detail', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Find the history/recent analysis section
  const historySection = await page.locator('text=최근 분석 기록').first()
  await expect(historySection).toBeVisible()

  // Get all cards in the section
  const cardsContainer = await page.locator('[class*="card"]').first()

  if (await cardsContainer.isVisible()) {
    // Get detailed spacing info
    const spacingInfo = await cardsContainer.evaluate((el) => {
      const style = window.getComputedStyle(el)
      const parent = el.parentElement
      const parentStyle = parent ? window.getComputedStyle(parent) : null

      // Get all siblings
      const siblings = Array.from(el.parentElement?.children || [])
      const spacings = siblings.map((sibling, idx) => {
        const rect = sibling.getBoundingClientRect()
        return {
          index: idx,
          height: rect.height,
          width: rect.width,
          marginTop: window.getComputedStyle(sibling).marginTop,
          marginBottom: window.getComputedStyle(sibling).marginBottom,
        }
      })

      return {
        containerGap: style.gap,
        containerDisplay: style.display,
        containerFlexDirection: style.flexDirection,
        containerMargin: style.margin,
        containerPadding: style.padding,
        containerMarginTop: style.marginTop,
        containerMarginBottom: style.marginBottom,
        parentGap: parentStyle?.gap,
        parentDisplay: parentStyle?.display,
        parentFlexDirection: parentStyle?.flexDirection,
        cardMargin: style.margin,
        cardPadding: style.padding,
        siblings: spacings
      }
    })

    console.log('=== SPACING ANALYSIS ===')
    console.log(JSON.stringify(spacingInfo, null, 2))
  }

  // Get all card elements
  const cards = await page.locator('[class*="card"]').all()
  console.log(`\nFound ${cards.length} cards`)

  // Measure gaps between cards
  if (cards.length > 1) {
    const positions = await Promise.all(
      cards.map(async (card) => {
        const box = await card.boundingBox()
        return {
          top: box?.y,
          bottom: box?.y ? box.y + (box?.height || 0) : 0,
          height: box?.height,
          left: box?.x,
          right: box?.x ? box.x + (box?.width || 0) : 0,
          width: box?.width,
        }
      })
    )

    console.log('\n=== CARD POSITIONS ===')
    positions.forEach((pos, idx) => {
      console.log(`Card ${idx + 1}: top=${pos.top?.toFixed(0)}, height=${pos.height?.toFixed(0)}, bottom=${pos.bottom?.toFixed(0)}`)
    })

    console.log('\n=== GAPS BETWEEN CARDS ===')
    for (let i = 0; i < positions.length - 1; i++) {
      const gap = (positions[i + 1].top || 0) - (positions[i].bottom || 0)
      console.log(`Gap between card ${i + 1} and ${i + 2}: ${gap?.toFixed(0)}px`)
    }
  }
})
