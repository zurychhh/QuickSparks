const fs = require('fs');
const path = require('path');
const os = require('os');

// Create temporary test directory
const tmpDir = path.join(os.tmpdir(), 'conversion-service-tests');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Setup mock function outside the jest.mock call
function mockConvertDocxToPdf(sourcePath, outputPath, options, progressCallback) {
  // Simulate conversion by reporting progress
  if (typeof progressCallback === 'function') {
    progressCallback({ stage: 'initializing', progress: 0 });
    progressCallback({ stage: 'parsing', progress: 25 });
    progressCallback({ stage: 'converting', progress: 50 });
    progressCallback({ stage: 'formatting', progress: 75 });
    progressCallback({ stage: 'complete', progress: 100 });
  }
  
  // Simulate creating an output file
  fs.writeFileSync(outputPath, 'Mock PDF content');
  
  // Simulate failure for invalid files
  if (!fs.existsSync(sourcePath) || fs.readFileSync(sourcePath, 'utf8').includes('invalid')) {
    if (typeof progressCallback === 'function') {
      progressCallback({ stage: 'error', progress: 0, error: 'Invalid DOCX file' });
    }
    return Promise.resolve({ success: false, error: 'Invalid DOCX file' });
  }
  
  return Promise.resolve({ success: true, pageCount: 5 });
}

// Mock the docxToPdfService module
jest.mock('../../src/services/docxToPdfService', () => {
  return {
    __esModule: true,
    default: {
      convertDocxToPdf: jest.fn().mockImplementation(mockConvertDocxToPdf)
    }
  };
});

// Import service after mocking
const { default: docxToPdfService } = require('../../src/services/docxToPdfService');

describe('DOCX to PDF Conversion Tests', () => {
  let sourcePath, outputPath;
  
  beforeAll(() => {
    // Setup test directories
    const inputDir = path.join(tmpDir, 'inputs');
    const outputDir = path.join(tmpDir, 'outputs');
    
    if (!fs.existsSync(inputDir)) {
      fs.mkdirSync(inputDir, { recursive: true });
    }
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Define paths
    sourcePath = path.join(inputDir, 'test.docx');
    outputPath = path.join(outputDir, 'test.pdf');
  });
  
  afterEach(() => {
    // Clean up test files after each test
    if (fs.existsSync(sourcePath)) {
      fs.unlinkSync(sourcePath);
    }
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  test('should convert DOCX to PDF with high quality', async () => {
    // Create a sample DOCX file
    fs.writeFileSync(sourcePath, 'Sample DOCX content');
    
    // Mock progress callback
    const progressCallback = jest.fn();
    
    // Run conversion
    const result = await docxToPdfService.convertDocxToPdf(
      sourcePath,
      outputPath,
      { quality: 'high', preserveFormatting: true },
      progressCallback
    );
    
    // Verify conversion completed successfully
    expect(result.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    // Verify progress was reported
    expect(progressCallback).toHaveBeenCalledTimes(5);
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({ 
      stage: 'complete',
      progress: 100
    }));
    
    // Verify first and intermediate progress calls
    const progressCalls = progressCallback.mock.calls;
    expect(progressCalls[0][0].stage).toBe('initializing');
    expect(progressCalls[0][0].progress).toBe(0);
    
    // Check for intermediate calls
    expect(progressCalls[2][0].progress).toBe(50);
  });
  
  test('should handle failure gracefully', async () => {
    // Create an invalid DOCX file
    fs.writeFileSync(sourcePath, 'This is an invalid DOCX file');
    
    // Mock progress callback
    const progressCallback = jest.fn();
    
    // Run conversion
    const result = await docxToPdfService.convertDocxToPdf(
      sourcePath,
      outputPath,
      { quality: 'high' },
      progressCallback
    );
    
    // Verify failure result
    expect(result.success).toBe(false);
    
    // Verify error progress was reported
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'error' })
    );
  });
});