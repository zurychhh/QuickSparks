// ui-ux-test.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create test reports directory
const reportsDir = path.join(__dirname, '..', 'test-reports', 'ui-ux');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

async function runUIUXTests() {
  console.log('Starting UI/UX Testing with BackstopJS...');
  
  try {
    // Check if server is running
    try {
      const statusCode = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/').toString().trim();
      if (statusCode !== '200') {
        throw new Error(`Server returned status code: ${statusCode}`);
      }
    } catch (error) {
      console.error('❌ Development server is not running. Start it with "npm run dev" first.');
      console.error(error.message);
      process.exit(1);
    }
    
    console.log('🔍 Creating reference images...');
    execSync('npx backstop reference', { stdio: 'inherit' });
    
    console.log('🔍 Running visual regression tests...');
    execSync('npx backstop test', { stdio: 'inherit' });
    
    // Copy the BackstopJS report to our reports directory
    const date = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportSource = path.join(__dirname, '..', 'backstop_data', 'html_report');
    const reportDestination = path.join(reportsDir, `report-${date}`);
    
    // Copy the report
    if (fs.existsSync(reportSource)) {
      fs.mkdirSync(reportDestination, { recursive: true });
      
      // Copy all files from the source to destination
      const files = fs.readdirSync(reportSource);
      for (const file of files) {
        const sourceFile = path.join(reportSource, file);
        const destFile = path.join(reportDestination, file);
        
        if (fs.statSync(sourceFile).isFile()) {
          fs.copyFileSync(sourceFile, destFile);
        }
      }
      
      console.log(`✅ BackstopJS report copied to: ${reportDestination}`);
    }
    
    console.log('✅ UI/UX tests completed');
    
  } catch (error) {
    console.error('❌ Error running UI/UX tests:', error.message);
    process.exit(1);
  }
}

// Run tests
runUIUXTests().catch(error => {
  console.error('Failed to run UI/UX tests:', error);
  process.exit(1);
});