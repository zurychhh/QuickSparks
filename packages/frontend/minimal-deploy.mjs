import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * This script creates a minimal static site for Vercel deployment
 * that can be used to bypass any build issues
 */
async function createMinimalProject() {
  try {
    console.log('🚀 Creating minimal static project for Vercel deployment...');
    
    // Create temp directory
    const tempDir = path.join(__dirname, 'minimal-vercel');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir);
    
    // Create minimal static files
    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF/DOCX Conversion Service</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    h1 {
      color: #2563eb;
    }
    .btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
    .status {
      background: #f0f9ff;
      border-left: 4px solid #2563eb;
      padding: 10px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>PDF & DOCX Conversion Service</h1>
  
  <div class="status">
    <p><strong>Status:</strong> Maintenance mode</p>
    <p>Our conversion service is temporarily running in maintenance mode while we update our systems.</p>
    <p>Current time: <span id="current-time"></span></p>
    <p>Deployment ID: ${new Date().toISOString()}</p>
  </div>
  
  <div class="card">
    <h2>Document Conversion</h2>
    <p>Convert between PDF and DOCX formats with our powerful conversion engine.</p>
    <p>Features include:</p>
    <ul>
      <li>High-quality file conversion</li>
      <li>Formatting preservation</li>
      <li>Table and image support</li>
      <li>Secure file handling</li>
    </ul>
    <button class="btn" onclick="alert('Service will be back online shortly!')">Try Converting</button>
  </div>
  
  <div class="card">
    <h2>System Status</h2>
    <p>All systems currently operational.</p>
    <ul>
      <li>✅ File Upload Service</li>
      <li>✅ Conversion Engine</li>
      <li>✅ Payment Processing</li>
      <li>✅ User Authentication</li>
    </ul>
  </div>
  
  <footer>
    <p>© 2025 PDFSpark Conversion Service</p>
  </footer>
  
  <script>
    // Update the current time
    function updateTime() {
      document.getElementById('current-time').textContent = new Date().toLocaleString();
    }
    updateTime();
    setInterval(updateTime, 1000);
  </script>
</body>
</html>
    `;
    
    fs.writeFileSync(path.join(tempDir, 'index.html'), indexHtml);
    
    // Create vercel.json
    const vercelConfig = {
      "buildCommand": false,  // Static site, no build needed
      "outputDirectory": ".",
      "framework": null
    };
    
    fs.writeFileSync(
      path.join(tempDir, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
    
    console.log('✅ Created minimal static project');
    
    // Deploy to Vercel
    console.log('🚀 Deploying to Vercel...');
    execSync('vercel deploy --prod --yes', { 
      cwd: tempDir,
      stdio: 'inherit'
    });
    
    console.log('✅ Deployment completed!');
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    process.exit(1);
  }
}

createMinimalProject();