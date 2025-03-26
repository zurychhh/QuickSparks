#!/usr/bin/env node

/**
 * Selenium Test Runner for PDFSpark
 * 
 * This script runs Selenium end-to-end tests for the PDFSpark conversion functionality.
 * It ensures the frontend dev server is running and executes the test suite.
 */

import { spawn, exec as execCallback } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// Promisify exec
const exec = promisify(execCallback);

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const VITE_PORT = 3000;
const VITE_START_TIMEOUT = 10000; // 10 seconds
const TEST_TIMEOUT = 120000; // 2 minutes

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

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.resolve(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log(`Created screenshots directory at ${screenshotsDir}`);
}

// Check if Vite server is already running
async function isViteRunning() {
  try {
    const { stdout } = await exec(`lsof -i:${VITE_PORT}`);
    return !!stdout;
  } catch (error) {
    return false;
  }
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
  try {
    await exec('npx mocha --version');
    console.log(`${colors.green}Mocha is already installed${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}Installing Mocha...${colors.reset}`);
    try {
      await exec('npm install --no-save mocha');
      console.log(`${colors.green}Mocha installed successfully${colors.reset}`);
    } catch (installError) {
      throw new Error(`Failed to install Mocha: ${installError}`);
    }
  }
}

// Run Selenium tests
async function runTests(testFile) {
  console.log(`${colors.blue}Running Selenium tests...${colors.reset}`);
  
  return new Promise((resolve, reject) => {
    // Determine which test file to run
    const testPath = testFile
      ? path.resolve(__dirname, testFile)
      : path.resolve(__dirname, 'comprehensive.test.js');
    
    console.log(`${colors.blue}Using test file: ${testPath}${colors.reset}`);
    
    // Run the tests using Mocha
    const testProcess = spawn('npx', ['mocha', testPath, '--timeout', TEST_TIMEOUT], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}Tests completed successfully!${colors.reset}`);
        resolve();
      } else {
        console.error(`${colors.red}Tests failed with code ${code}${colors.reset}`);
        reject(new Error(`Tests failed with code ${code}`));
      }
    });
  });
}

// Main function
async function main() {
  console.log(`${colors.magenta}
========================================
PDFSpark Selenium Test Runner
========================================
${colors.reset}`);
  
  let viteProcess = null;
  
  try {
    // Install Mocha if needed
    await ensureMochaInstalled();
    
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the test file from command line args
    const testFile = process.argv[2];
    
    // Run the tests
    await runTests(testFile);
    
    // Cleanup
    if (viteProcess) {
      console.log(`${colors.yellow}Shutting down Vite server...${colors.reset}`);
      process.kill(-viteProcess.pid);
    }
    
    console.log(`${colors.magenta}
========================================
Test run completed successfully!
========================================
${colors.reset}`);
    
    process.exit(0);
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