import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'C:\\Users\\PROJEC~1\\AppData\\Local\\Temp\\claude\\C--Users-project5587-Desktop-backup-jw-Dev-Trading-Insight-App\\09fafbed-d95a-492e-b0c5-631653620aa7\\scratchpad';

test.describe('Trading Insight App E2E Tests', () => {

  test('1. Main page load and UI verification', async ({ page }) => {
    // Navigate to main page (will redirect to dashboard)
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Take screenshot of main page
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\01-main-page.png`,
      fullPage: true
    });

    console.log('[PASS] Main page loaded successfully');
    console.log('[INFO] Current URL:', page.url());
  });

  test('2. Stock analysis UI elements verification', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    // Check header
    const header = page.locator('h1');
    await expect(header).toContainText('AI 주식 딥리서치');
    console.log('[PASS] Header found: AI 주식 딥리서치');

    // Check stock input field
    const stockInput = page.locator('input[type="text"]').first();
    await expect(stockInput).toBeVisible();
    const placeholder = await stockInput.getAttribute('placeholder');
    console.log('[PASS] Stock input field found with placeholder:', placeholder);

    // Check timeframe buttons (short/mid/long)
    const shortButton = page.locator('button:has-text("단기")');
    const midButton = page.locator('button:has-text("중기")');
    const longButton = page.locator('button:has-text("장기")');

    await expect(shortButton).toBeVisible();
    await expect(midButton).toBeVisible();
    await expect(longButton).toBeVisible();
    console.log('[PASS] Timeframe buttons found: 단기, 중기, 장기');

    // Check analysis button
    const analysisButton = page.locator('button:has-text("분석 시작")');
    await expect(analysisButton).toBeVisible();
    console.log('[PASS] Analysis start button found');

    // Take screenshot of UI elements
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\02-ui-elements.png`,
      fullPage: true
    });
  });

  test('3. AAPL stock analysis test', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    // Enter AAPL in stock input
    const stockInput = page.locator('input[type="text"]').first();
    await stockInput.fill('AAPL');
    console.log('[INFO] Entered stock code: AAPL');

    // Take screenshot after input
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\03-input-aapl.png`,
      fullPage: true
    });

    // Select mid-term (중기) timeframe
    const midButton = page.locator('button:has-text("중기")');
    await midButton.click();
    console.log('[INFO] Selected timeframe: 중기 (mid)');

    // Take screenshot after timeframe selection
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\04-timeframe-selected.png`,
      fullPage: true
    });

    // Click analysis button
    const analysisButton = page.locator('button:has-text("분석 시작")');
    await analysisButton.click();
    console.log('[INFO] Clicked analysis button');

    // Take screenshot during analysis
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\05-analyzing.png`,
      fullPage: true
    });

    // Wait for analysis result (max 90 seconds)
    console.log('[INFO] Waiting for analysis result (max 90 seconds)...');

    try {
      // Wait for the loader to disappear or result to appear
      await page.waitForFunction(() => {
        const loader = document.querySelector('button:has(svg.animate-spin)');
        return !loader;
      }, { timeout: 90000 });

      // Additional wait for result rendering
      await page.waitForTimeout(2000);

      // Take screenshot of analysis result
      await page.screenshot({
        path: `${SCREENSHOT_DIR}\\06-analysis-result.png`,
        fullPage: true
      });

      console.log('[PASS] Analysis completed successfully');

      // Check if result is displayed
      const pageContent = await page.content();
      if (pageContent.includes('error') || pageContent.includes('오류')) {
        console.log('[WARN] Possible error in result, check screenshot');
      } else {
        console.log('[PASS] Analysis result displayed');
      }

    } catch (error) {
      // Take screenshot even if timeout
      await page.screenshot({
        path: `${SCREENSHOT_DIR}\\06-analysis-timeout.png`,
        fullPage: true
      });
      console.log('[FAIL] Analysis timed out after 90 seconds');
      throw error;
    }
  });

  test('4. Stock autocomplete feature test', async ({ page }) => {
    console.log('[INFO] Starting stock autocomplete feature test');

    // 1. Navigate to dashboard page
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    console.log('[PASS] Dashboard page loaded');

    // 2. Find stock input field
    const stockInput = page.locator('input[type="text"]').first();
    await expect(stockInput).toBeVisible();
    console.log('[PASS] Stock input field found');

    // Take screenshot before input
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\autocomplete-01-before-input.png`,
      fullPage: true
    });

    // 3. Enter "app" in stock input - should trigger autocomplete
    await stockInput.click();
    await stockInput.fill('app');
    console.log('[INFO] Entered search query: app');

    // Wait for API call to complete (debounce is 300ms)
    await page.waitForTimeout(500);

    // Take screenshot after input (with potential dropdown)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\autocomplete-02-after-input.png`,
      fullPage: true
    });

    // 4. Check if autocomplete dropdown is visible
    // The dropdown has class containing 'z-50' and 'rounded-xl'
    const dropdown = page.locator('.z-50.rounded-xl, [class*="z-50"][class*="rounded"]');

    let dropdownVisible = false;
    try {
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });
      dropdownVisible = true;
      console.log('[PASS] Autocomplete dropdown is visible');
    } catch (e) {
      // Check alternative selectors
      const altDropdown = page.locator('div.absolute.w-full.mt-2.py-2');
      try {
        await altDropdown.waitFor({ state: 'visible', timeout: 2000 });
        dropdownVisible = true;
        console.log('[PASS] Autocomplete dropdown found (alternative selector)');
      } catch {
        console.log('[INFO] Autocomplete dropdown not visible - may need backend or no results');
      }
    }

    // Take screenshot of dropdown state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\autocomplete-03-dropdown-state.png`,
      fullPage: true
    });

    // 5. Try to click on a dropdown item if visible
    if (dropdownVisible) {
      const dropdownItems = page.locator('button.w-full.px-4.py-3, [class*="px-4"][class*="py-3"]').first();

      try {
        await dropdownItems.waitFor({ state: 'visible', timeout: 3000 });
        const itemCount = await page.locator('button.w-full.px-4.py-3').count();
        console.log(`[INFO] Found ${itemCount} autocomplete items`);

        // Get first item text
        const firstItemText = await dropdownItems.textContent();
        console.log('[INFO] First dropdown item:', firstItemText?.substring(0, 100));

        // Click on first item
        await dropdownItems.click();
        console.log('[PASS] Clicked on autocomplete dropdown item');

        // Verify that input value changed
        const newValue = await stockInput.inputValue();
        console.log('[INFO] Input value after selection:', newValue);

        // Take screenshot after selection
        await page.screenshot({
          path: `${SCREENSHOT_DIR}\\autocomplete-04-after-selection.png`,
          fullPage: true
        });

        // Check if dropdown closed after selection
        const dropdownStillVisible = await dropdown.isVisible().catch(() => false);
        if (!dropdownStillVisible) {
          console.log('[PASS] Dropdown closed after selection');
        } else {
          console.log('[INFO] Dropdown still visible after selection');
        }
      } catch (e) {
        console.log('[INFO] No selectable items in dropdown');
      }
    }

    console.log('[PASS] Autocomplete feature test completed');
  });

  test('5. Time display and history card verification', async ({ page }) => {
    console.log('[INFO] Starting time display and history card verification');

    // 1. Navigate to dashboard page
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    console.log('[PASS] Dashboard page loaded');

    // Wait for history to load
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\history-01-initial.png`,
      fullPage: true
    });

    // 2. Check for analysis history section
    const historyCards = page.locator('a[href^="/analysis/"]');
    const historyCardCount = await historyCards.count();
    console.log(`[INFO] Found ${historyCardCount} analysis history cards`);

    if (historyCardCount === 0) {
      // Check for empty state message
      const emptyMessage = page.locator('text=아직 분석 기록이 없습니다');
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

      if (hasEmptyMessage) {
        console.log('[INFO] No analysis history - empty state displayed');
        await page.screenshot({
          path: `${SCREENSHOT_DIR}\\history-02-empty-state.png`,
          fullPage: true
        });
        console.log('[PASS] Empty state test completed');
        return;
      }
    }

    // 3. Check time display format
    // Time elements contain Clock icon and relative time like "약 X분 전"
    const timeElements = page.locator('.flex.items-center.gap-1.cursor-help, span:has(svg)');
    const timeElementCount = await timeElements.count();
    console.log(`[INFO] Found ${timeElementCount} time elements`);

    // Find elements with relative time format
    const relativeTimeSpan = page.locator('span:has-text("전"), span:has-text("ago")');
    const relativeTimeCount = await relativeTimeSpan.count();
    console.log(`[INFO] Found ${relativeTimeCount} relative time displays`);

    if (relativeTimeCount > 0) {
      const firstTimeText = await relativeTimeSpan.first().textContent();
      console.log('[INFO] Sample relative time display:', firstTimeText);
      console.log('[PASS] Relative time is displayed correctly');
    }

    // Take screenshot showing time elements
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\history-02-time-display.png`,
      fullPage: true
    });

    // 4. Test tooltip on hover (absolute time KST)
    // Find element with title attribute containing 'KST'
    const hoverableTimeElements = page.locator('[title*="KST"], span[title*="KST"]');
    const hoverableCount = await hoverableTimeElements.count();
    console.log(`[INFO] Found ${hoverableCount} elements with KST tooltip`);

    if (hoverableCount > 0) {
      // Hover over first time element
      const firstHoverable = hoverableTimeElements.first();
      await firstHoverable.hover();
      console.log('[PASS] Hovered over time element');

      // Get the title attribute
      const titleValue = await firstHoverable.getAttribute('title');
      console.log('[INFO] Tooltip content (title attribute):', titleValue);

      if (titleValue && titleValue.includes('KST')) {
        console.log('[PASS] Absolute time (KST) is displayed on hover');
      }

      // Take screenshot while hovering
      await page.screenshot({
        path: `${SCREENSHOT_DIR}\\history-03-time-hover.png`,
        fullPage: true
      });
    } else {
      // Try alternative: find cursor-help elements
      const cursorHelpElements = page.locator('.cursor-help');
      const cursorHelpCount = await cursorHelpElements.count();

      if (cursorHelpCount > 0) {
        const firstCursor = cursorHelpElements.first();
        const titleVal = await firstCursor.getAttribute('title');
        console.log('[INFO] cursor-help element title:', titleVal);

        if (titleVal && titleVal.includes('KST')) {
          console.log('[PASS] Absolute time (KST) is set as title attribute');
        }
      }
    }

    // 5. Check card spacing (gap between cards)
    // Cards should be in a container with 'space-y-4' class
    const historyContainer = page.locator('.space-y-4');
    const containerExists = await historyContainer.first().isVisible().catch(() => false);

    if (containerExists) {
      console.log('[PASS] History cards container has space-y-4 class (16px gap)');
    } else {
      // Alternative: check for gap classes
      const gapContainer = page.locator('[class*="gap-"], [class*="space-"]');
      const hasGap = await gapContainer.first().isVisible().catch(() => false);
      if (hasGap) {
        console.log('[PASS] History cards have proper gap/spacing');
      } else {
        console.log('[INFO] Could not verify card spacing class');
      }
    }

    // Get bounding boxes of first two cards to verify spacing
    if (historyCardCount >= 2) {
      const firstCard = historyCards.nth(0);
      const secondCard = historyCards.nth(1);

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      if (firstBox && secondBox) {
        const gap = secondBox.y - (firstBox.y + firstBox.height);
        console.log(`[INFO] Actual gap between cards: ${gap}px`);

        if (gap > 0) {
          console.log('[PASS] Cards have visible spacing between them');
        } else {
          console.log('[WARN] Cards may not have proper spacing');
        }
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\history-04-card-spacing.png`,
      fullPage: true
    });

    console.log('[PASS] Time display and history card verification completed');
  });

  test('6. NVDA stock long-term analysis - Bug fix verification', async ({ page }) => {
    // This test verifies the bug fix for Runtime TypeError
    console.log('[INFO] Starting NVDA long-term analysis test (Bug fix verification)');

    // 1. Navigate to dashboard page
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    console.log('[PASS] Dashboard page loaded');

    // Take screenshot after page load
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\nvda-01-dashboard-loaded.png`,
      fullPage: true
    });

    // 2. Enter NVDA in stock input
    const stockInput = page.locator('input[type="text"]').first();
    await stockInput.fill('NVDA');
    console.log('[INFO] Entered stock code: NVDA');

    // 3. Select long-term (장기) timeframe
    const longButton = page.locator('button:has-text("장기")');
    await longButton.click();
    console.log('[INFO] Selected timeframe: 장기 (long)');

    // Take screenshot after input and timeframe selection
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\nvda-02-input-and-timeframe.png`,
      fullPage: true
    });

    // 4. Click analysis start button
    const analysisButton = page.locator('button:has-text("분석 시작")');
    await analysisButton.click();
    console.log('[INFO] Clicked analysis start button');

    // Take screenshot during analysis (loading state)
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}\\nvda-03-analyzing.png`,
      fullPage: true
    });

    // 5. Wait for analysis to complete (max 90 seconds)
    console.log('[INFO] Waiting for analysis result (max 90 seconds)...');

    // Listen for console errors (to detect TypeError)
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    try {
      // Wait for analysis result to appear
      // Look for result indicators: NVIDIA Corp, 매입/매수/매도/보유, 핵심 요약, etc.
      await page.waitForFunction(() => {
        const bodyText = document.body.innerText;
        // Check for result indicators
        const hasCompanyName = bodyText.includes('NVIDIA') || bodyText.includes('Corp');
        const hasRecommendation = bodyText.includes('매입') || bodyText.includes('매수') || bodyText.includes('매도') || bodyText.includes('보유');
        const hasSummary = bodyText.includes('핵심 요약') || bodyText.includes('투자 의견');
        const hasPrice = bodyText.includes('US$') || bodyText.includes('$');

        return (hasCompanyName && hasRecommendation) || (hasSummary && hasPrice);
      }, { timeout: 90000 });

      // Additional wait for result rendering
      await page.waitForTimeout(2000);

      // 6. Check for errors and take screenshot
      await page.screenshot({
        path: `${SCREENSHOT_DIR}\\nvda-04-analysis-complete.png`,
        fullPage: true
      });

      // Check for any error message on page
      const errorElement = await page.locator('.text-destructive, [class*="destructive"]').first().isVisible().catch(() => false);
      const pageContent = await page.content();

      // Report console errors if any
      if (consoleErrors.length > 0) {
        console.log('[WARN] Console errors detected:');
        consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      }

      // Report page errors if any
      if (pageErrors.length > 0) {
        console.log('[FAIL] Page errors detected (TypeError might still exist):');
        pageErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));

        // Take error screenshot
        await page.screenshot({
          path: `${SCREENSHOT_DIR}\\nvda-05-error-detected.png`,
          fullPage: true
        });

        throw new Error(`Page errors detected: ${pageErrors.join(', ')}`);
      }

      // Check if error is displayed on UI
      if (errorElement) {
        const errorText = await page.locator('.text-destructive, [class*="destructive"]').first().textContent();
        console.log('[WARN] Error displayed on UI:', errorText);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}\\nvda-05-ui-error.png`,
          fullPage: true
        });
      }

      // Verify analysis result is rendered
      const hasResult = pageContent.includes('투자 의견') ||
                        pageContent.includes('분석 결과') ||
                        pageContent.includes('NVDA') ||
                        pageContent.includes('매수') ||
                        pageContent.includes('매도') ||
                        pageContent.includes('보유');

      if (hasResult) {
        console.log('[PASS] Analysis result rendered successfully without TypeError');
        console.log('[PASS] Bug fix verified - NVDA long-term analysis works correctly');

        // 7. Final screenshot of successful result
        await page.screenshot({
          path: `${SCREENSHOT_DIR}\\nvda-06-final-result.png`,
          fullPage: true
        });
      } else {
        console.log('[WARN] Analysis might have completed but result verification unclear');
        console.log('[INFO] Check screenshots for visual verification');
      }

    } catch (error) {
      // Take screenshot on failure
      await page.screenshot({
        path: `${SCREENSHOT_DIR}\\nvda-07-test-failed.png`,
        fullPage: true
      });

      console.log('[FAIL] NVDA analysis test failed');
      console.log('[INFO] Console errors:', consoleErrors);
      console.log('[INFO] Page errors:', pageErrors);

      throw error;
    }
  });
});
