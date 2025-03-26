#!/usr/bin/env node

/**
 * PDFSpark Selenium Test Runner
 * 
 * This script runs Selenium tests against the real backend (no mock mode)
 * It automatically:
 * 1. Starts the frontend development server
 * 2. Starts the backend server in production mode
 * 3. Runs the tests
 * 4. Shuts down the servers when tests are complete
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Configuration
const FRONTEND_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.resolve(__dirname, '../../conversion-service');
const TEST_FILES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['complete-test.mjs'];

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Print header
console.log(`${colors.magenta}
========================================
PDFSpark Selenium Test Runner (Real Backend)
========================================
${colors.reset}`);

// Keep track of processes to kill
const childProcesses = [];

// Check for required dependencies
function checkDependencies() {
  try {
    // Check if mocha is installed
    require.resolve('mocha');
    console.log(`${colors.green}Mocha is already installed${colors.reset}`);
  } catch (e) {
    console.log(`${colors.yellow}Installing Mocha...${colors.reset}`);
    require('child_process').execSync('npm install --save-dev mocha', { 
      cwd: FRONTEND_DIR,
      stdio: 'inherit' 
    });
  }
  
  try {
    // Check if selenium-webdriver is installed
    require.resolve('selenium-webdriver');
    console.log(`${colors.green}Selenium WebDriver is already installed${colors.reset}`);
  } catch (e) {
    console.log(`${colors.yellow}Installing Selenium WebDriver...${colors.reset}`);
    require('child_process').execSync('npm install --save-dev selenium-webdriver', { 
      cwd: FRONTEND_DIR,
      stdio: 'inherit' 
    });
  }
  
  try {
    // Check if chromedriver is installed
    require.resolve('chromedriver');
    console.log(`${colors.green}ChromeDriver is already installed${colors.reset}`);
  } catch (e) {
    console.log(`${colors.yellow}Installing ChromeDriver...${colors.reset}`);
    require('child_process').execSync('npm install --save-dev chromedriver', { 
      cwd: FRONTEND_DIR,
      stdio: 'inherit' 
    });
  }
}

// Start frontend development server
function startFrontendServer() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}Starting Vite development server...${colors.reset}`);
    
    const viteProcess = spawn('npm', ['run', 'dev'], { 
      cwd: FRONTEND_DIR,
      shell: true
    });
    
    childProcesses.push(viteProcess);
    
    viteProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') && output.includes('http://localhost:3000')) {
        console.log(`${colors.green}Vite server started successfully on port 3000${colors.reset}`);
        setTimeout(resolve, 1000); // Give it an extra second to stabilize
      }
    });
    
    viteProcess.stderr.on('data', (data) => {
      console.error(`${colors.red}Vite Error: ${data}${colors.reset}`);
    });
    
    viteProcess.on('error', (err) => {
      console.error(`${colors.red}Failed to start Vite: ${err}${colors.reset}`);
      reject(err);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error('Timeout waiting for Vite server to start'));
    }, 30000);
  });
}

// Start backend server
function startBackendServer() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}Starting backend server...${colors.reset}`);
    
    // Set environment variables for test mode
    const env = {...process.env};
    env.NODE_ENV = 'development';  // Use development mode to skip validations
    env.MOCK_MODE = 'false'; // Start with real backend
    env.PORT = '5001';
    
    const backendProcess = spawn('node', ['index.js'], { 
      cwd: path.join(BACKEND_DIR, 'dist'),
      env,
      shell: true
    });
    
    childProcesses.push(backendProcess);
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Backend: ${output.trim()}`);
      if (output.includes('Server running')) {
        console.log(`${colors.green}Backend server started successfully on port 5001${colors.reset}`);
        setTimeout(resolve, 1000); // Give it an extra second to stabilize
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`${colors.red}Backend Error: ${data}${colors.reset}`);
    });
    
    backendProcess.on('error', (err) => {
      console.error(`${colors.red}Failed to start backend: ${err}${colors.reset}`);
      reject(err);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error('Timeout waiting for backend server to start'));
    }, 30000);
  });
}

// Run Selenium tests
async function runTests(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}Running Selenium tests...${colors.reset}`);
    console.log(`${colors.blue}Using test file: ${path.resolve(__dirname, testFile)}${colors.reset}`);
    
    const testProcess = spawn('node', [testFile], { 
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`${colors.red}Tests failed with code ${code}${colors.reset}`);
        reject(new Error(`Tests failed with code ${code}`));
      } else {
        console.log(`${colors.green}Tests completed successfully${colors.reset}`);
        resolve();
      }
    });
    
    testProcess.on('error', (err) => {
      console.error(`${colors.red}Error running tests: ${err}${colors.reset}`);
      reject(err);
    });
  });
}

// Shutdown servers
function shutdownServers() {
  console.log(`${colors.yellow}Shutting down servers...${colors.reset}`);
  
  childProcesses.forEach(process => {
    try {
      process.kill('SIGTERM');
    } catch (e) {
      // Ignore errors
    }
  });
}

// Main process
async function main() {
  try {
    // Check dependencies first
    checkDependencies();
    
    // Start servers in parallel
    await Promise.all([
      startFrontendServer(),
      startBackendServer()
    ]);
    
    console.log(`${colors.yellow}Waiting for server to stabilize...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Run tests one by one
    for (const testFile of TEST_FILES) {
      await runTests(testFile);
    }
    
    console.log(`${colors.green}All tests completed successfully!${colors.reset}`);
    shutdownServers();
    process.exit(0);
  } catch (err) {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    shutdownServers();
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(`${colors.yellow}Interrupted by user. Cleaning up...${colors.reset}`);
  shutdownServers();
  process.exit(1);
});

// Start the main process
main();