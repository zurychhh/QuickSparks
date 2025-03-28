import { test, expect } from '@playwright/test';

test('PDFSpark basic test', async ({ page }) => {
  await page.goto('http://localhost:3001/pdfspark/');
  const title = await page.title();
  console.log(`Page title: ${title}`);
  await expect(page).toHaveTitle(/PDFSpark/);
});