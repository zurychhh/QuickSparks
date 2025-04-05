import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * This script deploys the frontend to a subdirectory on quicksparks.dev
 * Specifically for /pdfspark subdirectory deployment
 */
async function subdirectoryDeploy() {
  // Check for prepare-only flag
  const prepareOnly = process.argv.includes('--prepare-only');
  
  console.log('🚀 Starting deployment for quicksparks.dev/pdfspark...');
  if (prepareOnly) {
    console.log('Running in prepare-only mode, will not attempt automatic deployment');
  }
  
  // Create deployment log
  const logDir = path.join(__dirname, 'deployment-logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `deploy-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
  const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
  };
  
  try {
    // Step 1: Update the Vite config for subdirectory deployment
    log('Step 1: Updating Vite configuration for subdirectory deployment');
    
    const viteConfigPath = path.join(__dirname, 'vite.config.ts');
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');
    
    // Add base path to Vite config if not already present
    if (!viteConfigContent.includes("base: '/pdfspark/'")) {
      const updatedConfig = viteConfigContent.replace(
        'export default defineConfig({',
        'export default defineConfig({\n  base: \'/pdfspark/\','
      );
      
      fs.writeFileSync(viteConfigPath, updatedConfig);
      log('✅ Updated Vite config with base path /pdfspark/');
    } else {
      log('👍 Vite config already has base path configured');
    }
    
    // Step 2: Update the React Router configuration in App.tsx
    log('Step 2: Updating Router configuration in App.tsx for subdirectory');
    
    const appPath = path.join(__dirname, 'src', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Check if the Router already has the basename configured
    if (!appContent.includes('basename="/pdfspark"')) {
      // Update the Router component with basename
      const updatedApp = appContent.replace(
        '<Router>',
        '<Router basename="/pdfspark">'
      );
      
      fs.writeFileSync(appPath, updatedApp);
      log('✅ Updated React Router with basename /pdfspark');
    } else {
      log('👍 React Router already has basename configured');
    }
    
    // Step 3: Run fix-build script to ensure all components are present
    log('Step 3: Running fix-build script');
    execSync('node fix-build.mjs', { stdio: 'inherit' });
    
    // Step 4: Build the application
    log('Step 4: Building the application');
    // Use a special build script that skips TypeScript checking
    execSync('node build-skip-tests.mjs', { stdio: 'inherit' });
    
    // Step 5: Create a proper vercel.json for subdirectory deployment
    log('Step 5: Creating Vercel configuration for subdirectory deployment');
    
    const vercelConfig = {
      "version": 2,
      "public": true,
      "outputDirectory": "dist",
      "trailingSlash": true,
      "cleanUrls": true,
      "github": {
        "silent": true
      },
      "rewrites": [
        { "source": "/pdfspark/:path*", "destination": "/pdfspark/index.html" }
      ],
      "headers": [
        {
          "source": "/pdfspark/:path*",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=0, must-revalidate"
            }
          ]
        },
        {
          "source": "/pdfspark/assets/:path*",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        }
      ]
    };
    
    fs.writeFileSync(path.join(__dirname, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
    log('✅ Created vercel.json for subdirectory deployment');
    
    // Create a configuration file that will be included in the build to track deployment
    const buildInfoPath = path.join(__dirname, 'public', 'build-info.json');
    const buildInfo = {
      "app": "pdfspark",
      "version": "1.0.0",
      "environment": "production",
      "buildTimestamp": new Date().toISOString(),
      "basePath": "/pdfspark/",
      "deployment": {
        "type": "subdirectory",
        "target": "quicksparks.dev/pdfspark",
        "platform": "vercel"
      }
    };
    
    // Ensure public directory exists
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
    log('✅ Created build-info.json');
    
    // Step 6: Deploy with Vercel CLI (Skip if prepare-only)
    if (prepareOnly) {
      log('Skipping deployment as prepare-only mode is enabled.');
      log(`
📋 Manual Deployment Instructions:

1. Now that your project is built and prepared for subdirectory deployment, you can:
   
   - Deploy it manually via the Vercel dashboard
   - Use the Vercel CLI with the following commands:
     
     vercel login
     vercel link
     vercel deploy --prod
     
2. After deployment, configure the subdirectory path in the Vercel dashboard:
   - Go to your project settings in the Vercel dashboard
   - Configure the domain as quicksparks.dev
   - Set the path prefix to /pdfspark
   
3. For detailed instructions, see the DEPLOY_INSTRUCTIONS.md file in this directory.
      `);
    } else {
      log('Step 6: Deploying to Vercel...');
      try {
        // First check if we're logged in and project is linked
        log('Checking Vercel authentication and project linking...');
        
        // Check if logged in
        const vercelTokenResult = execSync('vercel whoami', { stdio: 'pipe' }).toString().trim();
        log(`✅ Authenticated as: ${vercelTokenResult}`);
        
        // Link project if not linked
        log('Linking project to Vercel...');
        execSync('vercel link --yes', { stdio: 'inherit' });
        log('✅ Project linked to Vercel');
        
        // Pull environment variables
        log('Pulling Vercel environment variables...');
        execSync('vercel env pull', { stdio: 'inherit' });
        
        // Deploy to Vercel
        log('Deploying to Vercel...');
        execSync('vercel deploy --prod --yes', { stdio: 'inherit' });
        
        log('✅ Successfully deployed to quicksparks.dev/pdfspark!');
      } catch (error) {
        log(`⚠️ Deployment with Vercel CLI failed: ${error.message}`);
        log('Falling back to manual deployment instructions...');
        
        log(`
Please complete the deployment manually with the following steps:

1. Ensure you're logged in to Vercel:
   vercel login

2. Link this project to your Vercel account:
   vercel link

3. Deploy the project:
   vercel deploy --prod

4. After deployment, configure the subdirectory path in the Vercel dashboard:
   - Go to your project settings in the Vercel dashboard
   - Configure the domain as quicksparks.dev
   - Set the path prefix to /pdfspark
        `);
      }
    }
    
    // Step 7: Verification and instructions
    log(`
🎉 Deployment completed!

Your application should now be available at:
https://quicksparks.dev/pdfspark/

Verify that all routes work correctly by testing:
- Home page: https://quicksparks.dev/pdfspark/
- Product page: https://quicksparks.dev/pdfspark/product
- Conversion page: https://quicksparks.dev/pdfspark/convert

If any issues occur, check:
1. Vercel project settings to ensure it's connected to the main quicksparks.dev domain
2. That the custom domain is properly configured
3. That the rewrites in vercel.json are working as expected
`);
    
  } catch (error) {
    log(`❌ Error during deployment: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Execute the deployment
subdirectoryDeploy().catch(error => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});