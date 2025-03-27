# PDFSpark Deployment Guide

## Overview
This document provides instructions for deploying the PDFSpark application, a document conversion service that handles PDF to DOCX and DOCX to PDF conversions. The application is fully tested with Selenium WebDriver against a real backend, ensuring all functionality works in production.

## Current Deployment
- **Production URL**: [https://quicksparks.dev/pdfspark](https://quicksparks.dev/pdfspark)
- **Branch**: feature/purchase-flow
- **Status**: Successfully deployed and verified

## Prerequisites
- Node.js (v18+)
- npm or yarn
- Vercel CLI (optional, for manual deployments)
- Git

## Deployment Methods

### 1. Automated Deployment (Recommended)
The project is configured with GitHub Actions for automated CI/CD. When changes are pushed to the main branch, the workflow will:

1. Build and test the application
2. Run end-to-end Selenium tests
3. Deploy to Vercel production
4. Verify the deployment

For pull requests, a preview deployment will be created automatically.

### 2. Manual Deployment via Scripts

#### Deploy Public Version
```bash
cd packages/frontend
./deploy-public.sh
```

This script will:
1. Build the application
2. Create a deployment directory with the necessary configuration
3. Deploy to Vercel with public access

#### Deploy with Custom Domain
```bash
cd packages/frontend
node verify-deployment.mjs
```

This will verify the deployment at https://quicksparks.dev/pdfspark.

### 3. Manual Vercel Deployment
```bash
cd packages/frontend
npm run build
vercel --prod
```

## Configuration Files

### vercel.json
The main Vercel configuration includes:
- Routing rules for the /pdfspark base path
- Redirects for various application routes
- Security headers
- Caching configurations

### Custom Domain Setup
The application is configured to use https://quicksparks.dev/pdfspark as the primary URL. To configure a different domain:

1. Update the DEPLOYED_URL in `tools/check-deployed-app.mjs`
2. Update any hardcoded URLs in the application code
3. Configure the new domain in the Vercel dashboard

## Verification
After deployment, run the verification script to ensure everything is working:

```bash
cd packages/frontend
node tools/check-deployed-app.mjs
```

This will check:
- All routes and redirects
- Static asset availability
- Security headers
- Required SEO files (robots.txt, sitemap.xml)

## Testing the Deployed Application
To run Selenium tests against the deployed application:

```bash
cd packages/frontend/selenium-tests
node complete-test.mjs
```

Make sure to update the BASE_URL in the test files if you're testing against a different deployment.

## Troubleshooting

### 404 Errors
If you're seeing 404 errors for client-side routes, check:
- Vercel.json rewrites and redirects configuration
- Router base path configuration in the application

### MIME Type Issues
If JavaScript modules aren't loading correctly:
- Check the content-type headers for .js files
- Ensure the server is configured to serve .js files with the correct MIME type

### Authentication Issues
If authentication is required unexpectedly:
- Check environment variables for authentication settings
- Verify public routes are properly configured in the backend

## Next Steps
See the [DEPLOYMENT_NEXT_STEPS.md](./DEPLOYMENT_NEXT_STEPS.md) file for recommended further actions to optimize and improve the deployment.

## Support
If you encounter any deployment issues, please open an issue on GitHub or contact the development team.

---

🚀 Happy deploying!