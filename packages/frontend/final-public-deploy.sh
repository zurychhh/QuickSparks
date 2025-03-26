#!/bin/bash

# This script deploys a simplified version of the PDFSpark application for testing purposes

# Build a simple public HTML file for verification
echo "📝 Creating simple test deployment..."
rm -rf test-deploy
mkdir -p test-deploy

# Create a simple HTML file
cat > test-deploy/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDFSpark Test Deployment</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2563eb;
    }
    .success {
      color: #10b981;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>PDFSpark Test Deployment</h1>
    <p>This is a test deployment to verify that Vercel deployments are working correctly.</p>
    <p class="success">✅ If you can see this page, the deployment is working!</p>
    <p>Features implemented:</p>
    <ul>
      <li>PDF to DOCX conversion</li>
      <li>DOCX to PDF conversion</li>
      <li>Selenium end-to-end testing</li>
      <li>Real backend integration (no mock mode)</li>
    </ul>
    <p>Generated: $(date)</p>
  </div>
</body>
</html>
EOF

# Create a simple JS file to test
cat > test-deploy/app.js << EOF
console.log('JavaScript is loading correctly!');
document.addEventListener('DOMContentLoaded', () => {
  const message = document.createElement('p');
  message.textContent = 'JavaScript executed successfully!';
  message.style.color = 'green';
  document.querySelector('.container').appendChild(message);
});
EOF

# Create a simple CSS file to test
cat > test-deploy/style.css << EOF
.container {
  border-top: 4px solid #2563eb;
}
.success {
  background-color: #ecfdf5;
  padding: 10px;
  border-radius: 4px;
}
EOF

# Update the HTML to include the JS and CSS
sed -i '' 's/<\/head>/<link rel="stylesheet" href="style.css">\n  <script src="app.js"><\/script>\n<\/head>/' test-deploy/index.html

# Create vercel.json
cat > test-deploy/vercel.json << EOF
{
  "version": 2,
  "public": true
}
EOF

# Deploy to Vercel
echo "🚀 Deploying test page to Vercel..."
cd test-deploy
vercel deploy --prod --yes

echo "✅ Test deployment completed!"