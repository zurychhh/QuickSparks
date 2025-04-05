#!/bin/bash

# This script prepares the project for deployment to Render by ensuring package.json and
# package-lock.json are in sync

echo "Preparing project for Render deployment..."

# Make sure we have the latest dependencies
echo "Running npm install to update package-lock.json..."
npm install

# Commit the updated package-lock.json
echo "Committing updated package-lock.json..."
git add package-lock.json
git commit -m "Update package-lock.json for Render deployment"

# Push to the production branch
echo "Pushing changes to production branch..."
git push origin production

echo "Deployment preparation complete. Render should now be able to build successfully."
echo "Check your Render deployment logs to confirm."