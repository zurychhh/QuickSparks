import fs from 'fs';
import { 
  getTempFilePath, 
  cleanupTempFiles, 
  fileHasContent,
  getPdfFixturePath,
  copyPdfFixture
} from '../utils/tempFiles';
import pdfToDocxService from '../../src/services/pdfToDocxService';

// Get PDF fixture paths
const SIMPLE_PDF = getPdfFixturePath('simple');
const TEXT_HEAVY_PDF = getPdfFixturePath('text_heavy');
const FORMATTED_PDF = getPdfFixturePath('formatted');
const IMAGE_PDF = getPdfFixturePath('with_images');
const TABLE_PDF = getPdfFixturePath('with_tables');

// Setup test runner with fixture validation
const runTest = (testName: string, fn: jest.ProvidesCallback) => {
  // Check if fixture exists
  if (!fs.existsSync(SIMPLE_PDF)) {
    test.skip(`${testName} (SKIPPED - missing fixtures)`, () => {});
    return;
  }
  
  test(testName, fn);
};

describe('PDF to DOCX Conversion Service', () => {
  // Clean up temp files after all tests
  afterAll(() => {
    cleanupTempFiles();
  });
  
  // Test basic conversion functionality
  runTest('should convert a simple PDF to DOCX', async () => {
    // Only run if fixture exists
    if (!fs.existsSync(SIMPLE_PDF)) return;
    
    const outputPath = getTempFilePath('.docx');
    
    const result = await pdfToDocxService.convertPdfToDocx(
      SIMPLE_PDF,
      outputPath,
      'high',
      true
    );
    
    expect(result.success).toBe(true);
    expect(fileHasContent(outputPath)).toBe(true);
    expect(result.pageCount).toBeGreaterThan(0);
    expect(result.conversionTime).toBeGreaterThan(0);
  });
  
  // Test high quality vs standard quality
  runTest('should convert with different quality settings', async () => {
    // Only run if fixture exists
    if (!fs.existsSync(SIMPLE_PDF)) return;
    
    const highQualityOutput = getTempFilePath('.docx');
    const standardQualityOutput = getTempFilePath('.docx');
    
    // High quality conversion
    const highQualityResult = await pdfToDocxService.convertPdfToDocx(
      SIMPLE_PDF,
      highQualityOutput,
      'high', 
      true
    );
    
    // Standard quality conversion
    const standardQualityResult = await pdfToDocxService.convertPdfToDocx(
      SIMPLE_PDF,
      standardQualityOutput,
      'standard',
      true
    );
    
    expect(highQualityResult.success).toBe(true);
    expect(standardQualityResult.success).toBe(true);
    
    // Standard quality should generally be faster
    expect(standardQualityResult.conversionTime).toBeLessThanOrEqual(highQualityResult.conversionTime * 1.5);
    
    // Both should produce valid files
    expect(fileHasContent(highQualityOutput)).toBe(true);
    expect(fileHasContent(standardQualityOutput)).toBe(true);
  });
  
  // Test handling of non-existent files
  runTest('should handle non-existent input files', async () => {
    const nonExistentFile = path.join(FIXTURES_DIR, 'doesnotexist.pdf');
    const outputPath = getTempFilePath('.docx');
    
    const result = await pdfToDocxService.convertPdfToDocx(
      nonExistentFile,
      outputPath,
      'high',
      true
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
  
  // Test progress reporting
  runTest('should report progress during conversion', async () => {
    // Only run if fixture exists
    if (!fs.existsSync(SIMPLE_PDF)) return;
    
    const outputPath = getTempFilePath('.docx');
    const progressUpdates: { stage: string; percent: number }[] = [];
    
    // Progress callback
    const progressCallback = async (stage: string, percent: number) => {
      progressUpdates.push({ stage, percent });
    };
    
    const result = await pdfToDocxService.convertPdfToDocx(
      SIMPLE_PDF,
      outputPath,
      'high',
      true,
      progressCallback
    );
    
    expect(result.success).toBe(true);
    expect(progressUpdates.length).toBeGreaterThan(0);
    
    // Check for progression in percentages
    const percentages = progressUpdates.map(update => update.percent);
    expect(Math.min(...percentages)).toBeLessThanOrEqual(20); // Should start with low percentage
    expect(Math.max(...percentages)).toBeGreaterThanOrEqual(90); // Should end with high percentage
    
    // Verify stages are reported
    expect(progressUpdates.some(update => update.stage === 'preparing')).toBe(true);
    expect(progressUpdates.some(update => update.stage.includes('page') || update.stage.includes('document'))).toBe(true);
  });
  
  // Test with different PDF types if available
  if (fs.existsSync(TEXT_HEAVY_PDF)) {
    runTest('should convert text-heavy PDF documents', async () => {
      const outputPath = getTempFilePath('.docx');
      
      const result = await pdfToDocxService.convertPdfToDocx(
        TEXT_HEAVY_PDF,
        outputPath,
        'high',
        true
      );
      
      expect(result.success).toBe(true);
      expect(fileHasContent(outputPath)).toBe(true);
    });
  }
  
  if (fs.existsSync(FORMATTED_PDF)) {
    runTest('should handle formatted PDF documents', async () => {
      const outputPath = getTempFilePath('.docx');
      
      const result = await pdfToDocxService.convertPdfToDocx(
        FORMATTED_PDF,
        outputPath,
        'high',
        true
      );
      
      expect(result.success).toBe(true);
      expect(fileHasContent(outputPath)).toBe(true);
    });
  }
  
  if (fs.existsSync(IMAGE_PDF)) {
    runTest('should handle PDF documents with images', async () => {
      const outputPath = getTempFilePath('.docx');
      
      const result = await pdfToDocxService.convertPdfToDocx(
        IMAGE_PDF,
        outputPath,
        'high',
        true
      );
      
      expect(result.success).toBe(true);
      expect(fileHasContent(outputPath)).toBe(true);
    });
  }
  
  if (fs.existsSync(TABLE_PDF)) {
    runTest('should handle PDF documents with tables', async () => {
      const outputPath = getTempFilePath('.docx');
      
      const result = await pdfToDocxService.convertPdfToDocx(
        TABLE_PDF,
        outputPath,
        'high', 
        true
      );
      
      expect(result.success).toBe(true);
      expect(fileHasContent(outputPath)).toBe(true);
    });
  }
});