import { getTempFilePath, cleanupTempFiles, fileHasContent, ensureTempDir } from './tempFiles';
import fs from 'fs';
import path from 'path';

describe('Utilities Test', () => {
  // Basic test to validate Jest is working
  test('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  // Test temp directory functions
  test('should create and manage temporary directories', () => {
    // Ensure temp directory exists
    const tempDir = ensureTempDir();
    expect(fs.existsSync(tempDir)).toBe(true);
    
    // Clean up any existing files
    cleanupTempFiles();
    
    // Create a temp file
    const tempFilePath = getTempFilePath('.txt');
    expect(tempFilePath).toContain('test-');
    expect(tempFilePath).toContain('.txt');
    expect(path.dirname(tempFilePath)).toBe(tempDir);
    
    // Check file content detection
    fs.writeFileSync(tempFilePath, 'Test content');
    expect(fileHasContent(tempFilePath)).toBe(true);
    
    // Clean up after test
    cleanupTempFiles();
    expect(fs.existsSync(tempDir)).toBe(false);
  });
});