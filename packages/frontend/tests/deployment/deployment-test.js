// deployment-test.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create test reports directory
const reportsDir = path.join(__dirname, '..', '..', 'test-reports', 'deployment');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

async function runDeploymentTests() {
  console.log('Starting Deployment Testing with Docker Compose...');
  
  try {
    const dockerComposeFile = path.join(__dirname, 'docker-compose.test.yml');
    console.log(`Using Docker Compose file: ${dockerComposeFile}`);
    
    // Check if Docker is installed
    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf-8' });
      console.log(`Docker version: ${dockerVersion.trim()}`);
      
      const dockerComposeVersion = execSync('docker compose version', { encoding: 'utf-8' });
      console.log(`Docker Compose version: ${dockerComposeVersion.trim()}`);
    } catch (error) {
      console.error('❌ Docker or Docker Compose is not installed or not in PATH.');
      throw new Error('Docker prerequisites not met');
    }
    
    // Start containers
    console.log('🚀 Starting Docker containers...');
    execSync(`docker compose -f ${dockerComposeFile} up --build -d`, { stdio: 'inherit' });
    
    // Run tests
    console.log('🔍 Running deployment tests...');
    try {
      const testOutput = execSync(
        `docker compose -f ${dockerComposeFile} run test-runner`,
        { encoding: 'utf-8' }
      );
      
      console.log('Test output:', testOutput);
      
      // Parse test results
      let testResults;
      try {
        const jsonStartIndex = testOutput.indexOf('{');
        const jsonEndIndex = testOutput.lastIndexOf('}') + 1;
        if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
          const jsonStr = testOutput.substring(jsonStartIndex, jsonEndIndex);
          testResults = JSON.parse(jsonStr);
        } else {
          throw new Error('No valid JSON found in test output');
        }
      } catch (jsonError) {
        console.warn('Could not parse test results as JSON, using raw output');
        testResults = {
          status: testOutput.includes('Health check passed!') ? 'success' : 'failure',
          message: testOutput,
          timestamp: new Date().toISOString()
        };
      }
      
      // Save test results
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const resultsFilePath = path.join(reportsDir, `deployment-test-results-${timestamp}.json`);
      fs.writeFileSync(resultsFilePath, JSON.stringify(testResults, null, 2));
      console.log(`📄 Test results saved to: ${resultsFilePath}`);
      
      if (testResults.status === 'success') {
        console.log('✅ Deployment tests passed successfully!');
      } else {
        console.error('❌ Deployment tests failed!');
        process.exit(1);
      }
    } catch (testError) {
      console.error('❌ Error running deployment tests:', testError.message);
      process.exit(1);
    } finally {
      // Clean up
      console.log('🧹 Cleaning up Docker containers...');
      execSync(`docker compose -f ${dockerComposeFile} down -v`, { stdio: 'inherit' });
    }
    
  } catch (error) {
    console.error('❌ Error in deployment testing:', error.message);
    process.exit(1);
  }
}

// Run tests
runDeploymentTests().catch(error => {
  console.error('Failed to run deployment tests:', error);
  process.exit(1);
});