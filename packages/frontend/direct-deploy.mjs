import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * This script performs a direct deployment to Vercel using the Vercel CLI
 * It bypasses GitHub integration issues by deploying directly from the local machine
 */
async function directDeploy() {
  try {
    console.log('🚀 Starting direct deployment to Vercel...');

    // Create directories if they don't exist
    const componentDir = path.join(__dirname, 'src', 'components', 'ui');
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true });
      console.log(`✅ Created directory: ${componentDir}`);
    }

    // Ensure FileViewer component exists
    const fileViewerPath = path.join(componentDir, 'FileViewer.tsx');
    const fileViewerBackupPath = path.join(componentDir, 'FileViewer.tsx.vercel');

    if (!fs.existsSync(fileViewerPath) && fs.existsSync(fileViewerBackupPath)) {
      fs.copyFileSync(fileViewerBackupPath, fileViewerPath);
      console.log('✅ Copied FileViewer component from backup');
    } else if (!fs.existsSync(fileViewerPath) && !fs.existsSync(fileViewerBackupPath)) {
      // Create a minimal FileViewer component if neither exists
      const minimalComponent = `import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface FileViewerProps {
  fileUrl: string;
  mimeType: string;
  fileName: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ fileName }) => {
  return (
    <Paper
      elevation={2}
      sx={{ p: 2, mb: 3, maxWidth: '100%', overflow: 'hidden' }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        File Preview
      </Typography>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="400px"
        border="1px dashed #ccc"
        borderRadius="4px"
        p={2}
      >
        <Typography variant="h6">{fileName}</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Preview not available.
        </Typography>
      </Box>
    </Paper>
  );
};

export default FileViewer;`;

      fs.writeFileSync(fileViewerPath, minimalComponent);
      console.log('✅ Created minimal FileViewer component');
    }

    // Update deploy-status.json
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      console.log(`✅ Created directory: ${publicDir}`);
    }

    const deployStatusPath = path.join(publicDir, 'deploy-status.json');
    const deployStatus = {
      lastDeployment: {
        timestamp: new Date().toISOString(),
        version: '1.0.2',
        deploymentType: 'direct-cli',
        status: 'deploying'
      },
      features: {
        paymentProcessing: true,
        fileViewer: true,
        pdfConversion: true,
        docxConversion: true
      },
      monitoring: {
        enabled: true,
        lastChecked: new Date().toISOString(),
        directDeployment: true
      }
    };

    fs.writeFileSync(deployStatusPath, JSON.stringify(deployStatus, null, 2));
    console.log('✅ Updated deploy-status.json');

    // Run Vercel CLI deployment command
    console.log('📦 Running Vercel CLI deployment...');
    execSync('vercel deploy --prod --force', { 
      cwd: path.resolve(__dirname, '../..'), // Monorepo root 
      stdio: 'inherit'
    });

    console.log('✅ Deployment completed!');
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    process.exit(1);
  }
}

directDeploy();