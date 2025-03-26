#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// URLs to test
const URLS = [
  'http://localhost:3000/pdfspark/',
  'http://localhost:3000/pdfspark/convert',
  'http://localhost:3000/pdfspark/product',
  'http://localhost:3000/pdfspark/pricing'
];

// Create reports directory
const reportsDir = path.join(__dirname, '..', 'lighthouse-reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Get current date for report naming
const date = new Date().toISOString().split('T')[0];

async function runLighthouse() {
  console.log('Starting Lighthouse performance tests...');
  
  // Check if server is running
  try {
    await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/pdfspark/');
  } catch (error) {
    console.error('❌ Development server is not running. Start it with "npm run dev" first.');
    process.exit(1);
  }

  // Summary of results to show at the end
  const summary = [];

  // Run Lighthouse for each URL
  for (const url of URLS) {
    const pageName = url.split('/').pop() || 'home';
    const reportPath = path.join(reportsDir, `${date}-${pageName}`);
    
    console.log(`\n🔍 Testing ${url}...`);
    
    try {
      const { stdout, stderr } = await execAsync(
        `npx lighthouse ${url} --output=html,json --output-path=${reportPath} --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo`
      );
      
      if (stderr) {
        console.error(`⚠️ Lighthouse warnings: ${stderr}`);
      }
      
      // Read JSON results to extract scores
      const jsonReport = JSON.parse(fs.readFileSync(`${reportPath}.json`, 'utf8'));
      const { performance, accessibility, 'best-practices': bestPractices, seo } = jsonReport.categories;
      
      const result = {
        url,
        performance: Math.round(performance.score * 100),
        accessibility: Math.round(accessibility.score * 100),
        bestPractices: Math.round(bestPractices.score * 100),
        seo: Math.round(seo.score * 100),
        reportFile: `${reportPath}.html`
      };
      
      summary.push(result);
      
      console.log(`✅ Lighthouse scores for ${url}:`);
      console.log(`   Performance:    ${result.performance}%`);
      console.log(`   Accessibility:  ${result.accessibility}%`);
      console.log(`   Best Practices: ${result.bestPractices}%`);
      console.log(`   SEO:            ${result.seo}%`);
      console.log(`   Report saved to: ${result.reportFile}`);
      
    } catch (error) {
      console.error(`❌ Error testing ${url}:`, error.message);
    }
  }
  
  // Display overall summary
  console.log('\n📊 PERFORMANCE SUMMARY:');
  console.log('====================');
  
  const avgPerformance = Math.round(summary.reduce((acc, item) => acc + item.performance, 0) / summary.length);
  const avgAccessibility = Math.round(summary.reduce((acc, item) => acc + item.accessibility, 0) / summary.length);
  const avgBestPractices = Math.round(summary.reduce((acc, item) => acc + item.bestPractices, 0) / summary.length);
  const avgSeo = Math.round(summary.reduce((acc, item) => acc + item.seo, 0) / summary.length);
  
  console.log(`Average Performance:    ${avgPerformance}%`);
  console.log(`Average Accessibility:  ${avgAccessibility}%`);
  console.log(`Average Best Practices: ${avgBestPractices}%`);
  console.log(`Average SEO:            ${avgSeo}%`);
  
  // Save summary to JSON
  const summaryPath = path.join(reportsDir, `${date}-summary.json`);
  fs.writeFileSync(summaryPath, JSON.stringify({ 
    date, 
    results: summary,
    averages: {
      performance: avgPerformance,
      accessibility: avgAccessibility,
      bestPractices: avgBestPractices,
      seo: avgSeo
    }
  }, null, 2));
  
  console.log(`\n✅ Summary saved to: ${summaryPath}`);
  console.log('\n🔍 Optimization opportunities can be found in the individual HTML reports.');
}

runLighthouse().catch(error => {
  console.error('Failed to run Lighthouse tests:', error);
  process.exit(1);
});