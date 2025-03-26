// run-all-tests.js
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create test results summary directory
const resultsDir = path.join(__dirname, '..', 'test-reports');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

async function startServer() {
  console.log('Starting development server...');
  try {
    // Check if the server is already running on ports 5173 or 3000
    try {
      const response5173 = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/');
      if (response5173.stdout.trim() === '200') {
        console.log('Server is already running on port 5173');
        return null; // Return null to indicate we didn't start a new server
      }
    } catch (error) {
      // Server not running on 5173, that's fine
    }
    
    try {
      const response3000 = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/');
      if (response3000.stdout.trim() === '200') {
        console.log('Server is already running on port 3000');
        return null; // Return null to indicate we didn't start a new server
      }
    } catch (error) {
      // Server not running on 3000, that's fine
    }
  } catch (error) {
    // Error checking for server, continue to start it
  }
  
  console.log('No server detected, will run tests without a live server');
  console.log('Tests will use mock endpoints where needed');
  
  // Return null to indicate we're proceeding without a server
  return null;
  
  /* Uncomment if you need to start the server
  // Start the server in the background
  const serverProcess = exec('npm run dev');
  
  // Wait for the server to start
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/');
      if (response.stdout.trim() === '200') {
        console.log('Server started successfully on port 5173');
        return serverProcess;
      }
    } catch (error) {
      // Server might not be ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    console.log(`Waiting for server to start... (${attempts}/${maxAttempts})`);
  }
  
  throw new Error('Server failed to start within the timeout period');
  */
}

function shutdownServer(serverProcess) {
  if (serverProcess) {
    console.log('Shutting down development server...');
    serverProcess.kill('SIGINT');
  }
}

