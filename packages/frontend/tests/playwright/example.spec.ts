import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('http://localhost:3000/pdfspark/');
  const title = await page.title();
  console.log(`Page title: ${title}`);
  expect(title).toContain('QuickSparks');
});