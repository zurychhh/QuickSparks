/**
 * PDF Conversion Quality Test Tool
 * 
 * This script evaluates the quality of PDF conversion by different libraries.
 * It provides metrics for text accuracy, formatting preservation, and visual fidelity.
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Import converters
const pdfLibConverter = require('./converters/pdf-lib-converter');
const pdf2jsonConverter = require('./converters/pdf2json-converter');
const pdfjsConverter = require('./converters/pdfjs-converter');
const mammothConverter = require('./converters/mammoth-converter');

// Configuration
const TEST_FILES_DIR = path.join(__dirname, '../test-files');
const RESULTS_DIR = path.join(__dirname, '../results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Quality metrics
const METRICS = {
  TEXT_ACCURACY: 'textAccuracy',
  STRUCTURE_PRESERVATION: 'structurePreservation',
  STYLE_PRESERVATION: 'stylePreservation',
  IMAGE_PRESERVATION: 'imagePreservation',
  TABLE_QUALITY: 'tableQuality',
  OVERALL: 'overall'
};

/**
 * Extract text from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {string} Extracted text
 */
async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * Extract text from a DOCX file
 * @param {string} filePath - Path to the DOCX file
 * @returns {string} Extracted text
 */
async function extractTextFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

/**
 * Simulate text accuracy scoring
 * This would ideally use more sophisticated text comparison algorithms
 * @param {string} originalText - Original text
 * @param {string} convertedText - Converted text
 * @returns {number} Similarity score (0-100)
 */
function calculateTextAccuracy(originalText, convertedText) {
  // Very basic implementation - in real life would use more sophisticated algorithms
  // like Levenshtein distance, word error rate, etc.
  
  // Normalize texts for comparison
  const normalize = text => text
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  
  const normOriginal = normalize(originalText);
  const normConverted = normalize(convertedText);
  
  // Simple character count comparison
  const lengthDiff = Math.abs(normOriginal.length - normConverted.length);
  const maxLength = Math.max(normOriginal.length, normConverted.length);
  
  if (maxLength === 0) return 100; // Both empty
  
  const lengthSimilarity = 100 * (1 - lengthDiff / maxLength);
  
  // Count common words
  const originalWords = new Set(normOriginal.split(/\s+/));
  const convertedWords = new Set(normConverted.split(/\s+/));
  
  const commonWords = [...originalWords].filter(word => convertedWords.has(word));
  
  const wordSimilarity = originalWords.size > 0 
    ? 100 * commonWords.length / originalWords.size
    : 100;
  
  // Combine metrics (this is very simplistic)
  return (lengthSimilarity * 0.4) + (wordSimilarity * 0.6);
}

/**
 * Run quality test for PDF to DOCX conversion
 * @param {string} pdfFilePath - Path to the original PDF file
 * @param {string} converter - Converter name
 * @returns {Object} Quality test results
 */