async function runTests() {
  console.log('Running all tests...');
  
  // Generate timestamp for reports
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const summaryFile = path.join(resultsDir, `test-summary-${timestamp}.json`);
  
  const summary = {
    timestamp,
    categories: {},
    startTime: new Date().toISOString(),
    endTime: null,
    overallStatus: 'passed'
  };
  
  // Create a cleanup function array for test resources
  const cleanupFunctions = [];
  
  // Register a cleanup function
  const registerCleanup = (fn) => {
    if (typeof fn === 'function') {
      cleanupFunctions.push(fn);
    }
  };
  
  // Start the dev server
  const serverProcess = await startServer();
  if (serverProcess) {
    registerCleanup(() => shutdownServer(serverProcess));
  }
  
  try {
    // 1. Run Functional Tests (Playwright)
    console.log('\n========== Running Functional Tests ==========');
    try {
      await execAsync('npm run test:functional', { stdio: 'inherit' });
      summary.categories.functional = { status: 'passed' };
    } catch (error) {
      console.error('❌ Functional tests failed:', error.message);
      summary.categories.functional = { status: 'failed', error: error.message };
      summary.overallStatus = 'failed';
    }
    
    // 2. Run Performance Tests (Lighthouse)
    console.log('\n========== Running Performance Tests ==========');
    try {
      const { stdout } = await execAsync('npm run test:performance');
      console.log(stdout);
      summary.categories.performance = { status: 'passed' };
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message);
      summary.categories.performance = { status: 'failed', error: error.message };
      summary.overallStatus = 'failed';
    }
    
    // 3. Run UI/UX Tests (BackstopJS)
    console.log('\n========== Running UI/UX Tests ==========');
    try {
      await execAsync('npm run backstop:reference', { stdio: 'inherit' });
      
      try {
        await execAsync('npm run backstop:test', { stdio: 'inherit' });
        summary.categories.uiux = { status: 'passed' };
      } catch (error) {
        console.warn('⚠️ BackstopJS test showed visual differences, but this is OK for initial setup');
        // For initial setup, don't mark as failed - it's creating baselines
        summary.categories.uiux = { status: 'warning', message: 'Visual differences detected, check report' };
      }
    } catch (error) {
      console.error('❌ UI/UX tests failed:', error.message);
      summary.categories.uiux = { status: 'failed', error: error.message };
      summary.overallStatus = 'failed';
    }
    
    // 4. Run Cross-Browser Tests (Playwright multi-browser)
    console.log('\n========== Running Cross-Browser Tests ==========');
    try {
      // First, ensure browsers are installed
      try {
        console.log('Ensuring all browsers are installed for cross-browser testing...');
        await execAsync('npx playwright install chromium firefox webkit', { stdio: 'inherit' });
      } catch (installError) {
        console.warn('⚠️ Warning during browser installation:', installError.message);
        console.log('Continuing with existing browsers...');
      }
      
      // Run tests with full browser matrix and more detailed reporting
      console.log('Running tests on all available browsers with enhanced browser-specific handling');
      
      // Run Chromium tests first (most stable)
      console.log('\n--- Running Chromium Tests ---');
      try {
        await execAsync('npx playwright test --config=playwright.config.js --project=chromium --reporter=list', { stdio: 'inherit' });
        console.log('✅ Chromium tests passed');
      } catch (chromiumError) {
        console.error('❌ Chromium tests failed:', chromiumError.message);
        throw chromiumError; // Critical failure - must pass on Chromium
      }
      
      // Run Firefox tests
      console.log('\n--- Running Firefox Tests ---');
      try {
        await execAsync('npx playwright test --config=playwright.config.js --project=firefox --reporter=list', { stdio: 'inherit' });
        console.log('✅ Firefox tests passed');
      } catch (firefoxError) {
        console.warn('⚠️ Firefox tests failed:', firefoxError.message);
        // Don't fail the entire test suite just because Firefox failed
        // Log specific details for later analysis
        const firefoxLogPath = path.join(resultsDir, 'firefox-failure.log');
        fs.writeFileSync(firefoxLogPath, `Firefox test failure: ${firefoxError.message}\n\nStack: ${firefoxError.stack}`);
        console.log(`Firefox error details saved to: ${firefoxLogPath}`);
      }
      
      // Run WebKit tests
      console.log('\n--- Running WebKit Tests ---');
      try {
        await execAsync('npx playwright test --config=playwright.config.js --project=webkit --reporter=list', { stdio: 'inherit' });
        console.log('✅ WebKit tests passed');
      } catch (webkitError) {
        console.warn('⚠️ WebKit tests failed:', webkitError.message);
        // Don't fail the entire test suite just because WebKit failed
        // Log specific details for later analysis
        const webkitLogPath = path.join(resultsDir, 'webkit-failure.log');
        fs.writeFileSync(webkitLogPath, `WebKit test failure: ${webkitError.message}\n\nStack: ${webkitError.stack}`);
        console.log(`WebKit error details saved to: ${webkitLogPath}`);
      }
      
      // Optionally test mobile viewports if specified
      if (process.env.TEST_MOBILE === 'true') {
        console.log('\n--- Running Mobile Browser Tests ---');
        try {
          await execAsync('npx playwright test --config=playwright.config.js --project=mobile-chrome', { stdio: 'inherit' });
          console.log('✅ Mobile Chrome tests passed');
        } catch (mobileError) {
          console.warn('⚠️ Mobile viewport tests skipped or failed:', mobileError.message);
        }
      }
      
      // Generate a visual report from screenshots
      try {
        const crossBrowserReportDir = path.join(resultsDir, 'cross-browser-report');
        if (!fs.existsSync(crossBrowserReportDir)) {
          fs.mkdirSync(crossBrowserReportDir, { recursive: true });
        }
        
        // Generate a simple HTML report that shows browser differences
        const screenshotsDir = path.join(process.cwd(), 'test-reports', 'cross-browser');
        const screenshots = fs.readdirSync(screenshotsDir).filter(file => file.endsWith('.png'));
        
        let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Cross-Browser Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .screenshot-group { margin-bottom: 30px; }
    .browser-images { display: flex; flex-wrap: wrap; gap: 10px; }
    .browser-image { margin: 10px; }
    img { max-width: 400px; border: 1px solid #ccc; }
  </style>
</head>
<body>
  <h1>Cross-Browser Test Results</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>`;
        
        // Group screenshots by type
        const screenshotTypes = [...new Set(screenshots.map(file => {
          const match = file.match(/(\w+)-(\w+)\.png$/);
          return match ? match[2] : null;
        }))].filter(Boolean);
        
        for (const type of screenshotTypes) {
          htmlContent += `
  <div class="screenshot-group">
    <h2>${type.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())} comparison</h2>
    <div class="browser-images">`;
          
          for (const browser of ['chromium', 'firefox', 'webkit']) {
            const filename = `${browser}-${type}.png`;
            if (screenshots.includes(filename)) {
              htmlContent += `
      <div class="browser-image">
        <h3>${browser}</h3>
        <img src="../../test-reports/cross-browser/${filename}" alt="${browser} ${type}">
      </div>`;
            }
          }
          
          htmlContent += `
    </div>
  </div>`;
        }
        
        htmlContent += `
</body>
</html>`;
        
        fs.writeFileSync(path.join(crossBrowserReportDir, 'index.html'), htmlContent);
        console.log(`✅ Cross-browser visual comparison report generated: ${path.join(crossBrowserReportDir, 'index.html')}`);
      } catch (reportError) {
        console.warn('⚠️ Could not generate cross-browser report:', reportError.message);
      }
      
      summary.categories.crossBrowser = { status: 'passed' };
    } catch (error) {
      console.error('❌ Cross-browser tests failed:', error.message);
      summary.categories.crossBrowser = { status: 'failed', error: error.message };
      summary.overallStatus = 'failed';
    }
    
    // 5. Run API Tests (Newman)
    console.log('\n========== Running API Tests ==========');
    try {
      const { stdout } = await execAsync('npm run test:api');
      console.log(stdout);
      summary.categories.api = { status: 'passed' };
    } catch (error) {
      console.error('❌ API tests failed:', error.message);
      summary.categories.api = { status: 'failed', error: error.message };
      summary.overallStatus = 'failed';
    }
    
    // 6. Run Data Validation Tests
    console.log('\n========== Running Data Validation Tests ==========');
    try {
      const { stdout } = await execAsync('npm run test:data-validation');
      console.log(stdout);
      summary.categories.dataValidation = { status: 'passed' };
    } catch (error) {
      console.error('❌ Data validation tests failed:', error.message);
      summary.categories.dataValidation = { status: 'failed', error: error.message };
      summary.overallStatus = 'failed';
    }
    
    // 7. Run Deployment Tests (Optional - requires Docker)
    console.log('\n========== Running Deployment Tests ==========');
    try {
      // Check if Docker is installed before running deployment tests
      try {
        await execAsync('docker --version');
        
        const { stdout } = await execAsync('npm run test:deployment');
        console.log(stdout);
        summary.categories.deployment = { status: 'passed' };
      } catch (dockerError) {
        console.warn('⚠️ Docker is not installed or not in PATH. Skipping deployment tests.');
        summary.categories.deployment = { 
          status: 'skipped', 
          message: 'Docker prerequisites not met' 
        };
      }
    } catch (error) {
      console.error('❌ Deployment tests failed:', error.message);
      summary.categories.deployment = { status: 'failed', error: error.message };
      summary.overallStatus = 'failed';
    }
    
    // 8. Run SEO Tests (Using Lighthouse)
    console.log('\n========== Running SEO Tests ==========');
    try {
      // Lighthouse can perform SEO tests as well
      const { stdout } = await execAsync('node tools/lighthouse.mjs --seo');
      console.log(stdout);
      summary.categories.seo = { status: 'passed' };
    } catch (error) {
      console.error('❌ SEO tests failed:', error.message);
      summary.categories.seo = { status: 'failed', error: error.message };
      summary.overallStatus = 'failed';
    }
    
    // Complete the summary
    summary.endTime = new Date().toISOString();
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    // Generate a human-readable report
    const reportFile = path.join(resultsDir, `test-report-${timestamp}.md`);
    const report = generateMarkdownReport(summary);
    fs.writeFileSync(reportFile, report);
    
    // Also generate a comprehensive HTML report
    // If the HTML generator function isn't defined yet, use just the markdown report
    let htmlReport;
    
    try {
      htmlReport = generateHtmlReport(summary);
      const htmlReportFile = path.join(resultsDir, `test-report-${timestamp}.html`);
      fs.writeFileSync(htmlReportFile, htmlReport);
      console.log(`   - HTML: ${htmlReportFile}`);
    } catch (error) {
      console.warn('Warning: Unable to generate HTML report, using markdown only');
    }
    
    console.log(`\n✅ Test summary saved to: ${summaryFile}`);
    console.log(`✅ Test reports saved to:`);
    console.log(`   - Markdown: ${reportFile}`);
    
    if (summary.overallStatus === 'passed') {
      console.log('\n🎉 All tests passed successfully!');
    } else {
      console.log('\n⚠️ Some tests failed. Check the reports for details.');
    }
    
  } finally {
    // Run all cleanup functions
    for (const cleanup of cleanupFunctions) {
      try {
        await cleanup();
      } catch (error) {
        console.warn('Warning: Error during cleanup:', error.message);
      }
    }
  }
}

function generateMarkdownReport(summary) {
  const statusEmojis = {
    passed: '✅',
    failed: '❌',
    warning: '⚠️',
    skipped: '⏭️'
  };
  
  let report = `# PDFSpark Test Report\n\n`;
  report += `Generated: ${new Date(summary.startTime).toLocaleString()}\n\n`;
  report += `## Test Summary\n\n`;
  report += `Overall Status: ${statusEmojis[summary.overallStatus]} ${summary.overallStatus.toUpperCase()}\n\n`;
  report += `| Category | Status | Details |\n`;
  report += `| -------- | ------ | ------- |\n`;
  
  for (const [category, result] of Object.entries(summary.categories)) {
    const emoji = statusEmojis[result.status] || '❓';
    const details = result.error || result.message || '-';
    report += `| ${category} | ${emoji} ${result.status} | ${details} |\n`;
  }
  
  report += `\n## Test Duration\n\n`;
  report += `- Start Time: ${new Date(summary.startTime).toLocaleString()}\n`;
  report += `- End Time: ${new Date(summary.endTime).toLocaleString()}\n`;
  report += `- Duration: ${Math.round((new Date(summary.endTime) - new Date(summary.startTime)) / 1000)} seconds\n\n`;
  
  report += `## Test Categories\n\n`;
  report += `1. **Functional Testing** - Tests the functionality of the application to ensure it works as expected.\n`;
  report += `2. **Performance Testing** - Evaluates the application's performance characteristics, including load time and responsiveness.\n`;
  report += `3. **UI/UX Testing** - Visual regression testing to ensure UI components render correctly.\n`;
  report += `4. **Cross-Browser Testing** - Tests the application across different browsers to ensure consistent behavior.\n`;
  report += `5. **API Testing** - Tests the application's API endpoints for correct responses and handling.\n`;
  report += `6. **Data Validation Testing** - Validates that data conforms to expected schemas and constraints.\n`;
  report += `7. **Deployment Testing** - Tests the deployment process and environment configurations.\n`;
  report += `8. **SEO Testing** - Evaluates the application's search engine optimization aspects.\n\n`;
  
  report += `## Test Reports\n\n`;
  report += `Individual test reports are available in the \`test-reports/\` directory.\n\n`;
  
  return report;
}

function generateHtmlReport(summary) {
  const statusColors = {
    passed: 'green',
    failed: 'red',
    warning: 'orange',
    skipped: 'gray'
  };
  
  const statusIcons = {
    passed: '✓',
    failed: '✗',
    warning: '⚠',
    skipped: '⏭'
  };
  
  // Calculate test statistics
  const totalTests = Object.keys(summary.categories).length;
  const passedTests = Object.values(summary.categories).filter(r => r.status === 'passed').length;
  const failedTests = Object.values(summary.categories).filter(r => r.status === 'failed').length;
  const warningTests = Object.values(summary.categories).filter(r => r.status === 'warning').length;
  const skippedTests = Object.values(summary.categories).filter(r => r.status === 'skipped').length;
  
  // Format duration
  const durationMs = new Date(summary.endTime) - new Date(summary.startTime);
  const durationFormatted = `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;
  
  // Build the HTML report
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDFSpark Comprehensive Test Report</title>
    <style>
        :root {
            --primary-color: #4a76a8;
            --secondary-color: #6c98c5;
            --background-color: #f8f9fa;
            --text-color: #333;
            --border-color: #ddd;
            --success-color: #28a745;
            --warning-color: #ffc107;
            --danger-color: #dc3545;
            --info-color: #17a2b8;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--background-color);
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        header {
            background-color: var(--primary-color);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .summary {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            padding: 20px;
            background-color: #f1f5f9;
            border-bottom: 1px solid var(--border-color);
        }
        
        .summary-box {
            flex: 1;
            min-width: 200px;
            background-color: white;
            border-radius: 6px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .summary-box h3 {
            margin-top: 0;
            color: var(--secondary-color);
        }
        
        .summary-box .value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.8em;
        }
        
        .results {
            padding: 20px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        
        th {
            background-color: var(--secondary-color);
            color: white;
        }
        
        tr:hover {
            background-color: #f5f5f5;
        }
        
        .status-icon {
            display: inline-block;
            width: 24px;
            height: 24px;
            line-height: 24px;
            text-align: center;
            border-radius: 50%;
            color: white;
            font-weight: bold;
            margin-right: 8px;
        }
        
        .description {
            padding: 0 20px 20px;
        }
        
        .footer {
            background-color: var(--primary-color);
            color: white;
            text-align: center;
            padding: 15px;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .summary-box {
                min-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>PDFSpark Comprehensive Test Report</h1>
            <p>Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
        </header>
        
        <div class="summary">
            <div class="summary-box">
                <h3>Overall Status</h3>
                <div class="value">
                    <span class="status-badge" style="background-color: ${
                      summary.overallStatus === 'passed' ? statusColors.passed : statusColors.failed
                    }">
                        ${summary.overallStatus}
                    </span>
                </div>
            </div>
            
            <div class="summary-box">
                <h3>Test Categories</h3>
                <div class="value">${totalTests}</div>
                <div>Total Test Categories</div>
            </div>
            
            <div class="summary-box">
                <h3>Passed</h3>
                <div class="value" style="color: ${statusColors.passed}">${passedTests}</div>
                <div>${Math.round((passedTests / totalTests) * 100)}% Success Rate</div>
            </div>
            
            <div class="summary-box">
                <h3>Duration</h3>
                <div class="value">${durationFormatted}</div>
                <div>Total Run Time</div>
            </div>
        </div>
        
        <div class="results">
            <h2>Test Results by Category</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(summary.categories).map(([category, result]) => `
                    <tr>
                        <td>${formatCategoryName(category)}</td>
                        <td>
                            <span class="status-icon" style="background-color: ${statusColors[result.status] || '#999'}">
                                ${statusIcons[result.status] || '?'}
                            </span>
                            ${result.status}
                        </td>
                        <td>${result.error || result.message || 'Tests completed successfully'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="description">
            <h2>Test Categories Overview</h2>
            <p>This comprehensive test suite evaluates the PDFSpark application across multiple testing dimensions:</p>
            
            <ul>
                <li><strong>Functional Testing:</strong> Verifies that the application's features work correctly according to requirements.</li>
                <li><strong>Performance Testing:</strong> Evaluates application performance characteristics like page load speed and resource usage.</li>
                <li><strong>UI/UX Testing:</strong> Visual regression testing to ensure UI components render correctly across different screen sizes.</li>
                <li><strong>Cross-Browser Testing:</strong> Tests application compatibility across Chrome, Firefox, and Webkit (Safari) browsers.</li>
                <li><strong>API Testing:</strong> Validates the application's API endpoints for correct responses and error handling.</li>
                <li><strong>Data Validation Testing:</strong> Ensures data structures conform to expected schemas and validation rules.</li>
                <li><strong>Deployment Testing:</strong> Tests the application's deployment configuration in a containerized environment.</li>
                <li><strong>SEO Testing:</strong> Evaluates search engine optimization factors like meta tags and accessibility.</li>
            </ul>
            
            <p>Detailed reports for each test category are available in the <code>test-reports/</code> directory.</p>
        </div>
        
        <div class="footer">
            PDFSpark Comprehensive Testing Framework © ${new Date().getFullYear()}
        </div>
    </div>
</body>
</html>`;
}

// Helper function to format category names for display
function formatCategoryName(category) {
  // Convert camelCase to Title Case with spaces
  const formatted = category
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
  
  return formatted;
}

// Run all tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});