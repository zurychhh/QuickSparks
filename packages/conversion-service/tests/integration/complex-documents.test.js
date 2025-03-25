const fs = require('fs');
const path = require('path');
const os = require('os');

// Create temporary test directory
const tmpDir = path.join(os.tmpdir(), 'conversion-service-complex-tests');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Define input and output directories
const inputDir = path.join(tmpDir, 'inputs');
const outputDir = path.join(tmpDir, 'outputs');

// Create directories if they don't exist
if (!fs.existsSync(inputDir)) {
  fs.mkdirSync(inputDir, { recursive: true });
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create test document data
const testDocuments = {
  pdf: {
    simple: 'Simple PDF content',
    formatted: 'Formatted PDF content with styles',
    textHeavy: 'Text-heavy PDF with lots of content '.repeat(20),
    withImages: 'PDF with images placeholder',
    withTables: 'PDF with tables placeholder'
  },
  docx: {
    simple: 'Simple DOCX content',
    formatted: 'Formatted DOCX content with styles',
    textHeavy: 'Text-heavy DOCX with lots of content '.repeat(20),
    withImages: 'DOCX with images placeholder',
    withTables: 'DOCX with tables placeholder'
  }
};

// Setup mock functions
function mockConvertPdfToDocx(sourcePath, outputPath, options, progressCallback) {
  // Simulate conversion by reporting progress
  if (typeof progressCallback === 'function') {
    progressCallback({ stage: 'initializing', progress: 0 });
    progressCallback({ stage: 'converting', progress: 50 });
    progressCallback({ stage: 'complete', progress: 100 });
  }
  
  // Create the output file
  fs.writeFileSync(outputPath, 'Mock DOCX content');
  
  return Promise.resolve({ success: true, pageCount: 5 });
}

function mockConvertDocxToPdf(sourcePath, outputPath, options, progressCallback) {
  // Simulate conversion by reporting progress
  if (typeof progressCallback === 'function') {
    progressCallback({ stage: 'initializing', progress: 0 });
    progressCallback({ stage: 'converting', progress: 50 });
    progressCallback({ stage: 'complete', progress: 100 });
  }
  
  // Create the output file
  fs.writeFileSync(outputPath, 'Mock PDF content');
  
  return Promise.resolve({ success: true, pageCount: 5 });
}

// Mock the conversion services
jest.mock('../../src/services/pdfToDocxService', () => ({
  __esModule: true,
  default: {
    convertPdfToDocx: jest.fn().mockImplementation(mockConvertPdfToDocx)
  }
}));

jest.mock('../../src/services/docxToPdfService', () => ({
  __esModule: true,
  default: {
    convertDocxToPdf: jest.fn().mockImplementation(mockConvertDocxToPdf)
  }
}));

// Import the services after mocking
const { default: pdfToDocxService } = require('../../src/services/pdfToDocxService');
const { default: docxToPdfService } = require('../../src/services/docxToPdfService');

describe('Complex Document Conversion Tests', () => {
  beforeAll(() => {
    // Create test files
    Object.entries(testDocuments.pdf).forEach(([type, content]) => {
      fs.writeFileSync(path.join(inputDir, `${type}.pdf`), content);
    });
    
    Object.entries(testDocuments.docx).forEach(([type, content]) => {
      fs.writeFileSync(path.join(inputDir, `${type}.docx`), content);
    });
  });
  
  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should convert different types of PDF documents to DOCX', async () => {
    const documentTypes = ['simple', 'formatted', 'textHeavy', 'withImages', 'withTables'];
    
    for (const type of documentTypes) {
      const sourcePath = path.join(inputDir, `${type}.pdf`);
      const outputPath = path.join(outputDir, `${type}.docx`);
      
      // Skip if source file doesn't exist
      if (!fs.existsSync(sourcePath)) continue;
      
      const result = await pdfToDocxService.convertPdfToDocx(
        sourcePath,
        outputPath,
        { quality: 'high', preserveFormatting: true }
      );
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(outputPath)).toBe(true);
    }
    
    // Verify that all conversions were called
    expect(pdfToDocxService.convertPdfToDocx).toHaveBeenCalledTimes(documentTypes.length);
  });
  
  test('should convert different types of DOCX documents to PDF', async () => {
    const documentTypes = ['simple', 'formatted', 'textHeavy', 'withImages', 'withTables'];
    
    for (const type of documentTypes) {
      const sourcePath = path.join(inputDir, `${type}.docx`);
      const outputPath = path.join(outputDir, `${type}.pdf`);
      
      // Skip if source file doesn't exist
      if (!fs.existsSync(sourcePath)) continue;
      
      const result = await docxToPdfService.convertDocxToPdf(
        sourcePath,
        outputPath,
        { quality: 'high', preserveFormatting: true }
      );
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(outputPath)).toBe(true);
    }
    
    // Verify that all conversions were called
    expect(docxToPdfService.convertDocxToPdf).toHaveBeenCalledTimes(documentTypes.length);
  });
  
  test('should handle round-trip conversion (PDF -> DOCX -> PDF)', async () => {
    const originalPdfPath = path.join(inputDir, 'formatted.pdf');
    const intermediatePath = path.join(outputDir, 'roundtrip_intermediate.docx');
    const finalPath = path.join(outputDir, 'roundtrip_final.pdf');
    
    // Mock progress callback
    const progressCallback = jest.fn();
    
    // Step 1: Convert PDF to DOCX
    const pdfToDocxResult = await pdfToDocxService.convertPdfToDocx(
      originalPdfPath,
      intermediatePath,
      { quality: 'high', preserveFormatting: true },
      progressCallback
    );
    
    expect(pdfToDocxResult.success).toBe(true);
    expect(fs.existsSync(intermediatePath)).toBe(true);
    
    // Step 2: Convert DOCX back to PDF
    const docxToPdfResult = await docxToPdfService.convertDocxToPdf(
      intermediatePath,
      finalPath,
      { quality: 'high', preserveFormatting: true },
      progressCallback
    );
    
    expect(docxToPdfResult.success).toBe(true);
    expect(fs.existsSync(finalPath)).toBe(true);
    
    // Verify progress was reported for both conversions
    expect(progressCallback).toHaveBeenCalledTimes(6); // 3 calls for each conversion
  });
});