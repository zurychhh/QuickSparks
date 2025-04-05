#!/bin/bash

# Deploy to Netlify
cd "/Users/user/conversion-microservices/packages/frontend/netlify-deploy"

echo "🚀 Deploying to Netlify..."
# First check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
  echo "Installing Netlify CLI..."
  npm install -g netlify-cli
fi

# Deploy to Netlify
netlify deploy --prod

echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Go to Netlify dashboard and add custom domains:"
echo "   - www.quicksparks.dev"
echo "   - quicksparks.dev"
echo "2. In domain settings, configure DNS settings as needed"
echo "3. Test https://www.quicksparks.dev/pdfspark/"
