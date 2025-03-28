// setup-test-environment.js
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create test reports directory structure
const testReportsDir = path.join(__dirname, '..', 'test-reports');
const categories = ['functional', 'performance', 'ui-ux', 'cross-browser', 'api', 'data-validation', 'deployment', 'seo'];

// Create base directory
if (!fs.existsSync(testReportsDir)) {
  fs.mkdirSync(testReportsDir, { recursive: true });
}

// Create category subdirectories
for (const category of categories) {
  const categoryDir = path.join(testReportsDir, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
}

async function setupEnvironment() {
  console.log('Setting up test environment...');
  
  try {
    // Install required packages
    console.log('Installing test dependencies...');
    
    // Install Playwright browsers
    console.log('Installing Playwright browsers...');
    await execAsync('npx playwright install --with-deps', { stdio: 'inherit' });
    
    // Initialize the environment
    console.log('Environment setup complete');
    console.log('\nAvailable test categories:');
    console.log('1. Functional Testing (Playwright)');
    console.log('2. Performance Testing (Lighthouse)');
    console.log('3. UI/UX Testing (BackstopJS)');
    console.log('4. Cross-Browser Testing (Playwright multi-browser)');
    console.log('5. API Testing (Newman)');
    console.log('\nTo run all tests, use: node comprehensive-tests/run-all-tests.js');
    
  } catch (error) {
    console.error('Error setting up test environment:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupEnvironment().catch(error => {
  console.error('Failed to set up test environment:', error);
  process.exit(1);
});