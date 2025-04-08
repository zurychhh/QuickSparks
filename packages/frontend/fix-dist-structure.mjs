#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PDFSPARK_DIR = path.join(DIST_DIR, 'pdfspark');
const PACKAGE_ROOT = __dirname;

// Create the pdfspark directory if it doesn't exist
if (!fs.existsSync(PDFSPARK_DIR)) {
  console.log(`Creating directory: ${PDFSPARK_DIR}`);
  fs.mkdirSync(PDFSPARK_DIR, { recursive: true });
}

// Move all files except vercel.json to the pdfspark directory
console.log('Moving files to pdfspark directory...');
fs.readdirSync(DIST_DIR).forEach(file => {
  // Skip vercel.json, .vercel directory, and pdfspark directory itself
  if (file === 'vercel.json' || file === '.vercel' || file === 'pdfspark' || file === '.gitignore') {
    return;
  }
  
  const sourcePath = path.join(DIST_DIR, file);
  const destPath = path.join(PDFSPARK_DIR, file);
  
  // If it's a directory, use recursive copy
  if (fs.statSync(sourcePath).isDirectory()) {
    // Use cp -R for directories
    console.log(`Copying directory: ${sourcePath} -> ${destPath}`);
    execSync(`cp -R "${sourcePath}" "${destPath}"`);
    execSync(`rm -rf "${sourcePath}"`);
  } else {
    // Move files
    console.log(`Moving file: ${sourcePath} -> ${destPath}`);
    fs.renameSync(sourcePath, destPath);
  }
});

// Use our pre-configured vercel.json instead of modifying the existing one
console.log('Using simple vercel.json configuration...');
const sourceVercelPath = path.join(PACKAGE_ROOT, 'simple-vercel.json');
const destVercelPath = path.join(DIST_DIR, 'vercel.json');

if (fs.existsSync(sourceVercelPath)) {
  // Copy our simple-vercel.json to dist/vercel.json
  fs.copyFileSync(sourceVercelPath, destVercelPath);
  console.log('✅ Copied simple-vercel.json to dist/vercel.json');
} else {
  console.log('⚠️ simple-vercel.json not found, creating basic configuration');
  
  // Create a basic vercel.json with minimal configuration
  const basicVercelConfig = {
    "version": 2,
    "public": true,
    "routes": [
      {
        "src": "/",
        "status": 307,
        "headers": { "Location": "/pdfspark/" }
      },
      { "handle": "filesystem" },
      { "src": "/pdfspark/(.*)", "dest": "/pdfspark/index.html" }
    ]
  };
  
  // Write basic vercel.json configuration
  fs.writeFileSync(destVercelPath, JSON.stringify(basicVercelConfig, null, 2));
}

// Create an index.html in the root that redirects to /pdfspark
console.log('Creating root index.html with redirect...');
const rootIndexPath = path.join(DIST_DIR, 'index.html');
const rootIndexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=/pdfspark/">
  <title>Redirecting to PDFSpark</title>
</head>
<body>
  <p>Redirecting to <a href="/pdfspark/">PDFSpark</a>...</p>
  <script>
    window.location.href = "/pdfspark/";
  </script>
</body>
</html>`;

fs.writeFileSync(rootIndexPath, rootIndexContent);

// Copy robots.txt and sitemap.xml to the root
console.log('Copying SEO files to the root...');
if (fs.existsSync(path.join(PDFSPARK_DIR, 'robots.txt'))) {
  fs.copyFileSync(
    path.join(PDFSPARK_DIR, 'robots.txt'),
    path.join(DIST_DIR, 'robots.txt')
  );
  console.log('✅ Copied robots.txt to root directory');
}

if (fs.existsSync(path.join(PDFSPARK_DIR, 'sitemap.xml'))) {
  fs.copyFileSync(
    path.join(PDFSPARK_DIR, 'sitemap.xml'),
    path.join(DIST_DIR, 'sitemap.xml')
  );
  console.log('✅ Copied sitemap.xml to root directory');
}

// Also ensure robots.txt and sitemap.xml are in public and will be copied to the dist directory next time
if (fs.existsSync(path.join(PACKAGE_ROOT, 'public'))) {
  // Check if SEO files exist in the public directory
  const robotsExists = fs.existsSync(path.join(PACKAGE_ROOT, 'public', 'robots.txt'));
  const sitemapExists = fs.existsSync(path.join(PACKAGE_ROOT, 'public', 'sitemap.xml'));

  // Create them if they don't exist
  if (!robotsExists) {
    const robotsContent = `User-agent: *
Allow: /pdfspark/
Disallow: /pdfspark/account/
Disallow: /pdfspark/checkout/

Sitemap: https://quicksparks.dev/sitemap.xml`;
    fs.writeFileSync(path.join(PACKAGE_ROOT, 'public', 'robots.txt'), robotsContent);
    console.log('✅ Created robots.txt in public directory');
  }

  if (!sitemapExists) {
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://quicksparks.dev/pdfspark/</loc>
    <lastmod>2025-03-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://quicksparks.dev/pdfspark/convert</loc>
    <lastmod>2025-03-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://quicksparks.dev/pdfspark/product</loc>
    <lastmod>2025-03-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quicksparks.dev/pdfspark/pricing</loc>
    <lastmod>2025-03-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quicksparks.dev/pdfspark/about</loc>
    <lastmod>2025-03-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
    fs.writeFileSync(path.join(PACKAGE_ROOT, 'public', 'sitemap.xml'), sitemapContent);
    console.log('✅ Created sitemap.xml in public directory');
  }
}

console.log('✅ Dist structure fixed successfully!');
console.log('The application should now be served correctly from /pdfspark/');