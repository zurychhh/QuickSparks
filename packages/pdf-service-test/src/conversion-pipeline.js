/**
 * PDF Conversion Pipeline
 * 
 * This module implements a complete end-to-end pipeline for PDF/DOCX conversion,
 * combining document processing, quality assessment, and optimization.
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Import converters
const pdfLibConverter = require('./converters/pdf-lib-converter');
const pdf2jsonConverter = require('./converters/pdf2json-converter');
const pdfjsConverter = require('./converters/pdfjs-converter');
const mammothConverter = require('./converters/mammoth-converter');

// Import quality assessment
const qualityMetrics = require('./quality-metrics');

// Configuration
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '../outputs');
const DEFAULT_TEMP_DIR = path.join(__dirname, '../temp');

// Create required directories
if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
  fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(DEFAULT_TEMP_DIR)) {
  fs.mkdirSync(DEFAULT_TEMP_DIR, { recursive: true });
}

/**
 * Conversion strategy map
 */
const CONVERTERS = {
  'pdf-to-docx': {
    'default': pdfjsConverter.pdfToDocx,  // Best quality by default
    'pdf-lib': pdfLibConverter.pdfToDocx,  // Fastest
    'pdf2json': pdf2jsonConverter.pdfToDocx,  // Balance
    'pdfjs': pdfjsConverter.pdfToDocx     // Best quality
  },
  'docx-to-pdf': {
    'default': mammothConverter.docxToPdf,
    'mammoth': mammothConverter.docxToPdf
  }
};

/**
 * Quality evaluator functions
 */
const QUALITY_EVALUATORS = {
  'pdf-to-docx': qualityMetrics.evaluatePdfToDocxQuality,
  'docx-to-pdf': qualityMetrics.evaluateDocxToPdfQuality
};

/**
 * Detect file type from extension
 * @param {string} filePath - Path to the file
 * @returns {string} File type ('pdf' or 'docx')
 */
function detectFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return 'pdf';
  } else if (ext === '.docx') {
    return 'docx';
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Determine conversion type based on input and output file types
 * @param {string} inputType - Input file type
 * @param {string} outputType - Output file type
 * @returns {string} Conversion type
 */
function determineConversionType(inputType, outputType) {
  if (inputType === 'pdf' && outputType === 'docx') {
    return 'pdf-to-docx';
  } else if (inputType === 'docx' && outputType === 'pdf') {
    return 'docx-to-pdf';
  } else {
    throw new Error(`Unsupported conversion: ${inputType} to ${outputType}`);
  }
}

/**
 * Determine output file type based on requested conversion
 * @param {string} inputType - Input file type
 * @param {string} conversion - Conversion type or destination format
 * @returns {string} Output file type
 */
function determineOutputType(inputType, conversion) {
  if (conversion === 'pdf' || conversion === 'docx') {
    return conversion;
  }
  
  if (inputType === 'pdf') {
    return 'docx';
  } else if (inputType === 'docx') {
    return 'pdf';
  } else {
    throw new Error(`Cannot determine output type for input: ${inputType}, conversion: ${conversion}`);
  }
}

/**
 * Pre-process a PDF file (optimize, repair, etc.)
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Path to the pre-processed file
 */
async function preprocessPdf(filePath) {
  try {
    // Read the PDF file
    const pdfBytes = fs.readFileSync(filePath);
    
    // Load the PDF with pdf-lib (can help repair some issues)
    const pdfDoc = await PDFDocument.load(pdfBytes, { 
      ignoreEncryption: true,
      updateMetadata: false
    });
    
    // Create a new document with the same content (cleans up some issues)
    const tempFilePath = path.join(
      DEFAULT_TEMP_DIR, 
      `preprocessed-${Date.now()}-${path.basename(filePath)}`
    );
    
    // Save the repaired PDF
    const processedBytes = await pdfDoc.save();
    fs.writeFileSync(tempFilePath, processedBytes);
    
    return tempFilePath;
  } catch (error) {
    console.error(`Error pre-processing PDF: ${error.message}`);
    // If preprocessing fails, return the original file
    return filePath;
  }
}

/**
 * Pre-process a DOCX file
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<string>} Path to the pre-processed file
 */
async function preprocessDocx(filePath) {
  // For now, return the original file - we can add docx repair/optimization later
  return filePath;
}

/**
 * Handle post-conversion processing
 * @param {string} outputPath - Path to the converted file
 * @param {string} outputType - Type of the output file
 * @param {Object} options - Processing options
 * @returns {Promise<string>} Path to the post-processed file
 */
async function postProcess(outputPath, outputType, options = {}) {
  // This could include optimization, metadata addition, etc.
  // For now, return the original file
  return outputPath;
}

/**
 * Convert a document from one format to another with optional quality assessment
 * @param {string} inputPath - Path to the input file
 * @param {string} outputType - Desired output format ('pdf' or 'docx')
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Conversion result with file path and metadata
 */
async function convertDocument(inputPath, outputType, options = {}) {
  const {
    outputDir = DEFAULT_OUTPUT_DIR,
    converter = 'default',
    assessQuality = false,
    preprocessInput = true
  } = options;
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Detect file type
    const inputType = detectFileType(inputPath);
    
    // Determine actual output type if not explicitly provided
    const actualOutputType = determineOutputType(inputType, outputType);
    
    // Determine conversion type
    const conversionType = determineConversionType(inputType, actualOutputType);
    
    // Pre-process the input file if requested
    let processedInputPath = inputPath;
    if (preprocessInput) {
      if (inputType === 'pdf') {
        processedInputPath = await preprocessPdf(inputPath);
      } else if (inputType === 'docx') {
        processedInputPath = await preprocessDocx(inputPath);
      }
    }
    
    // Get the appropriate converter
    const converterFn = CONVERTERS[conversionType][converter] || 
                       CONVERTERS[conversionType].default;
    
    if (!converterFn) {
      throw new Error(`No converter available for ${conversionType} with option ${converter}`);
    }
    
    // Start measuring conversion time
    const startTime = Date.now();
    
    // Convert the document
    const conversionResult = await converterFn(processedInputPath);
    
    // End measuring conversion time
    const conversionTime = Date.now() - startTime;
    
    // Get the output file path
    const outputPath = path.join(outputDir, conversionResult.fileName);
    
    // Post-process the output file
    const processedOutputPath = await postProcess(outputPath, actualOutputType, options);
    
    // Assess quality if requested
    let qualityResult = null;
    if (assessQuality) {
      try {
        const qualityEvaluator = QUALITY_EVALUATORS[conversionType];
        if (qualityEvaluator) {
          qualityResult = await qualityEvaluator(
            processedInputPath,
            processedOutputPath
          );
        }
      } catch (error) {
        console.error(`Error assessing quality: ${error.message}`);
        // Don't fail the conversion if quality assessment fails
      }
    }
    
    // Clean up temporary files
    if (processedInputPath !== inputPath && fs.existsSync(processedInputPath)) {
      fs.unlinkSync(processedInputPath);
    }
    
    return {
      success: true,
      inputPath,
      outputPath: processedOutputPath,
      outputFileName: path.basename(processedOutputPath),
      conversionType,
      conversionTime,
      converter,
      pageCount: conversionResult.pageCount,
      quality: qualityResult
    };
  } catch (error) {
    console.error(`Conversion error: ${error.message}`);
    throw error;
  }
}

