import fs from 'fs';
import { 
  getTempFilePath, 
  cleanupTempFiles, 
  fileHasContent,
  getDocxFixturePath,
  copyDocxFixture
} from '../utils/tempFiles';
import docxToPdfService from '../../src/services/docxToPdfService';

// Get DOCX fixture paths
const SIMPLE_DOCX = getDocxFixturePath('simple');
const TEXT_HEAVY_DOCX = getDocxFixturePath('text_heavy');
const FORMATTED_DOCX = getDocxFixturePath('formatted');
const IMAGE_DOCX = getDocxFixturePath('with_images');
const TABLE_DOCX = getDocxFixturePath('with_tables');

// Setup test runner with fixture validation
const runTest = (testName: string, fn: jest.ProvidesCallback) => {
  // Check if fixture exists
  if (!fs.existsSync(SIMPLE_DOCX)) {
    test.skip(`${testName} (SKIPPED - missing fixtures)`, () => {});
    return;
  }
  
  test(testName, fn);
};

describe('DOCX to PDF Conversion Service', () => {
  // Clean up temp files after all tests
  afterAll(() => {
    cleanupTempFiles();
  });
  
  // Test basic conversion functionality
  runTest('should convert a simple DOCX to PDF', async () => {
    // Only run if fixture exists
    if (!fs.existsSync(SIMPLE_DOCX)) return;
    
    const outputPath = getTempFilePath('.pdf');
    
    const result = await docxToPdfService.convertDocxToPdf(
      SIMPLE_DOCX,
      outputPath,
      'high',
      true
    );
    
    expect(result.success).toBe(true);
    expect(fileHasContent(outputPath)).toBe(true);
    expect(result.pageCount).toBeGreaterThan(0);
    expect(result.conversionTime).toBeGreaterThan(0);
  });
  
  // Test with different quality settings
  runTest('should convert with different quality settings', async () => {
    // Only run if fixture exists
    if (!fs.existsSync(SIMPLE_DOCX)) return;
    
    const highQualityOutput = getTempFilePath('.pdf');
    const standardQualityOutput = getTempFilePath('.pdf');
    
    // High quality conversion
    const highQualityResult = await docxToPdfService.convertDocxToPdf(
      SIMPLE_DOCX,
      highQualityOutput,
      'high',
      true
    );
    
    // Standard quality conversion
    const standardQualityResult = await docxToPdfService.convertDocxToPdf(
      SIMPLE_DOCX,
      standardQualityOutput,
      'standard',
      true
    );
    
    expect(highQualityResult.success).toBe(true);
    expect(standardQualityResult.success).toBe(true);
    
    // Both should produce valid files
    expect(fileHasContent(highQualityOutput)).toBe(true);
    expect(fileHasContent(standardQualityOutput)).toBe(true);
  });
  
  // Test handling of non-existent files
  runTest('should handle non-existent input files', async () => {
    const nonExistentFile = path.join(FIXTURES_DIR, 'doesnotexist.docx');
    const outputPath = getTempFilePath('.pdf');
    
    const result = await docxToPdfService.convertDocxToPdf(
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
    if (!fs.existsSync(SIMPLE_DOCX)) return;
    
    const outputPath = getTempFilePath('.pdf');
    const progressUpdates: { stage: string; percent: number }[] = [];
    
    // Progress callback
    const progressCallback = async (stage: string, percent: number) => {
      progressUpdates.push({ stage, percent });
    };
    
    const result = await docxToPdfService.convertDocxToPdf(
      SIMPLE_DOCX,
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
    expect(progressUpdates.some(update => update.stage === 'validating')).toBe(true);
    expect(progressUpdates.some(update => update.stage === 'extracting_html')).toBe(true);
    expect(progressUpdates.some(update => update.stage === 'completed')).toBe(true);
  });
  
  // Test with different DOCX types if available
  if (fs.existsSync(TEXT_HEAVY_DOCX)) {
    runTest('should convert text-heavy DOCX documents', async () => {
      const outputPath = getTempFilePath('.pdf');
      
      const result = await docxToPdfService.convertDocxToPdf(
        TEXT_HEAVY_DOCX,
        outputPath,
        'high',
        true
      );
      
      expect(result.success).toBe(true);
      expect(fileHasContent(outputPath)).toBe(true);
    });
  }
  
  if (fs.existsSync(FORMATTED_DOCX)) {
    runTest('should handle formatted DOCX documents', async () => {
      const outputPath = getTempFilePath('.pdf');
      
      const result = await docxToPdfService.convertDocxToPdf(
        FORMATTED_DOCX,
        outputPath,
        'high',
        true
      );
      
      expect(result.success).toBe(true);
      expect(fileHasContent(outputPath)).toBe(true);
    });
  }
  
  if (fs.existsSync(IMAGE_DOCX)) {
    runTest('should handle DOCX documents with images', async () => {
      const outputPath = getTempFilePath('.pdf');
      
      const result = await docxToPdfService.convertDocxToPdf(
        IMAGE_DOCX,
        outputPath,
        'high',
        true
      );
      
      expect(result.success).toBe(true);
      expect(fileHasContent(outputPath)).toBe(true);
    });
  }
  
  if (fs.existsSync(TABLE_DOCX)) {
    runTest('should handle DOCX documents with tables', async () => {
      const outputPath = getTempFilePath('.pdf');
      
      const result = await docxToPdfService.convertDocxToPdf(
        TABLE_DOCX,
        outputPath,
        'high',
        true
      );
      
      expect(result.success).toBe(true);
      expect(fileHasContent(outputPath)).toBe(true);
    });
  }
  
  // Test formatting preservation
  runTest('should respect formatting preservation option', async () => {
    // Only run if fixture exists
    if (!fs.existsSync(FORMATTED_DOCX)) return;
    
    const withFormattingPath = getTempFilePath('.pdf');
    const withoutFormattingPath = getTempFilePath('.pdf');
    
    // Convert with formatting preserved
    await docxToPdfService.convertDocxToPdf(
      FORMATTED_DOCX,
      withFormattingPath,
      'high',
      true // preserve formatting
    );
    
    // Convert without preserving formatting
    await docxToPdfService.convertDocxToPdf(
      FORMATTED_DOCX,
      withoutFormattingPath,
      'high',
      false // don't preserve formatting
    );
    
    // Both files should exist and have content
    expect(fileHasContent(withFormattingPath)).toBe(true);
    expect(fileHasContent(withoutFormattingPath)).toBe(true);
    
    // Files should be different in size (formatting changes size)
    const statsWithFormatting = fs.statSync(withFormattingPath);
    const statsWithoutFormatting = fs.statSync(withoutFormattingPath);
    
    // This check might not always be true, but generally formatting adds size
    expect(statsWithFormatting.size).not.toEqual(statsWithoutFormatting.size);
  });
});