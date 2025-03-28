# PDFSpark Deployment Guide

This document provides a complete guide for deploying the PDFSpark application to the subdirectory path on quicksparks.dev.

## Prerequisites

- Node.js v18+ installed
- npm or pnpm package manager
- Vercel CLI installed and authenticated
- Access to the Vercel dashboard

## Configuration Overview

The PDFSpark application is configured to run in a subdirectory path (/pdfspark) with:

1. **Vite Configuration**: Base path set to `/pdfspark/`
2. **React Router**: Basename set to `/pdfspark`
3. **Vercel Configuration**: Custom rewrites and headers for the subdirectory path

## Deployment Process

### Option 1: Using the Automated Script (Recommended)

We've created a specialized deployment script that handles all the necessary steps:

```bash
# From the frontend directory
npm run deploy:vercel
```

This script:
1. Verifies the correct configuration for subdirectory deployment
2. Builds the application with proper asset paths
3. Creates the necessary Vercel configuration
4. Deploys to Vercel as a static site
5. Provides instructions for domain configuration

### Option 2: Manual Deployment

If you need to perform the deployment manually, follow these steps:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Create a vercel.json file in the dist directory**:
   ```json
   {
     "version": 2,
     "public": true,
     "cleanUrls": true,
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
   }
   ```

3. **Deploy to Vercel**:
   ```bash
   cd dist
   vercel deploy --prod --yes
   ```

## Post-Deployment Configuration

After deploying to Vercel, you need to configure the domain:

1. Go to the Vercel dashboard and select the newly created project
2. Navigate to Settings > Domains
3. Add the domain: `quicksparks.dev`
4. Configure the path prefix: `/pdfspark`
5. Verify DNS settings are correct

## Verification

After completing the domain configuration, verify that the application works correctly at:

- Main page: https://quicksparks.dev/pdfspark/
- Product page: https://quicksparks.dev/pdfspark/product
- Conversion page: https://quicksparks.dev/pdfspark/convert

Test navigation between pages to ensure all routing works properly.

## Troubleshooting

### Assets Not Loading

If assets aren't loading after deployment:

1. Check that all URLs in the HTML are using the correct base path
2. Verify that the Vite build has properly prefixed asset paths
3. Check browser console for 404 errors and path issues

### Routing Issues

If routes don't work properly:

1. Ensure the Router has the correct `basename="/pdfspark"` prop
2. Check that Vercel rewrites are correctly configured
3. Verify that deep linking (directly accessing routes) works

### API Connectivity

If API calls fail:

1. Check that API base URLs are correctly configured for the subdirectory
2. Verify CORS settings on the backend
3. Check network requests in the browser console for errors

## Rollback Procedure

If something goes wrong with the deployment:

1. Go to the Vercel dashboard and select the project
2. Navigate to the Deployments tab
3. Find the last working deployment
4. Click the three dots menu (⋮) and select "Promote to Production"

## Security Considerations

- The site is deployed with proper cache headers for optimized loading
- All client-side routes are handled by the React Router
- No sensitive information is exposed in the frontend build

## Performance Optimizations

The deployment includes several performance optimizations:

- Code splitting for React, React Router, and Zustand
- CSS optimizations with proper bundling
- Aggressive caching for static assets
- Reduced bundle size through tree-shaking