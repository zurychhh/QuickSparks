import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * This script forces a Vercel deployment by creating a small change
 * that will trigger a rebuild. It updates the deploy-status.json file
 * with a new timestamp.
 */
async function forceDeployment() {
  try {
    console.log('🚀 Forcing Vercel deployment...');
    
    // Update deploy-status.json with current timestamp
    const deployStatusPath = path.join(__dirname, 'public', 'deploy-status.json');
    let deployStatus = {};
    
    if (fs.existsSync(deployStatusPath)) {
      deployStatus = JSON.parse(fs.readFileSync(deployStatusPath, 'utf8'));
    }
    
    // Get current Git commit hash
    const { stdout: gitCommit } = await execAsync('git rev-parse --short HEAD');
    
    deployStatus.lastDeployment = {
      timestamp: new Date().toISOString(),
      version: '1.0.1',
      gitCommit: gitCommit.trim(),
      status: 'pending',
      environment: 'production'
    };
    
    deployStatus.monitoring = {
      enabled: true,
      lastChecked: new Date().toISOString(),
      forcedDeployment: true
    };
    
    // Write updated file
    fs.writeFileSync(deployStatusPath, JSON.stringify(deployStatus, null, 2));
    console.log('✅ Updated deploy-status.json');
    
    // Commit and push changes
    await execAsync('git add ' + deployStatusPath);
    
    try {
      await execAsync('git commit -m "Force Vercel deployment with updated status" --no-verify');
    } catch (error) {
      console.log('No changes to commit or commit failed. Continuing anyway...');
    }
    
    // Push to trigger deployment
    await execAsync('git push origin main');
    console.log('✅ Changes pushed to GitHub. Vercel deployment should start shortly.');
    
    console.log('🔍 Deployment status will be available at: /deploy-status.json');
    
  } catch (error) {
    console.error('❌ Error forcing deployment:', error);
    process.exit(1);
  }
}

forceDeployment();