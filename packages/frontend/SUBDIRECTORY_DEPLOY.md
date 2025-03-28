# Deploying PDFSpark to quicksparks.dev/pdfspark

This guide explains how to deploy the PDFSpark application to run as a subdirectory on the main quicksparks.dev domain.

## Prerequisites

- Vercel CLI installed and logged in
- Access to the quicksparks.dev domain on Vercel
- Permission to deploy to the main quicksparks.dev project

## Automatic Deployment

We've created a specialized deployment script that handles all necessary configuration for subdirectory deployment:

```bash
# From the frontend directory
npm run deploy:subdirectory
```

This script:
1. Updates the Vite configuration to use `/pdfspark/` as the base path
2. Updates React Router to use `/pdfspark` as the basename
3. Builds the application with proper asset paths
4. Creates a Vercel configuration optimized for subdirectory deployment
5. Deploys to Vercel with proper routing configuration

## Manual Deployment Steps

If you need to perform the deployment manually, follow these steps:

### 1. Update Vite Configuration

Edit `vite.config.ts` to include a base path:

```typescript
export default defineConfig({
  base: '/pdfspark/',
  // Rest of the config...
})
```

### 2. Update React Router

Edit `src/App.tsx` to include a basename in the Router:

```jsx
<Router basename="/pdfspark">
  {/* Routes here */}
</Router>
```

### 3. Create a Proper Vercel Configuration

Create a `vercel.json` file with:

```json
{
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
}
```

### 4. Build and Deploy

Run the following commands:

```bash
# Fix any build issues first
node fix-build.mjs

# Build with the new configuration
npm run build

# Deploy to Vercel
vercel deploy --prod
```

## Verifying the Deployment

After deployment, verify that the application is accessible and working correctly at:

- Main page: https://quicksparks.dev/pdfspark/
- Product page: https://quicksparks.dev/pdfspark/product
- Conversion page: https://quicksparks.dev/pdfspark/convert

Test navigation between pages to ensure all routing works properly.

## Troubleshooting

### Assets Not Loading

If assets aren't loading, check:
- That the `base` path in Vite config is set correctly
- That all asset URLs in the code are relative, not absolute

### Routing Issues

If routing doesn't work:
- Ensure the Router has the correct `basename` prop
- Check that Vercel rewrites are correctly configured
- Verify that deep linking (directly accessing routes like `/pdfspark/product`) works

### API Connectivity

If API calls fail:
- Ensure the API base URL is correctly configured
- Check CORS settings on the backend
- Verify that proxy settings in Vite config are appropriate for development

## Domain Configuration

To ensure the subdirectory works properly, the main quicksparks.dev domain must be properly configured in Vercel:

1. In the Vercel project for quicksparks.dev, verify the custom domain is set up
2. Ensure DNS settings point to Vercel correctly
3. Check the project's routing configuration to handle subdirectory paths correctly

## Roll Back Instructions

If something goes wrong with the deployment, you can roll back to the previous version:

1. In the Vercel dashboard, find the project
2. Go to the Deployments tab
3. Find the last working deployment
4. Click the three dots menu (⋮) and select "Promote to Production"