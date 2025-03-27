#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔍 PDFSpark Domain Configuration Checker');
console.log('=======================================');

async function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const { stdout, stderr } = await execAsync(cmd);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return { stdout, stderr };
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    return { stdout: '', stderr: error.message };
  }
}

async function checkDomainSetup() {
  try {
    console.log('\n📋 Step 1: Checking Vercel projects and domains...');
    
    // List all Vercel projects
    const { stdout: projectsOutput } = await run('vercel list');
    
    // Extract deployment URLs
    const deploymentUrls = projectsOutput.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/g) || [];
    
    console.log(`\n📊 Found ${deploymentUrls.length} Vercel deployments.`);
    
    // Check for domain info in each project
    let foundQuicksparks = false;
    for (const url of deploymentUrls.slice(0, 5)) { // Check only first 5 to avoid rate limiting
      const projectName = url.match(/https:\/\/([a-zA-Z0-9-]+)\.vercel\.app/)[1];
      console.log(`\n🔍 Checking project: ${projectName}`);
      
      const { stdout: projectInfo } = await run(`vercel inspect ${projectName}`);
      
      if (projectInfo.includes('quicksparks.dev') || projectInfo.includes('www.quicksparks.dev')) {
        foundQuicksparks = true;
        console.log(`\n🎯 Found quicksparks.dev domain on project: ${projectName}`);
        console.log(`\nThis project is likely the one hosting the main domain.`);
      }
    }
    
    if (!foundQuicksparks) {
      console.log(`\n⚠️ Could not find quicksparks.dev domain in any of the checked projects.`);
    }
    
    console.log('\n📋 Step 2: Checking our latest deployment...');
    
    // Get info about the most recent deployment
    const deploymentsDir = path.join(process.cwd(), 'deployment-logs');
    const files = fs.readdirSync(deploymentsDir);
    const deployLogs = files.filter(file => file.startsWith('deploy-'));
    
    if (deployLogs.length > 0) {
      // Sort by date (newest first)
      deployLogs.sort().reverse();
      const latestLog = path.join(deploymentsDir, deployLogs[0]);
      const logContent = fs.readFileSync(latestLog, 'utf8');
      
      console.log(`\nLatest deployment log: ${deployLogs[0]}`);
      
      const deploymentUrl = logContent.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/)?.[0];
      if (deploymentUrl) {
        console.log(`\nDeployment URL: ${deploymentUrl}`);
        
        // Check the specific deployment
        console.log(`\n🔍 Checking deployment information...`);
        const { stdout: deployInfo } = await run(`vercel inspect ${deploymentUrl}`);
        
        if (deployInfo.includes('Error')) {
          console.log(`\n⚠️ Cannot access deployment info. You might need to link the project first.`);
        }
      }
    }
    
    console.log('\n📋 Step 3: Recommended actions for fixing the 404 error...');
    
    console.log(`
Based on the information gathered, here are the recommended steps to fix the 404 error:

1. Identify the project that's currently hosting www.quicksparks.dev
   - This is the project where we need to configure the /pdfspark path

2. Configure path rewrites in that project:
   - Source: /pdfspark
   - Destination: <your-pdfspark-deployment-url>
   - Source: /pdfspark/*
   - Destination: <your-pdfspark-deployment-url>/*

3. Alternative option: Integrate into the main project
   - If quicksparks.dev is a monorepo, add your PDFSpark code there
   - Set the output directory to a subdirectory named "pdfspark"

4. Verify the Vercel configuration:
   - Check that vercel.json has the proper rewrites for the /pdfspark path
   - Ensure the build settings preserve the subdirectory structure

Please reference the DOMAIN_SETUP.md file for detailed instructions.
`);
    
  } catch (error) {
    console.error('❌ Error checking domain setup:', error.message);
  }
}

checkDomainSetup();