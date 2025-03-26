# Domain Setup for PDFSpark at quicksparks.dev/pdfspark

This guide will help you configure the Vercel domain settings to properly map https://www.quicksparks.dev/pdfspark/ to your PDFSpark deployment.

## Setup Instructions

### Step 1: Access Domain Configuration

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the project corresponding to your PDFSpark deployment (project name should be "dist")
3. Click on "Settings" in the top navigation
4. Select "Domains" from the left sidebar

### Step 2: Add Domain as a Production Domain

1. You should see a section to add production domains
2. Enter `www.quicksparks.dev` (with the www prefix)
3. Click "Add"
4. Vercel may perform domain verification

### Step 3: Configure Path Prefix with Rewrites

The domain setup alone won't make the /pdfspark path work. You need to set up rewrites:

1. Navigate to "Settings" > "Rewrites"
2. Add the following rewrites:
   - Source: `/pdfspark`
   - Destination: `/`
   - Add another:
   - Source: `/pdfspark/(.*)` 
   - Destination: `/$1`

### Step 4: Deploy with Updated Configuration

1. Return to the project overview
2. Go to "Deployments"
3. Select the latest deployment
4. Click "Redeploy" to apply the changes

### Alternative Approach: Direct Project Linking

If the above steps don't work, try:

1. In the Vercel dashboard, identify the project that currently hosts quicksparks.dev
2. Go to Settings > Git in that project
3. Link the repository containing your PDFSpark code
4. Set a custom output directory: `packages/frontend/dist`
5. Configure build settings to include the base path

### Troubleshooting the 404 Error

Common reasons for a 404 NOT_FOUND error:

1. **Domain Not Properly Configured**: The domain www.quicksparks.dev may not be pointing to your project
2. **Path Mapping Missing**: The /pdfspark path isn't being correctly mapped to your application
3. **Rewrite Rules Incorrect**: The rewrite rules in Vercel configuration may be incorrect
4. **Deployment Target**: Ensure you're deploying to the production environment

## Verification

After making these changes, test:
- https://www.quicksparks.dev/pdfspark/
- https://www.quicksparks.dev/pdfspark/convert
- https://www.quicksparks.dev/pdfspark/product

## Getting Support

If the issue persists:
1. Check Vercel deployment logs for errors
2. Verify DNS settings for www.quicksparks.dev
3. Check if there are conflicting projects using the same domain