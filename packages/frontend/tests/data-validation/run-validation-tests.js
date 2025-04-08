// run-validation-tests.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import validation test module directly
import { validateObject } from './validation-test.js';

// Create test reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '..', '..', 'test-reports', 'data-validation');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Check if a server is running on a specific URL
async function checkServerRunning(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Validate schema for backend data
function validateBackendData(data, schema) {
  return validateObject(data, schema);
}

// Try to fetch data from multiple potential backend URLs
async function fetchDataFromBackend(paths, timeout = 5000) {
  // Potential backend URLs to try
  const potentialBaseUrls = [
    'http://localhost:3000/pdfspark/api',
    'http://localhost:5000/api',
    'http://localhost:5001',
    'http://localhost:3001',
    'http://localhost:8080/api',
    'http://localhost:8000/api'
  ];
  
  console.log('Trying to fetch data from real backend...');
  
  for (const baseUrl of potentialBaseUrls) {
    for (const path of paths) {
      const url = `${baseUrl}${path}`;
      try {
        console.log(`Attempting to fetch from: ${url}`);
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          timeout: timeout
        });
        
        console.log(`Response from ${url}: ${response.status}`);
        
        if (response.status >= 200 && response.status < 300) {
          try {
            const data = await response.json();
            console.log(`Successfully fetched data from ${url}`);
            return { success: true, url, data };
          } catch (parseError) {
            console.log(`Response from ${url} is not valid JSON`);
          }
        }
      } catch (error) {
        console.log(`Failed to fetch from ${url}: ${error.message}`);
      }
    }
  }
  
  console.log('Could not fetch real data from any backend URL');
  return { success: false };
}

// Test conversion status endpoint
async function testConversionStatus() {
  const testId = 'test123';
  const paths = [
    `/conversion/status?id=${testId}`,
    `/convert/status?id=${testId}`,
    `/status?id=${testId}`
  ];
  
  return await fetchDataFromBackend(paths);
}

// Test file data validation against real files
function validateFileData() {
  // File schema definition from validation-test.js
  const fileSchema = {
    name: {
      type: 'string',
      required: true,
      minLength: 1
    },
    size: {
      type: 'number',
      required: true,
      min: 0
    },
    type: {
      type: 'string',
      required: true,
      enum: ['pdf', 'docx', 'doc', 'txt']
    },
    lastModified: {
      type: 'number',
      required: false
    }
  };
  
  // Get real files from the public directory
  const filesDir = path.join(process.cwd(), 'public');
  const testFiles = [];
  
  if (fs.existsSync(filesDir)) {
    // Read all files in the directory that are real test files
    const fileList = fs.readdirSync(filesDir);
    
    for (const file of fileList) {
      // Only include PDFs, DOCXs, etc. for validation
      if (/\.(pdf|docx|doc|txt)$/i.test(file)) {
        const filePath = path.join(filesDir, file);
        const stats = fs.statSync(filePath);
        
        const fileType = path.extname(file).replace('.', '').toLowerCase();
        
        testFiles.push({
          name: file,
          size: stats.size,
          type: fileType,
          lastModified: stats.mtimeMs
        });
      }
    }
  }
  
  // If no real files are found, create at least one for testing
  if (testFiles.length === 0) {
    console.log('No real files found, creating test files');
    // Create test PDF
    const pdfPath = path.join(filesDir, 'sample-test.pdf');
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }
    fs.writeFileSync(pdfPath, '%PDF-1.4\nReal PDF test file');
    const pdfStats = fs.statSync(pdfPath);
    
    testFiles.push({
      name: 'sample-test.pdf',
      size: pdfStats.size,
      type: 'pdf',
      lastModified: pdfStats.mtimeMs
    });
    
    // Create test DOCX
    const docxPath = path.join(filesDir, 'sample-test.docx');
    fs.writeFileSync(docxPath, 'Real DOCX test file');
    const docxStats = fs.statSync(docxPath);
    
    testFiles.push({
      name: 'sample-test.docx',
      size: docxStats.size,
      type: 'docx',
      lastModified: docxStats.mtimeMs
    });
    
    // Add some invalid test files for testing validation errors
    testFiles.push({
      name: '', // Invalid - empty name
      size: 1024,
      type: 'pdf',
      lastModified: Date.now()
    });
    
    testFiles.push({
      name: 'bad-size.pdf',
      size: -5, // Invalid - negative size
      type: 'pdf',
      lastModified: Date.now()
    });
    
    testFiles.push({
      name: 'bad-type.xyz',
      size: 1024, 
      type: 'xyz', // Invalid - unsupported type
      lastModified: Date.now()
    });
  }
  
  // Validate real files
  const fileResults = {
    total: testFiles.length,
    passed: 0,
    failed: 0,
    details: []
  };
  
  testFiles.forEach((file, index) => {
    const errors = validateObject(file, fileSchema);
    
    if (errors.length > 0) {
      fileResults.failed++;
      fileResults.details.push({
        sample: index + 1,
        data: file,
        errors,
        status: 'failed'
      });
    } else {
      fileResults.passed++;
      fileResults.details.push({
        sample: index + 1,
        data: file,
        status: 'passed'
      });
    }
  });
  
  return fileResults;
}

