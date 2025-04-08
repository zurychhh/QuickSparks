# PDFSpark Vercel Deployment Instructions

This document provides detailed instructions for properly deploying PDFSpark to Vercel with the subdirectory `/pdfspark` configuration.

## Files Modified

We've implemented the solution from vercelsolution.md with the following key changes:

1. **index.html**:
   - Added `<base href="/pdfspark/">` tag
   - Updated favicon path to `/pdfspark/favicon.svg`

2. **src/main.tsx**:
   - Added proper `BrowserRouter` with `basename="/pdfspark"`

3. **src/App.tsx**:
   - Removed redundant `Router` component
   - Using just `Routes` and `Route` components

4. **vite.config.ts**:
   - Set `base: '/pdfspark/'`
   - Optimized asset paths and output directory structure
   - Added better organization for asset files

5. **vercel.json**:
   - Configured proper rewrites for `/pdfspark` path
   - Set up caching headers for assets
   - Enabled `cleanUrls` for prettier URLs

6. **New Scripts**:
   - `pdfspark-deploy.mjs`: Main deployment script
   - `verify-pdfspark-deployment.js`: Test script to verify deployment

## Deployment Instructions

### Option 1: Automatic Deployment

Run the following command to deploy using our automated script:

```bash
npm run deploy:pdfspark
```

This will:
1. Verify all configuration files are correct
2. Build the application with proper base path
3. Prepare dist folder with necessary configuration
4. Deploy to Vercel with public access

### Option 2: Manual Steps

If you prefer to deploy manually or if you hit the Vercel rate limit:

1. Build the application:
```bash
npm run build:vercel
```

2. Verify the dist folder contains:
   - index.html with `<base href="/pdfspark/">`
   - All assets in the assets folder
   - Copy `vercel.json` to the dist folder

3. Deploy manually using Vercel CLI:
```bash
cd dist
vercel deploy --prod
```

4. Set up the domain in Vercel dashboard:
   - Go to your Vercel project settings
   - Configure the domain to quicksparks.dev/pdfspark

### Option 3: Vercel Dashboard Configuration

If you prefer using the Vercel dashboard:

1. Push changes to GitHub
2. In the Vercel project settings:
   - Set the production branch to `production`
   - Make sure Build Command is `npm run build:vercel`
   - Set Output Directory to `dist`
   - Verify that Environment Variables are set correctly

## Testing the Deployment

To verify the deployment is working correctly:

1. Open the deployed URL with `/pdfspark` path
2. Test all pages and navigation
3. Verify refreshing the page doesn't cause 404 errors
4. Check the browser console for any path-related errors
5. Run the verification script in your browser console:
   - Open browser dev tools
   - Copy and paste the content of `tools/verify-pdfspark-deployment.js`

## Common Issues and Solutions

### 404 Errors on Page Refresh

If you get 404 errors when refreshing pages, check:
- vercel.json rewrites configuration
- Make sure all routes point to index.html

### Missing Assets

If assets are not loading:
- Check that they have the correct `/pdfspark/` prefix
- Verify the base tag in index.html
- Ensure Vite is building with the correct base path

### Subdirectory Not Working

If the subdirectory path doesn't work:
- Verify BrowserRouter has `basename="/pdfspark"`
- Check vercel.json rewrites
- Ensure base tag is in index.html

## Technical Details

The key to making this work is ensuring three things are correctly configured:

1. **Build Time**: Vite needs to add the `/pdfspark/` prefix to all asset URLs
2. **Runtime**: React Router needs to handle routes relative to `/pdfspark`
3. **Server**: Vercel needs to redirect all `/pdfspark/*` requests to index.html

All three components must work together for the solution to function properly.