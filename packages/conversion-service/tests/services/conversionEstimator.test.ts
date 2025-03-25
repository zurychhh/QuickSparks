import { estimateConversionTime } from '../../src/services/conversionService';
import { getPdfFixturePath, getDocxFixturePath } from '../utils/tempFiles';
import fs from 'fs';

describe('Conversion Time Estimator', () => {
  // Test fixture paths
  const SIMPLE_PDF = getPdfFixturePath('simple');
  const TEXT_HEAVY_PDF = getPdfFixturePath('text_heavy');
  const SIMPLE_DOCX = getDocxFixturePath('simple');
  const TEXT_HEAVY_DOCX = getDocxFixturePath('text_heavy');
  
  test('should estimate conversion time for PDF to DOCX', () => {
    // Skip if fixtures don't exist
    if (!fs.existsSync(SIMPLE_PDF)) {
      return;
    }
    
    // Get file sizes
    const simpleFileSize = fs.statSync(SIMPLE_PDF).size;
    const largeFileSize = fs.existsSync(TEXT_HEAVY_PDF) 
      ? fs.statSync(TEXT_HEAVY_PDF).size 
      : simpleFileSize * 5; // Simulate a larger file if text_heavy.pdf doesn't exist
    
    // Estimate for simple PDF, high quality
    const simpleHighEstimate = estimateConversionTime({
      fileType: 'pdf',
      fileSize: simpleFileSize,
      quality: 'high',
      queuePosition: 0
    });
    
    // Estimate for simple PDF, standard quality
    const simpleStandardEstimate = estimateConversionTime({
      fileType: 'pdf',
      fileSize: simpleFileSize,
      quality: 'standard',
      queuePosition: 0
    });
    
    // Estimate for large PDF, high quality
    const largeHighEstimate = estimateConversionTime({
      fileType: 'pdf',
      fileSize: largeFileSize,
      quality: 'high',
      queuePosition: 0
    });
    
    // Queue position should affect estimate
    const queuedEstimate = estimateConversionTime({
      fileType: 'pdf',
      fileSize: simpleFileSize,
      quality: 'high',
      queuePosition: 3
    });
    
    // Verify estimates are reasonable
    expect(simpleHighEstimate).toBeGreaterThan(1000); // At least 1 second
    expect(simpleStandardEstimate).toBeLessThan(simpleHighEstimate); // Standard should be faster
    expect(largeHighEstimate).toBeGreaterThan(simpleHighEstimate); // Larger file should take longer
    expect(queuedEstimate).toBeGreaterThan(simpleHighEstimate); // Queued should take longer
  });
  
  test('should estimate conversion time for DOCX to PDF', () => {
    // Skip if fixtures don't exist
    if (!fs.existsSync(SIMPLE_DOCX)) {
      return;
    }
    
    // Get file sizes
    const simpleFileSize = fs.statSync(SIMPLE_DOCX).size;
    const largeFileSize = fs.existsSync(TEXT_HEAVY_DOCX) 
      ? fs.statSync(TEXT_HEAVY_DOCX).size 
      : simpleFileSize * 5; // Simulate a larger file if text_heavy.docx doesn't exist
    
    // Estimate for simple DOCX, high quality
    const simpleHighEstimate = estimateConversionTime({
      fileType: 'docx',
      fileSize: simpleFileSize,
      quality: 'high',
      queuePosition: 0
    });
    
    // Estimate for simple DOCX, standard quality
    const simpleStandardEstimate = estimateConversionTime({
      fileType: 'docx',
      fileSize: simpleFileSize,
      quality: 'standard',
      queuePosition: 0
    });
    
    // Estimate for large DOCX, high quality
    const largeHighEstimate = estimateConversionTime({
      fileType: 'docx',
      fileSize: largeFileSize,
      quality: 'high',
      queuePosition: 0
    });
    
    // Queue position should affect estimate
    const queuedEstimate = estimateConversionTime({
      fileType: 'docx',
      fileSize: simpleFileSize,
      quality: 'high',
      queuePosition: 3
    });
    
    // Verify estimates are reasonable
    expect(simpleHighEstimate).toBeGreaterThan(1000); // At least 1 second
    expect(simpleStandardEstimate).toBeLessThan(simpleHighEstimate); // Standard should be faster
    expect(largeHighEstimate).toBeGreaterThan(simpleHighEstimate); // Larger file should take longer
    expect(queuedEstimate).toBeGreaterThan(simpleHighEstimate); // Queued should take longer
  });
  
  test('should handle edge cases', () => {
    // Very small file
    const tinyFileEstimate = estimateConversionTime({
      fileType: 'pdf',
      fileSize: 100, // 100 bytes
      quality: 'high',
      queuePosition: 0
    });
    
    // Very large file
    const hugeFileEstimate = estimateConversionTime({
      fileType: 'pdf',
      fileSize: 1024 * 1024 * 100, // 100 MB
      quality: 'high',
      queuePosition: 0
    });
    
    // Far back in queue
    const farQueueEstimate = estimateConversionTime({
      fileType: 'pdf',
      fileSize: 1024 * 1024, // 1 MB
      quality: 'high',
      queuePosition: 20
    });
    
    // Verify estimates are reasonable
    expect(tinyFileEstimate).toBeGreaterThan(0); // Should always be positive
    expect(hugeFileEstimate).toBeGreaterThan(tinyFileEstimate * 10); // Much larger for huge files
    expect(farQueueEstimate).toBeGreaterThan(60000); // Far in queue should be at least a minute
  });
});