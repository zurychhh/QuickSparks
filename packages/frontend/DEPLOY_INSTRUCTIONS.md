# PDFSpark Subdirectory Deployment Guide

This document provides instructions for deploying PDFSpark to the subdirectory path at quicksparks.dev/pdfspark.

## Prerequisites

- Vercel account with access to the quicksparks.dev domain
- Node.js and npm installed locally

## Deployment Steps

1. **Prepare Project for Subdirectory Deployment**

First, run the preparation script to build the project with subdirectory configuration:

```bash
# Navigate to the frontend package
cd packages/frontend

# Run the preparation script (this will build the project but not deploy)
node subdirectory-deploy.mjs --prepare-only
```

2. **Deployment Options**

### Option 1: Deploy directly from Vercel Dashboard

This is the recommended option if you're experiencing issues with pnpm in the Vercel CLI:

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." > "Project"
3. Import your GitHub repository or upload the project files directly
4. Configure the project with the following settings:
   - Framework Preset: Vite
   - Root Directory: packages/frontend
   - Build Command: `npm run build`
   - Output Directory: dist
5. Click "Deploy"

### Option 2: Use Vercel CLI

```bash
# Navigate to the frontend package
cd packages/frontend

# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Link your project to Vercel
vercel link

# Deploy to Vercel
vercel deploy --prod
```

### Option 3: Upload the built files directly

If you're experiencing issues with the build process on Vercel:

1. The project has already been built in the `dist` directory
2. Zip the contents of the `dist` directory:
   ```bash
   cd packages/frontend/dist
   zip -r ../pdfspark-build.zip .
   ```
3. Upload the zip file to your web server at the `/pdfspark` path
4. Alternatively, use a static hosting service like Netlify, Firebase Hosting, or GitHub Pages

3. **Configure Domain and Routing in Vercel Dashboard**

After the deployment is complete, configure the subdirectory in the Vercel dashboard:

- Go to your project settings in the Vercel dashboard
- Navigate to the "Domains" section
- Add or configure the domain as `quicksparks.dev` 
- Set the path prefix to `/pdfspark`
- Ensure the "Rewrites" configuration matches the one in your `vercel.json` file

4. **Verify Deployment**

Verify that all routes work correctly by testing:

- Home page: https://quicksparks.dev/pdfspark/
- Product page: https://quicksparks.dev/pdfspark/product
- Conversion page: https://quicksparks.dev/pdfspark/convert

## Troubleshooting

### pnpm Installation Issues on Vercel

If you're experiencing issues with pnpm installation on Vercel:

1. Try using the simplified `vercel-package.json`:
   ```bash
   cp vercel-package.json package.json
   vercel deploy --prod
   ```

2. Or modify the Vercel project settings to use npm instead of pnpm:
   - Go to Project Settings > General > Build & Development Settings
   - Change the "Install Command" to `npm install`

### Other Common Issues

1. **Build Issues**: 
   - Check the build logs in the Vercel dashboard
   - Ensure the TypeScript errors are bypassed using the `build-skip-tests.mjs` script

2. **Routing Issues**:
   - Verify that the `vite.config.ts` has `base: '/pdfspark/'` set
   - Ensure that `App.tsx` has `<Router basename="/pdfspark">` configured
   - Check the rewrites configuration in `vercel.json`

3. **Domain Issues**:
   - Verify DNS settings for the domain
   - Check that the domain is correctly linked to your Vercel project
   - Ensure the path prefix is correctly set in the domain settings

## For Complete Automation

If you want to automate the deployment process in the future, you can:

1. Set up GitHub Actions for automatic deployment on push to main branch
2. Configure Vercel's GitHub integration for automatic deployments
3. Update the subdirectory-deploy.mjs script to use Vercel's API for more reliable deployments