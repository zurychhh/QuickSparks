# PDFSpark WWW Subdomain Fix

This package contains the fix for the www.quicksparks.dev/pdfspark deployment issue where accessing through the www subdomain was resulting in 404 errors.

## What This Fix Does

1. Creates a separate Vercel deployment specifically for the www subdomain
2. Properly configures the path prefix settings for /pdfspark
3. Sets up the correct security headers and caching rules
4. Provides verification tools to ensure both apex domain and www subdomain work correctly

## How to Deploy

1. Run the deployment script:
   ```
   npm run deploy:www
   ```

2. After deployment, go to the Vercel dashboard and add the www.quicksparks.dev domain to this new project
   - Look for domain verification instructions
   - Add any required DNS records
   - Wait for DNS propagation (may take a few minutes to a few hours)

3. Verify the deployment:
   ```
   npm run verify:www
   ```

## Testing

After deployment, verify that both these URLs work:
- https://www.quicksparks.dev/pdfspark/
- https://quicksparks.dev/pdfspark/

## Common Issues

- **DNS Propagation**: Changes to DNS settings can take time to propagate
- **Domain Verification**: Ensure all verification records are properly added
- **Route Configuration**: If routes aren't working, check the vercel.json rewrites
- **Conflicting Projects**: Ensure no other Vercel projects are using the same domain

## Long-term Solution

For a more permanent solution, consider:
1. Consolidating the deployments into a single Vercel project
2. Setting up automated deployment through CI/CD
3. Properly configuring both apex and www domains in a single configuration