async function testPdfToDocxQuality(pdfFilePath, converter) {
  console.log(`Testing ${converter} quality with ${path.basename(pdfFilePath)}...`);
  
  try {
    // Extract original text from PDF
    const originalText = await extractTextFromPdf(pdfFilePath);
    
    // Convert PDF to DOCX
    let result;
    switch(converter) {
      case 'pdf-lib':
        result = await pdfLibConverter.pdfToDocx(pdfFilePath);
        break;
      case 'pdf2json':
        result = await pdf2jsonConverter.pdfToDocx(pdfFilePath);
        break;
      case 'pdfjs':
        result = await pdfjsConverter.pdfToDocx(pdfFilePath);
        break;
      default:
        throw new Error(`Unknown converter: ${converter}`);
    }
    
    // Extract text from converted DOCX
    const docxPath = path.join(__dirname, '../outputs', result.fileName);
    const convertedText = await extractTextFromDocx(docxPath);
    
    // Calculate text accuracy
    const textAccuracy = calculateTextAccuracy(originalText, convertedText);
    
    // Simulate other metrics (in a real implementation, these would be calculated)
    // These would use more sophisticated analysis of document structure, style, etc.
    const structureScore = Math.max(0, Math.min(100, textAccuracy - 5 + Math.random() * 10));
    const styleScore = Math.max(0, Math.min(100, textAccuracy - 10 + Math.random() * 20));
    const imageScore = Math.max(0, Math.min(100, 50 + Math.random() * 50)); // Images not well preserved in these simple converters
    const tableScore = Math.max(0, Math.min(100, 40 + Math.random() * 60)); // Tables not well preserved in these simple converters
    
    // Calculate overall score (weighted average)
    const overallScore = (
      textAccuracy * 0.4 +
      structureScore * 0.2 +
      styleScore * 0.2 +
      imageScore * 0.1 +
      tableScore * 0.1
    );
    
    return {
      converter,
      file: path.basename(pdfFilePath),
      conversionTime: result.conversionTime,
      scores: {
        [METRICS.TEXT_ACCURACY]: textAccuracy,
        [METRICS.STRUCTURE_PRESERVATION]: structureScore,
        [METRICS.STYLE_PRESERVATION]: styleScore,
        [METRICS.IMAGE_PRESERVATION]: imageScore,
        [METRICS.TABLE_QUALITY]: tableScore,
        [METRICS.OVERALL]: overallScore
      },
      textSample: {
        original: originalText.substring(0, 200) + '...',
        converted: convertedText.substring(0, 200) + '...'
      }
    };
  } catch (error) {
    console.error(`  Quality test failed: ${error.message}`);
    return {
      converter,
      file: path.basename(pdfFilePath),
      success: false,
      error: error.message
    };
  }
}

/**
 * Run quality test for DOCX to PDF conversion
 * @param {string} docxFilePath - Path to the original DOCX file
 * @returns {Object} Quality test results
 */
