// @ts-check
import { test, expect } from '@playwright/test';

test('PDFSpark cross-browser compatibility test', async ({ page, browserName }) => {
  // Log browser information
  console.log(`Running test on ${browserName} browser`);
  
  // Navigate to the application
  await page.goto('http://localhost:3001/pdfspark/');
  
  // Check if the page loads successfully
  await expect(page).toHaveTitle(/PDFSpark/, { timeout: 10000 });
  
  // Take a screenshot for visual reference
  await page.screenshot({ path: `./test-reports/cross-browser/${browserName}-homepage.png` });
  
  // Basic responsive tests
  // Test desktop layout
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(500); // wait for layout to adjust
  await page.screenshot({ path: `./test-reports/cross-browser/${browserName}-desktop.png` });
  
  // Test tablet layout
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500); // wait for layout to adjust
  await page.screenshot({ path: `./test-reports/cross-browser/${browserName}-tablet.png` });
  
  // Test mobile layout
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500); // wait for layout to adjust
  await page.screenshot({ path: `./test-reports/cross-browser/${browserName}-mobile.png` });
  
  // Check if key elements are visible
  const uploadText = await page.getByText('Upload File', { exact: false });
  expect(await uploadText.isVisible()).toBeTruthy();
  
  // Navigate to conversion page
  await page.goto('http://localhost:3001/pdfspark/convert');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `./test-reports/cross-browser/${browserName}-conversion-page.png` });
  
  console.log(`Cross-browser test completed successfully on ${browserName}`);
});