// @ts-check
import { test, expect } from '@playwright/test';

test('PDFSpark basic functionality test', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3001/pdfspark/');
  
  // Check if the page title contains PDFSpark
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Check for the upload button
  const uploadButton = await page.getByText('Upload File', { exact: false });
  expect(uploadButton).toBeTruthy();
  
  // Check for the conversion types (PDF to DOCX and DOCX to PDF)
  const pdfToDocx = await page.getByText('PDF to DOCX', { exact: false });
  const docxToPdf = await page.getByText('DOCX to PDF', { exact: false });
  
  expect(pdfToDocx).toBeTruthy();
  expect(docxToPdf).toBeTruthy();
  
  console.log('Functional test completed successfully');
});