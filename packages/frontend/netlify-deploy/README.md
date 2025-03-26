# PDFSpark Netlify Deployment

This package contains the Netlify deployment configuration for the PDFSpark application, created as an alternative to Vercel due to deployment limits.

## What This Provides

1. Creates a Netlify-compatible deployment with proper configuration
2. Sets up redirects for apex to www domain
3. Configures proper handling of the /pdfspark path prefix
4. Includes security headers and caching directives

## How to Deploy

1. Run the deployment script:
   ```
   npm run deploy:netlify
   ```

2. Follow the Netlify CLI prompts to authenticate and deploy
   - The CLI will provide a deployment URL when complete

3. After deployment, configure custom domains in the Netlify dashboard:
   - Add www.quicksparks.dev as the primary domain
   - Add quicksparks.dev as a domain alias
   - Configure DNS settings as prompted

4. Verify the deployment:
   ```
   npm run verify:netlify <netlify-url>
   ```

## Configuration Details

The deployment uses a netlify.toml file with the following key configurations:

1. Redirects for apex domain to www subdomain
2. Path prefix handling for /pdfspark
3. SPA redirects for client-side routing
4. Security headers configuration
5. Asset caching rules

## Best Practices

- Always deploy from the main branch for consistency
- Verify deployments after making changes
- Use the Netlify dashboard to monitor site status
- Set up continuous deployment with GitHub integration

## Troubleshooting

If you encounter issues:
1. Check the Netlify deployment logs in the dashboard
2. Verify DNS settings are correctly configured
3. Test redirects using curl or browser developer tools
4. Check for conflicting redirect rules