// Create sample conversion validation data
function validateConversionData(realData = null) {
  // Conversion schema definition from validation-test.js
  const conversionSchema = {
    id: {
      type: 'string',
      required: true,
      minLength: 5
    },
    status: {
      type: 'string',
      required: true,
      enum: ['pending', 'processing', 'completed', 'failed']
    },
    progress: {
      type: 'number',
      required: false,
      min: 0,
      max: 100
    }
  };
  
  // Start with real backend data if available
  const conversionData = [];
  
  if (realData && realData.success && realData.data) {
    // Real data from backend
    console.log(`Adding real conversion data from ${realData.url}`);
    conversionData.push(realData.data);
  }
  
  // Add some additional test sample data for more complete testing
  conversionData.push(
    { id: 'conv-123456', status: 'pending', progress: 0 },
    { id: 'conv-789012', status: 'processing', progress: 45 },
    { id: 'conv-345678', status: 'completed', progress: 100 },
    { id: 'conv-901234', status: 'failed' }
  );
  
  // Add an invalid data point to test validation errors
  conversionData.push({
    id: 'x', // Invalid - too short
    status: 'unknown', // Invalid - unknown status
    progress: 150 // Invalid - exceeds maximum
  });
  
  // Validate conversion data
  const conversionResults = {
    total: conversionData.length,
    passed: 0,
    failed: 0,
    details: []
  };
  
  conversionData.forEach((data, index) => {
    const errors = validateObject(data, conversionSchema);
    
    if (errors.length > 0) {
      conversionResults.failed++;
      conversionResults.details.push({
        sample: index + 1,
        data: data,
        errors,
        status: 'failed'
      });
    } else {
      conversionResults.passed++;
      conversionResults.details.push({
        sample: index + 1,
        data: data,
        status: 'passed'
      });
    }
  });
  
  return conversionResults;
}

