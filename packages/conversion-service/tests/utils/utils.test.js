const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create simplified versions of utility functions for testing
const TEST_TEMP_DIR = path.join(__dirname, '..', 'temp');

function ensureTempDir() {
  if (!fs.existsSync(TEST_TEMP_DIR)) {
    fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
  }
  return TEST_TEMP_DIR;
}

function getTempFilePath(extension) {
  ensureTempDir();
  const filename = `test-${Date.now()}-${Math.floor(Math.random() * 1000)}${extension}`;
  return path.join(TEST_TEMP_DIR, filename);
}

function cleanupTempFiles() {
  if (fs.existsSync(TEST_TEMP_DIR)) {
    const files = fs.readdirSync(TEST_TEMP_DIR);
    
    for (const file of files) {
      fs.unlinkSync(path.join(TEST_TEMP_DIR, file));
    }
    
    fs.rmdirSync(TEST_TEMP_DIR);
  }
}

function fileHasContent(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  const stats = fs.statSync(filePath);
  return stats.isFile() && stats.size > 0;
}

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
    
    // Create temp dir again after cleanup
    ensureTempDir();
    
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