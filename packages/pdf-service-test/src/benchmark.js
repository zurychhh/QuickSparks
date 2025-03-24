/**
 * PDF Conversion Libraries Benchmark Tool
 * 
 * This script benchmarks different PDF conversion libraries for performance and memory usage.
 * It runs multiple iterations of each conversion library and reports statistics.
 */

const fs = require('fs');
const path = require('path');

// Import converters
const pdfLibConverter = require('./converters/pdf-lib-converter');
const pdf2jsonConverter = require('./converters/pdf2json-converter');
const pdfjsConverter = require('./converters/pdfjs-converter');
const mammothConverter = require('./converters/mammoth-converter');

// Configuration
const TEST_FILES_DIR = path.join(__dirname, '../test-files');
const ITERATIONS = 3;
const CONVERTERS = {
  'pdf-lib': pdfLibConverter.pdfToDocx,
  'pdf2json': pdf2jsonConverter.pdfToDocx,
  'pdfjs': pdfjsConverter.pdfToDocx,
  'mammoth': mammothConverter.docxToPdf
};

/**
 * Run benchmark for a specific file and converter
 * @param {string} converter - The converter name
 * @param {string} filePath - Path to the test file
 * @param {number} iterations - Number of iterations to run
 * @returns {Object} Benchmark results
 */
async function runBenchmark(converter, filePath, iterations) {
  const results = [];
  
  console.log(`Benchmarking ${converter} with ${path.basename(filePath)}...`);
  
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    const memStart = process.memoryUsage();
    
    try {
      await CONVERTERS[converter](filePath);
      
      const end = process.hrtime.bigint();
      const memEnd = process.memoryUsage();
      
      results.push({
        iteration: i + 1,
        timeNs: Number(end - start),
        timeMs: Number(end - start) / 1_000_000,
        memoryUsage: {
          rss: memEnd.rss - memStart.rss,
          heapTotal: memEnd.heapTotal - memStart.heapTotal,
          heapUsed: memEnd.heapUsed - memStart.heapUsed
        }
      });
      
      console.log(`  Iteration ${i + 1}: ${(Number(end - start) / 1_000_000).toFixed(2)} ms`);
    } catch (error) {
      console.error(`  Iteration ${i + 1} failed: ${error.message}`);
    }
  }
  
  // Calculate statistics
  if (results.length === 0) {
    return {
      converter,
      file: path.basename(filePath),
      success: false,
      error: 'All iterations failed'
    };
  }
  
  const times = results.map(r => r.timeMs);
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  const memoryUsages = results.map(r => r.memoryUsage.heapUsed);
  const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
  
  return {
    converter,
    file: path.basename(filePath),
    success: true,
    iterations: results.length,
    avgTimeMs: avgTime,
    minTimeMs: minTime,
    maxTimeMs: maxTime,
    stdDevMs: Math.sqrt(times.map(t => Math.pow(t - avgTime, 2)).reduce((a, b) => a + b, 0) / times.length),
    avgMemoryBytes: avgMemory
  };
}

/**
 * Run all benchmarks
 */
async function runAllBenchmarks() {
  // Check if test files directory exists
  if (!fs.existsSync(TEST_FILES_DIR)) {
    console.log(`Creating test files directory at ${TEST_FILES_DIR}`);
    fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
    console.log('Please add test PDF and DOCX files to this directory and run the benchmark again.');
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
  
  // PDF to DOCX benchmarks
  const pdfResults = [];
  
  for (const pdfFile of pdfFiles) {
    for (const converter of ['pdf-lib', 'pdf2json', 'pdfjs']) {
      const result = await runBenchmark(converter, pdfFile, ITERATIONS);
      pdfResults.push(result);
    }
  }
  
  // DOCX to PDF benchmarks
  const docxResults = [];
  
  for (const docxFile of docxFiles) {
    const result = await runBenchmark('mammoth', docxFile, ITERATIONS);
    docxResults.push(result);
  }
  
  // Print summary table for PDF to DOCX
  console.log('\n===== PDF to DOCX Benchmark Results =====');
  console.log('Converter | File | Avg Time (ms) | Min Time (ms) | Max Time (ms) | Memory Usage (MB)');
  console.log('---------|------|--------------|--------------|--------------|------------------');
  
  for (const result of pdfResults) {
    if (result.success) {
      console.log(`${result.converter} | ${result.file} | ${result.avgTimeMs.toFixed(2)} | ${result.minTimeMs.toFixed(2)} | ${result.maxTimeMs.toFixed(2)} | ${(result.avgMemoryBytes / 1024 / 1024).toFixed(2)}`);
    } else {
      console.log(`${result.converter} | ${result.file} | FAILED | - | - | -`);
    }
  }
  
  // Print summary table for DOCX to PDF
  console.log('\n===== DOCX to PDF Benchmark Results =====');
  console.log('Converter | File | Avg Time (ms) | Min Time (ms) | Max Time (ms) | Memory Usage (MB)');
  console.log('---------|------|--------------|--------------|--------------|------------------');
  
  for (const result of docxResults) {
    if (result.success) {
      console.log(`${result.converter} | ${result.file} | ${result.avgTimeMs.toFixed(2)} | ${result.minTimeMs.toFixed(2)} | ${result.maxTimeMs.toFixed(2)} | ${(result.avgMemoryBytes / 1024 / 1024).toFixed(2)}`);
    } else {
      console.log(`${result.converter} | ${result.file} | FAILED | - | - | -`);
    }
  }
  
  // Write results to JSON file
  const outputDir = path.join(__dirname, '../results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const allResults = {
    pdfToDocx: pdfResults,
    docxToPdf: docxResults,
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    }
  };
  
  fs.writeFileSync(
    path.join(outputDir, `benchmark-${Date.now()}.json`),
    JSON.stringify(allResults, null, 2)
  );
  
  console.log(`\nBenchmark results saved to ${outputDir}`);
}

// Run benchmarks when script is executed directly
if (require.main === module) {
  runAllBenchmarks().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = { runBenchmark, runAllBenchmarks };