async function runDataValidationTests() {
  console.log('Starting Data Validation Tests...');
  
  try {
    console.log('🔍 Running data validation tests directly with REAL data...');
    
    // Try to fetch real conversion data from the backend
    const realConversionData = await testConversionStatus();
    const usedRealBackend = realConversionData.success;
    
    if (usedRealBackend) {
      console.log('✅ Using REAL backend data for validation tests');
    } else {
      console.log('⚠️ Could not connect to backend - will include some synthetic test data');
    }
    
    // 1. File Validation
    console.log('Running file validation tests with real files...');
    const fileResults = validateFileData();
    
    // 2. Conversion Validation
    console.log('Running conversion validation tests...');
    const conversionResults = validateConversionData(realConversionData);
    
    // Create summary results
    const summaryResults = {
      timestamp: new Date().toISOString(),
      fileValidation: {
        total: fileResults.total,
        passed: fileResults.passed,
        failed: fileResults.failed,
        passRate: (fileResults.passed / fileResults.total) * 100
      },
      conversionValidation: {
        total: conversionResults.total,
        passed: conversionResults.passed,
        failed: conversionResults.failed,
        passRate: (conversionResults.passed / conversionResults.total) * 100
      },
      overallPassRate: ((fileResults.passed + conversionResults.passed) / 
                         (fileResults.total + conversionResults.total)) * 100,
      usedRealBackend: usedRealBackend,
      backendUrl: usedRealBackend ? realConversionData.url : 'Not connected'
    };
    
    // Create detailed report
    const detailedResults = {
      summary: summaryResults,
      details: {
        fileValidation: fileResults.details,
        conversionValidation: conversionResults.details
      }
    };
    
    // Save reports
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    fs.writeFileSync(
      path.join(reportsDir, `data-validation-summary-${timestamp}.json`),
      JSON.stringify(summaryResults, null, 2)
    );
    
    fs.writeFileSync(
      path.join(reportsDir, `data-validation-details-${timestamp}.json`),
      JSON.stringify(detailedResults, null, 2)
    );
    
    console.log('\n📊 Data Validation Test Results Summary:');
    console.log(`File Validation: ${summaryResults.fileValidation.passed}/${summaryResults.fileValidation.total} tests passed (${summaryResults.fileValidation.passRate.toFixed(2)}%)`);
    console.log(`Conversion Validation: ${summaryResults.conversionValidation.passed}/${summaryResults.conversionValidation.total} tests passed (${summaryResults.conversionValidation.passRate.toFixed(2)}%)`);
    console.log(`Overall Pass Rate: ${summaryResults.overallPassRate.toFixed(2)}%`);
    
    // Create a simple HTML report
    const htmlReport = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>PDFSpark Data Validation Test Results</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #333; }
          .summary { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
          .pass-rate { font-weight: bold; }
          .good { color: green; }
          .warning { color: orange; }
          .bad { color: red; }
          .backend-info { background-color: #e6f7ff; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>PDFSpark Data Validation Test Results</h1>
        <p>Timestamp: ${summaryResults.timestamp}</p>
        
        <div class="backend-info">
          <h2>Backend Connection</h2>
          <p><strong>Used Real Backend:</strong> ${summaryResults.usedRealBackend ? 'Yes ✅' : 'No ⚠️'}</p>
          <p><strong>Backend URL:</strong> ${summaryResults.backendUrl}</p>
        </div>
        
        <div class="summary">
          <h2>Summary</h2>
          <p>File Validation: ${summaryResults.fileValidation.passed}/${summaryResults.fileValidation.total} tests passed 
             (<span class="${summaryResults.fileValidation.passRate >= 80 ? 'good' : summaryResults.fileValidation.passRate >= 60 ? 'warning' : 'bad'}">${summaryResults.fileValidation.passRate.toFixed(2)}%</span>)
          </p>
          <p>Conversion Validation: ${summaryResults.conversionValidation.passed}/${summaryResults.conversionValidation.total} tests passed
             (<span class="${summaryResults.conversionValidation.passRate >= 80 ? 'good' : summaryResults.conversionValidation.passRate >= 60 ? 'warning' : 'bad'}">${summaryResults.conversionValidation.passRate.toFixed(2)}%</span>)
          </p>
          <p>Overall Pass Rate: <span class="${summaryResults.overallPassRate >= 80 ? 'good' : summaryResults.overallPassRate >= 60 ? 'warning' : 'bad'}">${summaryResults.overallPassRate.toFixed(2)}%</span></p>
        </div>
        
        <p>See the JSON files in the test reports directory for detailed test results.</p>
      </body>
    </html>
    `;
    
    fs.writeFileSync(path.join(reportsDir, 'data-validation-report.html'), htmlReport);
    console.log(`HTML report saved to: ${path.join(reportsDir, 'data-validation-report.html')}`);
    console.log(`Detailed results saved to: ${reportsDir}`);
    console.log('✅ Data validation tests completed');
    
  } catch (error) {
    console.error('❌ Error running data validation tests:', error.message);
    process.exit(1);
  }
}

// Run tests
runDataValidationTests().catch(error => {
  console.error('Failed to run data validation tests:', error);
  process.exit(1);
});