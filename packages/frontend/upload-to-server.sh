#!/bin/bash

# This script uploads the built distribution to a server
# Usage: ./upload-to-server.sh username@server.com /path/to/webroot/pdfspark

# Check for arguments
if [ $# -lt 2 ]; then
  echo "Usage: $0 username@server.com /path/to/webroot/pdfspark"
  exit 1
fi

SERVER=$1
REMOTE_PATH=$2

echo "Preparing to upload PDFSpark distribution to $SERVER:$REMOTE_PATH"

# Create the remote directory if it doesn't exist
ssh $SERVER "mkdir -p $REMOTE_PATH"

# Upload the dist directory contents
echo "Uploading distribution..."
scp -r dist/* $SERVER:$REMOTE_PATH

echo "Upload complete! PDFSpark is now deployed to $SERVER:$REMOTE_PATH"
echo ""
echo "Make sure your web server is configured to handle SPA routing correctly"
echo "For Apache, you may need a .htaccess file with:"
echo ""
echo "RewriteEngine On"
echo "RewriteBase /pdfspark/"
echo "RewriteRule ^index\.html$ - [L]"
echo "RewriteCond %{REQUEST_FILENAME} !-f"
echo "RewriteCond %{REQUEST_FILENAME} !-d"
echo "RewriteRule . /pdfspark/index.html [L]"
echo ""
echo "For Nginx, you may need configuration like:"
echo ""
echo "location /pdfspark/ {"
echo "  try_files \$uri \$uri/ /pdfspark/index.html;"
echo "}"