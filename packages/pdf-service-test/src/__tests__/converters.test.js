/**
 * Tests for PDF conversion libraries
 */

const fs = require('fs');
const path = require('path');
const pdfLibConverter = require('../converters/pdf-lib-converter');
const pdf2jsonConverter = require('../converters/pdf2json-converter');
const pdfjsConverter = require('../converters/pdfjs-converter');
const mammothConverter = require('../converters/mammoth-converter');
const { createSamplePdf, createSampleDocx } = require('../create-sample-pdf');

// Test file paths
let pdfFilePath;
let docxFilePath;

beforeAll(async () => {
  try {
    // Create test files if they don't exist
    pdfFilePath = path.join(__dirname, '../../test-files/sample-document.pdf');
    docxFilePath = path.join(__dirname, '../../test-files/sample-document.docx');
    
    if (!fs.existsSync(pdfFilePath)) {
      pdfFilePath = await createSamplePdf();
    }
    
    if (!fs.existsSync(docxFilePath)) {
      docxFilePath = await createSampleDocx();
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../../outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error in test setup:', error);
    throw error;
  }
});

describe('PDF to DOCX Converters', () => {
  test('pdf-lib converter should convert PDF to DOCX', async () => {
    const result = await pdfLibConverter.pdfToDocx(pdfFilePath);
    
    expect(result).toHaveProperty('fileName');
    expect(result).toHaveProperty('conversionTime');
    
    const outputPath = path.join(__dirname, '../../outputs', result.fileName);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(0);
  });
  
  test('pdf2json converter should convert PDF to DOCX', async () => {
    const result = await pdf2jsonConverter.pdfToDocx(pdfFilePath);
    
    expect(result).toHaveProperty('fileName');
    expect(result).toHaveProperty('conversionTime');
    
    const outputPath = path.join(__dirname, '../../outputs', result.fileName);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(0);
  });
  
  test('pdfjs converter should convert PDF to DOCX', async () => {
    const result = await pdfjsConverter.pdfToDocx(pdfFilePath);
    
    expect(result).toHaveProperty('fileName');
    expect(result).toHaveProperty('conversionTime');
    
    const outputPath = path.join(__dirname, '../../outputs', result.fileName);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(0);
  });
});

describe('DOCX to PDF Converters', () => {
  test('mammoth converter should convert DOCX to PDF', async () => {
    const result = await mammothConverter.docxToPdf(docxFilePath);
    
    expect(result).toHaveProperty('fileName');
    expect(result).toHaveProperty('conversionTime');
    
    const outputPath = path.join(__dirname, '../../outputs', result.fileName);
    expect(fs.existsSync(outputPath)).toBe(true);
    
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(0);
  });
});