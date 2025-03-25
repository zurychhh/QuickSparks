# Vercel Deployment Instructions

This document provides multiple solutions for deploying to Vercel when standard GitHub integrations fail.

## Issue Overview

We were encountering a problem where Vercel was cloning an older commit (f2351c2) instead of the latest code, causing build failures related to missing files like the `FileViewer` component.

## Solution Options

We've created multiple deployment methods to handle this issue:

### Option 1: Use Direct Vercel CLI Deployment (Recommended)

The minimal static deployment is the most reliable way to get a site up quickly:

```bash
cd packages/frontend
npm run minimal-deploy
```

This will:
1. Create a minimal static HTML page
2. Deploy directly to Vercel without a build step
3. Provide a valid placeholder until the main deployment works

### Option 2: Force GitHub Integration to Update

Try force-refreshing the GitHub integration:

1. Go to your Vercel project settings
2. Disconnect the GitHub repository
3. Reconnect the GitHub repository
4. Re-deploy manually from the Vercel dashboard

### Option 3: Try Standalone Deployment

We've created a standalone project deployment script:

```bash
cd packages/frontend
npm run vercel-standalone
```

This extracts only the frontend code into a new project for cleaner deployment.

### Option 4: Debug the Specific Build Issue

If the issue persists, check:
1. The GitHub webhook status in your repository settings
2. The Vercel build logs for specific errors
3. Whether Vercel has proper read permissions for your repository

## Recovery Steps

After a successful deployment, you can:

1. Set up proper domain routing in Vercel
2. Configure environment variables if needed
3. Return to normal deployment processes

## Need Help?

If these solutions don't work, consider reaching out to Vercel support or checking:
- [Vercel Build Troubleshooting Guide](https://vercel.com/docs/troubleshooting)
- [GitHub Webhook Documentation](https://docs.github.com/en/webhooks)