#!/usr/bin/env node

/**
 * PDFSpark Selenium Test Runner - All Tests
 * 
 * This script runs all Selenium end-to-end tests for the PDFSpark conversion functionality
 * and generates a report of the results.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const VITE_PORT = 3000;
const VITE_START_TIMEOUT = 15000; // 15 seconds
const TEST_TIMEOUT = 180000; // 3 minutes

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Define the test files to run
const testFiles = [
  'conversion.test.js',
  'comprehensive.test.js',
  'backend-integration.test.js'
];

// Create output directories if they don't exist
const screenshotsDir = path.resolve(__dirname, '../screenshots');
const reportsDir = path.resolve(__dirname, '../reports');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log(`Created screenshots directory at ${screenshotsDir}`);
}

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
  console.log(`Created reports directory at ${reportsDir}`);
}

// Check if Vite server is already running
async function isViteRunning() {
  return new Promise((resolve) => {
    exec(`lsof -i:${VITE_PORT}`, (error, stdout) => {
      if (error || !stdout) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Start Vite development server
async function startViteServer() {
  console.log(`${colors.yellow}Starting Vite development server...${colors.reset}`);
  
  const viteProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  
  viteProcess.stdout.on('data', (data) => {
    if (data.toString().includes('ready in')) {
      console.log(`${colors.green}Vite server started successfully on port ${VITE_PORT}${colors.reset}`);
    }
  });
  
  viteProcess.stderr.on('data', (data) => {
    console.error(`${colors.red}Vite server error: ${data}${colors.reset}`);
  });
  
  // Wait for the server to start
  return new Promise((resolve, reject) => {
    let serverStarted = false;
    
    viteProcess.stdout.on('data', (data) => {
      if (data.toString().includes('ready in') && !serverStarted) {
        serverStarted = true;
        resolve(viteProcess);
      }
    });
    
    // Handle server startup timeout
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error('Vite server startup timed out'));
      }
    }, VITE_START_TIMEOUT);
  });
}

// Install Mocha if not already installed
async function ensureMochaInstalled() {
  return new Promise((resolve, reject) => {
    exec('npx mocha --version', (error) => {
      if (error) {
        console.log(`${colors.yellow}Installing Mocha...${colors.reset}`);
        exec('npm install --no-save mocha', (installError) => {
          if (installError) {
            reject(new Error(`Failed to install Mocha: ${installError}`));
          } else {
            console.log(`${colors.green}Mocha installed successfully${colors.reset}`);
            resolve();
          }
        });
      } else {
        console.log(`${colors.green}Mocha is already installed${colors.reset}`);
        resolve();
      }
    });
  });
}

// Check if Mocha Reporter is installed
async function ensureMochaReporterInstalled() {
  return new Promise((resolve, reject) => {
    exec('npm list mochawesome', (error, stdout) => {
      if (!stdout.includes('mochawesome@')) {
        console.log(`${colors.yellow}Installing mochawesome reporter...${colors.reset}`);
        exec('npm install --no-save mochawesome mochawesome-merge mochawesome-report-generator', (installError) => {
          if (installError) {
            reject(new Error(`Failed to install mochawesome: ${installError}`));
          } else {
            console.log(`${colors.green}Mochawesome installed successfully${colors.reset}`);
            resolve();
          }
        });
      } else {
        console.log(`${colors.green}Mochawesome reporter is already installed${colors.reset}`);
        resolve();
      }
    });
  });
}

// Run a single test file
async function runTest(testFile) {
  console.log(`${colors.blue}Running test: ${testFile}...${colors.reset}`);
  
  return new Promise((resolve) => {
    const testPath = path.resolve(__dirname, testFile);
    const reporterOptions = `--reporter mochawesome --reporter-options reportDir=${reportsDir},reportFilename=${testFile.replace('.js', '')}-report`;
    
    // Run the test using Mocha
    const testProcess = spawn('npx', ['mocha', testPath, '--timeout', TEST_TIMEOUT, reporterOptions], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}Test ${testFile} completed successfully!${colors.reset}`);
        resolve({ file: testFile, success: true, exitCode: code });
      } else {
        console.error(`${colors.red}Test ${testFile} failed with code ${code}${colors.reset}`);
        resolve({ file: testFile, success: false, exitCode: code });
      }
    });
  });
}

// Generate a combined test report
async function generateCombinedReport() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}Generating combined test report...${colors.reset}`);
    
    exec(`npx mochawesome-merge ${reportsDir}/*.json > ${reportsDir}/combined-report.json`, (error) => {
      if (error) {
        console.error(`${colors.red}Error generating combined report: ${error}${colors.reset}`);
        reject(error);
        return;
      }
      
      exec(`npx marge ${reportsDir}/combined-report.json --reportDir ${reportsDir} --reportTitle "PDFSpark Selenium Tests"`, (error) => {
        if (error) {
          console.error(`${colors.red}Error generating HTML report: ${error}${colors.reset}`);
          reject(error);
          return;
        }
        
        console.log(`${colors.green}Combined test report generated at ${reportsDir}/combined-report.html${colors.reset}`);
        resolve();
      });
    });
  });
}

// Main function
async function main() {
  console.log(`${colors.magenta}
========================================
PDFSpark Selenium Test Runner - All Tests
========================================
${colors.reset}`);
  
  let viteProcess = null;
  
  try {
    // Install required tools
    await ensureMochaInstalled();
    await ensureMochaReporterInstalled();
    
    // Check if Vite is already running
    const viteRunning = await isViteRunning();
    
    if (viteRunning) {
      console.log(`${colors.green}Vite server is already running on port ${VITE_PORT}${colors.reset}`);
    } else {
      // Start Vite server
      viteProcess = await startViteServer();
    }
    
    // Wait a moment for server to initialize completely
    console.log(`${colors.yellow}Waiting for server to stabilize...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Run each test and collect results
    const results = [];
    for (const testFile of testFiles) {
      const result = await runTest(testFile);
      results.push(result);
    }
    
    // Generate combined report
    await generateCombinedReport();
    
    // Cleanup
    if (viteProcess) {
      console.log(`${colors.yellow}Shutting down Vite server...${colors.reset}`);
      process.kill(-viteProcess.pid);
    }
    
    // Print summary
    console.log(`${colors.magenta}
========================================
Test Run Summary
========================================
${colors.reset}`);
    
    for (const result of results) {
      const statusColor = result.success ? colors.green : colors.red;
      const status = result.success ? 'PASSED' : 'FAILED';
      console.log(`${statusColor}${result.file}: ${status}${colors.reset}`);
    }
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`${colors.magenta}
Total: ${totalTests} | Passed: ${colors.green}${passedTests}${colors.magenta} | Failed: ${colors.red}${failedTests}${colors.magenta}
${colors.reset}`);
    
    // Create a simple summary file
    const summaryText = `
PDFSpark Selenium Test Summary
=============================
Date: ${new Date().toISOString()}

Test Results:
${results.map(r => `${r.file}: ${r.success ? 'PASSED' : 'FAILED'} (Exit Code: ${r.exitCode})`).join('\n')}

Summary:
Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}

Full report: ${path.join(reportsDir, 'combined-report.html')}
`;
    
    fs.writeFileSync(path.join(reportsDir, 'test-summary.txt'), summaryText);
    console.log(`${colors.blue}Test summary saved to ${path.join(reportsDir, 'test-summary.txt')}${colors.reset}`);
    
    // Exit with error code if any test failed
    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    
    // Cleanup on error
    if (viteProcess) {
      console.log(`${colors.yellow}Shutting down Vite server due to error...${colors.reset}`);
      process.kill(-viteProcess.pid);
    }
    
    process.exit(1);
  }
}

// Run the main function
main();