/**
 * Convert a PDF to DOCX
 * @param {string} pdfPath - Path to the PDF file
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Conversion result
 */
async function convertPdfToDocx(pdfPath, options = {}) {
  return convertDocument(pdfPath, 'docx', options);
}

/**
 * Convert a DOCX to PDF
 * @param {string} docxPath - Path to the DOCX file
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Conversion result
 */
async function convertDocxToPdf(docxPath, options = {}) {
  return convertDocument(docxPath, 'pdf', options);
}

/**
 * Batch convert multiple documents
 * @param {Array<string>} filePaths - Array of file paths to convert
 * @param {Object} options - Conversion options
 * @returns {Promise<Array<Object>>} Array of conversion results
 */
async function batchConvert(filePaths, options = {}) {
  const results = [];
  
  for (const filePath of filePaths) {
    try {
      const inputType = detectFileType(filePath);
      const outputType = inputType === 'pdf' ? 'docx' : 'pdf';
      
      const result = await convertDocument(filePath, outputType, options);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        inputPath: filePath,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Compare different converters for a single document
 * @param {string} filePath - Path to the document to convert
 * @param {Object} options - Comparison options
 * @returns {Promise<Object>} Comparison results for each converter
 */
async function compareConverters(filePath, options = {}) {
  const inputType = detectFileType(filePath);
  const outputType = inputType === 'pdf' ? 'docx' : 'pdf';
  const conversionType = determineConversionType(inputType, outputType);
  
  const results = [];
  const converters = Object.keys(CONVERTERS[conversionType]).filter(c => c !== 'default');
  
  for (const converter of converters) {
    try {
      const result = await convertDocument(filePath, outputType, {
        ...options,
        converter,
        assessQuality: true
      });
      
      results.push({
        converter,
        ...result
      });
    } catch (error) {
      results.push({
        converter,
        success: false,
        inputPath: filePath,
        error: error.message
      });
    }
  }
  
  return {
    inputPath: filePath,
    inputType,
    outputType,
    results
  };
}

// Example of pipeline usage
async function example() {
  try {
    // Simple conversion
    const pdfFilePath = path.join(__dirname, '../test-files/test-document.pdf');
    const result = await convertPdfToDocx(pdfFilePath, {
      assessQuality: true
    });
    
    console.log(`Converted ${result.inputPath} to ${result.outputPath}`);
    console.log(`Conversion time: ${result.conversionTime}ms`);
    
    if (result.quality) {
      console.log(`Quality score: ${result.quality.overall.toFixed(2)}/100`);
    }
    
    // Compare converters
    const comparisonResult = await compareConverters(pdfFilePath);
    
    console.log('\nConverter Comparison:');
    console.log('Converter | Time (ms) | Quality');
    console.log('----------|-----------|--------');
    
    for (const res of comparisonResult.results) {
      const quality = res.quality ? res.quality.overall.toFixed(2) : 'N/A';
      console.log(`${res.converter.padEnd(10)} | ${res.conversionTime.toString().padEnd(9)} | ${quality}`);
    }
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run example if called directly
if (require.main === module) {
  example();
}

module.exports = {
  convertDocument,
  convertPdfToDocx,
  convertDocxToPdf,
  batchConvert,
  compareConverters,
  detectFileType,
  determineConversionType
};