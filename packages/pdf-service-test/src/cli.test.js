/**
 * CLI Tests
 * 
 * This file contains tests for the CLI functionality.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Test file paths
const TEST_PDF = path.join(__dirname, '../test-files/test-document.pdf');
const TEST_DOCX = path.join(__dirname, '../test-files/test-document.docx');
const OUTPUT_DIR = path.join(__dirname, '../test-outputs');

// Create test output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper function to run CLI commands
async function runCli(command) {
  try {
    const { stdout, stderr } = await execPromise(`node ${path.join(__dirname, 'cli.js')} ${command}`);
    return { stdout, stderr };
  } catch (error) {
    return { error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

// Test basic conversion commands
async function testConvert() {
  console.log('Testing conversion commands...');
  
  // PDF to DOCX
  console.log('\nTesting PDF to DOCX conversion:');
  const pdfToDocxResult = await runCli(`convert ${TEST_PDF} --to docx --output-dir ${OUTPUT_DIR}`);
  
  if (pdfToDocxResult.error) {
    console.error('PDF to DOCX conversion failed:', pdfToDocxResult.stderr);
  } else {
    console.log(pdfToDocxResult.stdout);
  }
  
  // DOCX to PDF
  console.log('\nTesting DOCX to PDF conversion:');
  const docxToPdfResult = await runCli(`convert ${TEST_DOCX} --to pdf --output-dir ${OUTPUT_DIR}`);
  
  if (docxToPdfResult.error) {
    console.error('DOCX to PDF conversion failed:', docxToPdfResult.stderr);
  } else {
    console.log(docxToPdfResult.stdout);
  }
}

// Test converter comparison
async function testCompare() {
  console.log('\nTesting converter comparison:');
  const compareResult = await runCli(`compare ${TEST_PDF} --output-dir ${OUTPUT_DIR}`);
  
  if (compareResult.error) {
    console.error('Comparison failed:', compareResult.stderr);
  } else {
    console.log(compareResult.stdout);
  }
}

// Test batch conversion
async function testBatchConvert() {
  console.log('\nTesting batch conversion:');
  const batchResult = await runCli(`batch-convert "${path.join(__dirname, '../test-files')}/*.pdf" --output-dir ${OUTPUT_DIR}`);
  
  if (batchResult.error) {
    console.error('Batch conversion failed:', batchResult.stderr);
  } else {
    console.log(batchResult.stdout);
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting CLI tests...');
    
    await testConvert();
    await testCompare();
    await testBatchConvert();
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests
};