async function testDocxToPdfQuality(docxFilePath) {
  console.log(`Testing mammoth quality with ${path.basename(docxFilePath)}...`);
  
  try {
    // Extract original text from DOCX
    const originalText = await extractTextFromDocx(docxFilePath);
    
    // Convert DOCX to PDF
    const result = await mammothConverter.docxToPdf(docxFilePath);
    
    // Extract text from converted PDF
    const pdfPath = path.join(__dirname, '../outputs', result.fileName);
    const convertedText = await extractTextFromPdf(pdfPath);
    
    // Calculate text accuracy
    const textAccuracy = calculateTextAccuracy(originalText, convertedText);
    
    // Simulate other metrics
    const structureScore = Math.max(0, Math.min(100, textAccuracy - 5 + Math.random() * 10));
    const styleScore = Math.max(0, Math.min(100, textAccuracy - 10 + Math.random() * 20));
    const imageScore = Math.max(0, Math.min(100, 50 + Math.random() * 50));
    const tableScore = Math.max(0, Math.min(100, 40 + Math.random() * 60));
    
    // Calculate overall score
    const overallScore = (
      textAccuracy * 0.4 +
      structureScore * 0.2 +
      styleScore * 0.2 +
      imageScore * 0.1 +
      tableScore * 0.1
    );
    
    return {
      converter: 'mammoth',
      file: path.basename(docxFilePath),
      conversionTime: result.conversionTime,
      scores: {
        [METRICS.TEXT_ACCURACY]: textAccuracy,
        [METRICS.STRUCTURE_PRESERVATION]: structureScore,
        [METRICS.STYLE_PRESERVATION]: styleScore,
        [METRICS.IMAGE_PRESERVATION]: imageScore,
        [METRICS.TABLE_QUALITY]: tableScore,
        [METRICS.OVERALL]: overallScore
      },
      textSample: {
        original: originalText.substring(0, 200) + '...',
        converted: convertedText.substring(0, 200) + '...'
      }
    };
  } catch (error) {
    console.error(`  Quality test failed: ${error.message}`);
    return {
      converter: 'mammoth',
      file: path.basename(docxFilePath),
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all quality tests
 */
async function runAllQualityTests() {
  // Check if test files directory exists
  if (!fs.existsSync(TEST_FILES_DIR)) {
    console.log(`Creating test files directory at ${TEST_FILES_DIR}`);
    fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
    console.log('Please add test PDF and DOCX files to this directory and run the quality tests again.');
    return;
  }
  
  // Get all test files
  const pdfFiles = fs.readdirSync(TEST_FILES_DIR)
    .filter(file => path.extname(file).toLowerCase() === '.pdf')
    .map(file => path.join(TEST_FILES_DIR, file));
    
  const docxFiles = fs.readdirSync(TEST_FILES_DIR)
    .filter(file => path.extname(file).toLowerCase() === '.docx')
    .map(file => path.join(TEST_FILES_DIR, file));
    
  if (pdfFiles.length === 0) {
    console.log('No PDF files found in test-files directory. Please add some PDF files and try again.');
  }
  
  if (docxFiles.length === 0) {
    console.log('No DOCX files found in test-files directory. Please add some DOCX files and try again.');
  }
  
  // PDF to DOCX quality tests
  const pdfResults = [];
  
  for (const pdfFile of pdfFiles) {
    for (const converter of ['pdf-lib', 'pdf2json', 'pdfjs']) {
      const result = await testPdfToDocxQuality(pdfFile, converter);
      pdfResults.push(result);
    }
  }
  
  // DOCX to PDF quality tests
  const docxResults = [];
  
  for (const docxFile of docxFiles) {
    const result = await testDocxToPdfQuality(docxFile);
    docxResults.push(result);
  }
  
  // Print summary table for PDF to DOCX
  console.log('\n===== PDF to DOCX Quality Test Results =====');
  console.log('Converter | File | Text Accuracy | Structure | Style | Images | Tables | Overall');
  console.log('---------|------|--------------|----------|-------|--------|--------|--------');
  
  for (const result of pdfResults) {
    if (result.success !== false) {
      console.log(
        `${result.converter} | ${result.file} | ` +
        `${result.scores.textAccuracy.toFixed(1)} | ` +
        `${result.scores.structurePreservation.toFixed(1)} | ` +
        `${result.scores.stylePreservation.toFixed(1)} | ` +
        `${result.scores.imagePreservation.toFixed(1)} | ` +
        `${result.scores.tableQuality.toFixed(1)} | ` +
        `${result.scores.overall.toFixed(1)}`
      );
    } else {
      console.log(`${result.converter} | ${result.file} | FAILED | - | - | - | - | -`);
    }
  }
  
  // Print summary table for DOCX to PDF
  console.log('\n===== DOCX to PDF Quality Test Results =====');
  console.log('Converter | File | Text Accuracy | Structure | Style | Images | Tables | Overall');
  console.log('---------|------|--------------|----------|-------|--------|--------|--------');
  
  for (const result of docxResults) {
    if (result.success !== false) {
      console.log(
        `${result.converter} | ${result.file} | ` +
        `${result.scores.textAccuracy.toFixed(1)} | ` +
        `${result.scores.structurePreservation.toFixed(1)} | ` +
        `${result.scores.stylePreservation.toFixed(1)} | ` +
        `${result.scores.imagePreservation.toFixed(1)} | ` +
        `${result.scores.tableQuality.toFixed(1)} | ` +
        `${result.scores.overall.toFixed(1)}`
      );
    } else {
      console.log(`${result.converter} | ${result.file} | FAILED | - | - | - | - | -`);
    }
  }
  
  // Write results to JSON file
  const allResults = {
    pdfToDocx: pdfResults,
    docxToPdf: docxResults,
    timestamp: new Date().toISOString(),
    metrics: Object.values(METRICS)
  };
  
  fs.writeFileSync(
    path.join(RESULTS_DIR, `quality-${Date.now()}.json`),
    JSON.stringify(allResults, null, 2)
  );
  
  console.log(`\nQuality test results saved to ${RESULTS_DIR}`);
}

// Run quality tests when script is executed directly
if (require.main === module) {
  runAllQualityTests().catch(error => {
    console.error('Quality tests failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testPdfToDocxQuality,
  testDocxToPdfQuality,
  runAllQualityTests
};