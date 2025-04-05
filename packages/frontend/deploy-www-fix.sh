#!/bin/bash

# Deploy the www subdomain fix to Vercel
cd "/Users/user/conversion-microservices/packages/frontend/www-deploy"

echo "🚀 Deploying www subdomain fix to Vercel..."
vercel deploy --prod --yes

echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Go to Vercel dashboard and add www.quicksparks.dev as a domain to this project"
echo "2. In domain settings, copy the verification records and add them to your DNS configuration"
echo "3. Wait for DNS propagation and domain verification"
echo "4. Test https://www.quicksparks.dev/pdfspark/"
