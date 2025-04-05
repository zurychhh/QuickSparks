// api-test.js
import newman from 'newman';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// NO MOCKS - We'll use the real backend API only

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create reports directory
const reportsDir = path.join(__dirname, '..', 'test-reports', 'api');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Define potential backend API URLs to try
const backendUrls = [
  // From frontend .env
  process.env.VITE_API_URL || 'http://localhost:5000/api',
  
  // Gateway service from docker-compose
  'http://localhost:3000/pdfspark/api',
  
  // Conversion service from .env
  'http://localhost:5001',
  
  // PDF service from docker-compose
  'http://localhost:3001',
  
  // Production endpoint (if deployed)
  'https://api.pdfspark.com/api',
  
  // Other common development ports
  'http://localhost:4000',
  'http://localhost:8000/api',
  'http://localhost:8080/api',
];

// Check if the backend server is running
async function verifyBackendConnection(url) {
  console.log(`Verifying backend connection to ${url}/health...`);
  
  try {
    const response = await fetch(`${url}/health`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });
    
    console.log(`Backend responded with status: ${response.status}`);
    
    // Get response as text first
    const text = await response.text();
    
    // Try to parse as JSON if possible
    let isJson = false;
    let jsonData = null;
    
    try {
      jsonData = JSON.parse(text);
      isJson = true;
      console.log('Received valid JSON response from backend:', jsonData);
    } catch (parseError) {
      // Not JSON, check if it's HTML
      if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
        console.log('Backend endpoint returned HTML, not a valid API endpoint');
      }
    }
    
    return { 
      available: true, 
      status: response.status,
      isJson,
      isHtml: text.includes('<html>'),
      data: jsonData,
      responseText: text.substring(0, 200), // First 200 chars for logging
      url
    };
  } catch (error) {
    console.error(`⚠️ Error connecting to backend (${url}/health):`, error.message);
    return { available: false, error: error.message, url };
  }
}

// Check if a URL has a valid API endpoint structure
async function checkValidApiEndpoint(url) {
  try {
    // Try a basic health check first
    const healthCheck = await verifyBackendConnection(url);
    if (healthCheck.available && healthCheck.isJson) {
      return { valid: true, ...healthCheck };
    }
    
    // If health check failed, try the root endpoint
    console.log(`Health check failed for ${url}, trying root endpoint...`);
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });
    
    // Check if it responds with a status code in the expected range
    if (response.status >= 200 && response.status < 500) {
      return { 
        valid: true, 
        available: true,
        status: response.status,
        url 
      };
    }
    
    return { valid: false, url };
  } catch (error) {
    console.error(`❌ Error checking API endpoint at ${url}:`, error.message);
    return { valid: false, url, error: error.message };
  }
}

async function findActiveBackend() {
  console.log('Searching for active backend API...');
  
  for (const baseUrl of backendUrls) {
    console.log(`Checking backend at: ${baseUrl}`);
    const result = await checkValidApiEndpoint(baseUrl);
    
    if (result.valid) {
      console.log(`✅ Found active backend API at: ${baseUrl}`);
      return baseUrl;
    }
  }
  
  throw new Error('No active backend API found. Please start the backend service first.');
}

async function runAPITests() {
  console.log('Starting API Testing with Newman against REAL backend...');
  
  try {
    // Find an active backend API
    const activeBackendUrl = await findActiveBackend();
    console.log(`Using real backend API at: ${activeBackendUrl}`);
    
    // Verify backend connection
    const healthCheck = await verifyBackendConnection(activeBackendUrl);
    
    if (!healthCheck.available) {
      throw new Error(`Cannot connect to backend at ${activeBackendUrl}: ${healthCheck.error}`);
    }
    
    console.log('✅ Backend connection verified. Proceeding with API tests...');
    
    // Generate a timestamp for the report filename
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportName = `api-test-report-${timestamp}`;
    
    // Save backend verification results
    const verificationReport = {
      timestamp,
      healthEndpoint: healthCheck,
      backendType: 'Real Backend API',
      backendUrl: activeBackendUrl,
      conclusion: 'Using real backend API for testing'
    };
    
    fs.writeFileSync(
      path.join(reportsDir, `backend-verification-${timestamp}.json`),
      JSON.stringify(verificationReport, null, 2)
    );
    
    // Update the collection with the correct backend URL
    let collectionJson = fs.readFileSync(path.join(__dirname, 'api-collection.json'), 'utf8');
    
    // Replace all localhost:3000 URLs with the active backend URL
    const updatedCollectionJson = collectionJson.replace(
      /http:\/\/localhost:3000\//g, 
      `${activeBackendUrl.endsWith('/') ? activeBackendUrl : activeBackendUrl + '/'}`
    );
    
    // Write the updated collection to a temporary file
    const tempCollectionPath = path.join(reportsDir, `temp-collection-${timestamp}.json`);
    fs.writeFileSync(tempCollectionPath, updatedCollectionJson);
    
    console.log(`Updated API collection with backend URL: ${activeBackendUrl}`);
    
    return new Promise((resolve, reject) => {
      newman.run({
        collection: JSON.parse(updatedCollectionJson),
        reporters: ['cli', 'html', 'json'],
        reporter: {
          html: {
            export: path.join(reportsDir, `${reportName}.html`),
          },
          json: {
            export: path.join(reportsDir, `${reportName}.json`),
          }
        },
        insecure: true, // Allow self-signed certificates
        timeout: 30000,  // 30 second timeout
        bail: false,     // Don't exit on test failures
      })
      .on('start', () => {
        console.log(`Newman test run started against REAL backend at ${activeBackendUrl}`);
      })
      .on('done', (err, summary) => {
        if (err) {
          console.error('Error running Newman tests:', err);
          return reject(err);
        }
        
        // Enhanced summary with backend verification
        const testSummary = {
          timestamp,
          backendType: 'Real Backend API',
          backendUrl: activeBackendUrl,
          totalRequests: summary.run.stats.requests.total,
          failedRequests: summary.run.stats.requests.failed,
          totalAssertions: summary.run.stats.assertions.total,
          failedAssertions: summary.run.stats.assertions.failed,
          totalTime: summary.run.timings.completed - summary.run.timings.started,
        };
        
        fs.writeFileSync(
          path.join(reportsDir, `${reportName}-summary.json`),
          JSON.stringify(testSummary, null, 2)
        );
        
        // Clean up temporary collection file
        try {
          fs.unlinkSync(tempCollectionPath);
        } catch (err) {
          console.warn('Warning: Could not delete temporary collection file:', err.message);
        }
        
        if (summary.run.failures.length === 0) {
          console.log('✅ API tests completed successfully against REAL backend');
        } else {
          console.log(`⚠️ API tests completed with ${summary.run.failures.length} failures against REAL backend`);
          summary.run.failures.forEach((failure, index) => {
            console.log(`  ${index + 1}. ${failure.error.message}`);
          });
        }
        
        console.log(`Report saved to: ${path.join(reportsDir, `${reportName}.html`)}`);
        
        resolve(summary);
      });
    });
  } catch (error) {
    console.error('Error running API tests against real backend:', error.message);
    throw error;
  }
}

// Run tests
runAPITests().catch(error => {
  console.error('Failed to run API tests:', error);
  process.exit(1);
});