#!/usr/bin/env node

/**
 * PDFSpark Monitoring Setup
 * 
 * This script:
 * 1. Sets up Sentry release tracking
 * 2. Creates performance monitoring dashboard
 * 3. Configures alerts for critical metrics
 * 4. Sets up heartbeat monitoring for the application
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.join(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PACKAGE_ROOT, 'package.json');

const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
const APP_VERSION = packageJson.version;
const APP_NAME = packageJson.name;

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Run a command and return the output
 */
function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Set up Sentry release tracking
 */
async function setupSentryRelease() {
  console.log('\n📊 Setting up Sentry release tracking...');
  
  const sentryPropertiesPath = path.join(PACKAGE_ROOT, 'sentry.properties');
  const hasSentryConfig = fs.existsSync(sentryPropertiesPath);
  
  if (!hasSentryConfig) {
    console.log('No Sentry configuration found. Creating one...');
    
    const sentryOrg = await question('Enter your Sentry organization slug: ');
    const sentryProject = await question('Enter your Sentry project slug: ');
    const sentryToken = await question('Enter your Sentry auth token: ');
    
    // Create sentry.properties file
    fs.writeFileSync(sentryPropertiesPath, `
defaults.url=https://sentry.io/
defaults.org=${sentryOrg}
defaults.project=${sentryProject}
auth.token=${sentryToken}
cli.executable=node_modules/@sentry/cli/bin/sentry-cli
    `.trim());
    
    console.log('✅ Created Sentry configuration file');
  } else {
    console.log('✅ Found existing Sentry configuration');
  }
  
  // Check if @sentry/cli is installed
  if (!fs.existsSync(path.join(PACKAGE_ROOT, 'node_modules', '@sentry', 'cli'))) {
    console.log('Installing @sentry/cli...');
    run('npm install --save-dev @sentry/cli');
  }
  
  // Create a new Sentry release
  const releaseId = `${APP_NAME}@${APP_VERSION}`;
  console.log(`Creating Sentry release: ${releaseId}`);
  
  const createReleaseResult = run(`npx sentry-cli releases new ${releaseId}`);
  if (!createReleaseResult.success) {
    console.log('⚠️ Failed to create Sentry release. You might need to authenticate first.');
    console.log('Run: npx sentry-cli login');
    console.log(`Error: ${createReleaseResult.error}`);
    return false;
  }
  
  // Upload source maps
  console.log('Uploading source maps to Sentry...');
  const uploadSourcemapsResult = run(`npx sentry-cli releases files ${releaseId} upload-sourcemaps ./dist`);
  
  if (!uploadSourcemapsResult.success) {
    console.log('⚠️ Failed to upload source maps.');
    console.log(`Error: ${uploadSourcemapsResult.error}`);
  } else {
    console.log('✅ Uploaded source maps to Sentry');
  }
  
  // Finalize the release
  console.log('Finalizing Sentry release...');
  run(`npx sentry-cli releases finalize ${releaseId}`);
  
  // Add release to Sentry initialization in sentry.ts
  const sentryConfigPath = path.join(PACKAGE_ROOT, 'src', 'utils', 'sentry.ts');
  if (fs.existsSync(sentryConfigPath)) {
    let sentryConfig = fs.readFileSync(sentryConfigPath, 'utf8');
    
    // Check if release is already configured
    if (!sentryConfig.includes('release:')) {
      sentryConfig = sentryConfig.replace(
        'Sentry.init({',
        `Sentry.init({\n  release: '${releaseId}',`
      );
      fs.writeFileSync(sentryConfigPath, sentryConfig);
      console.log('✅ Updated Sentry initialization with release information');
    } else {
      console.log('✅ Sentry release is already configured');
    }
  }
  
  return true;
}

/**
 * Set up performance monitoring
 */
async function setupPerformanceMonitoring() {
  console.log('\n📈 Setting up performance monitoring...');
  
  // Create a monitoring configuration file
  const monitoringConfigPath = path.join(PACKAGE_ROOT, 'monitoring.config.json');
  
  const monitoringConfig = {
    app: {
      name: APP_NAME,
      version: APP_VERSION,
      environment: 'production'
    },
    metrics: {
      performance: [
        {
          name: 'First Contentful Paint',
          target: 1800, // ms
          critical: true
        },
        {
          name: 'Largest Contentful Paint',
          target: 2500, // ms
          critical: true
        },
        {
          name: 'Cumulative Layout Shift',
          target: 0.1,
          critical: true
        },
        {
          name: 'First Input Delay',
          target: 100, // ms
          critical: true
        },
        {
          name: 'Time to Interactive',
          target: 3500, // ms
          critical: false
        }
      ],
      business: [
        {
          name: 'Conversion Rate',
          target: 2.5, // percentage
          critical: true
        },
        {
          name: 'Bounce Rate',
          target: 55, // percentage
          critical: false
        },
        {
          name: 'Average Session Duration',
          target: 120, // seconds
          critical: false
        }
      ],
      technical: [
        {
          name: 'API Response Time',
          target: 500, // ms
          critical: true
        },
        {
          name: 'Error Rate',
          target: 1, // percentage
          critical: true
        },
        {
          name: 'JavaScript Errors',
          target: 0,
          critical: true
        }
      ],
      conversion: [
        {
          name: 'Conversion Time',
          target: 30, // seconds
          critical: true
        },
        {
          name: 'Conversion Success Rate',
          target: 95, // percentage
          critical: true
        },
        {
          name: 'Conversion Quality Score',
          target: 8.5, // 1-10 scale
          critical: true
        }
      ]
    },
    alerts: [
      {
        metric: 'Error Rate',
        threshold: 5, // percentage
        channel: 'email',
        recipients: ['team@quicksparks.dev']
      },
      {
        metric: 'Conversion Success Rate',
        threshold: 90, // percentage
        channel: 'slack',
        recipients: ['#alerts-pdfspark']
      },
      {
        metric: 'API Response Time',
        threshold: 1000, // ms
        channel: 'slack',
        recipients: ['#alerts-pdfspark']
      }
    ],
    heartbeat: {
      endpoint: '/pdfspark/health',
      interval: 60, // seconds
      timeout: 5, // seconds
      alertThreshold: 2, // failures
      alertChannels: ['slack', 'email']
    }
  };
  
  fs.writeFileSync(monitoringConfigPath, JSON.stringify(monitoringConfig, null, 2));
  console.log(`✅ Created monitoring configuration: ${monitoringConfigPath}`);
  
  // Create a Web Vitals monitoring utility
  const webVitalsPath = path.join(PACKAGE_ROOT, 'src', 'utils', 'web-vitals.ts');
  const webVitalsContent = `import { ReportHandler } from 'web-vitals';
import * as Sentry from '@sentry/react';
import { trackEvent } from './analytics';

// Initialize performance monitoring
export function initWebVitals(): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Record First Input Delay
    import('web-vitals').then(({ onFID }) => {
      onFID(reportWebVital);
    });
    
    // Record Largest Contentful Paint
    import('web-vitals').then(({ onLCP }) => {
      onLCP(reportWebVital);
    });
    
    // Record Cumulative Layout Shift
    import('web-vitals').then(({ onCLS }) => {
      onCLS(reportWebVital);
    });
    
    // Record First Contentful Paint
    import('web-vitals').then(({ onFCP }) => {
      onFCP(reportWebVital);
    });
    
    // Record Time to First Byte
    import('web-vitals').then(({ onTTFB }) => {
      onTTFB(reportWebVital);
    });
  }
}

// Report Web Vitals to analytics and Sentry
function reportWebVital(metric: any): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
  
  // Send to Google Analytics
  trackEvent({
    category: 'Web Vitals',
    action: metric.name,
    value: Math.round(metric.value),
    label: metric.id,
    nonInteraction: true
  });
  
  // Send to Sentry
  Sentry.captureMessage(\`\${metric.name}: \${metric.value}\`, {
    level: 'info',
    tags: {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_id: metric.id
    }
  });
}

// Convenience function to report all Web Vitals
export function reportWebVitals(onPerfEntry?: ReportHandler): void {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
}

export default initWebVitals;
`;

  // Create the Web Vitals utility file
  fs.writeFileSync(webVitalsPath, webVitalsContent);
  console.log(`✅ Created Web Vitals utility: ${webVitalsPath}`);
  
  // Update package.json to add web-vitals dependency
  if (!packageJson.dependencies['web-vitals']) {
    console.log('Installing web-vitals...');
    run('npm install --save web-vitals');
  }
  
  return true;
}

/**
 * Set up monitoring dashboard generator
 */
function setupMonitoringDashboard() {
  console.log('\n🖥️ Setting up monitoring dashboard generator...');
  
  const dashboardScriptPath = path.join(PACKAGE_ROOT, 'tools', 'generate-dashboard.mjs');
  const dashboardScriptContent = `#!/usr/bin/env node

/**
 * PDFSpark Dashboard Generator
 * 
 * Generates an HTML dashboard for monitoring PDFSpark metrics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.join(__dirname, '..');
const MONITORING_CONFIG_PATH = path.join(PACKAGE_ROOT, 'monitoring.config.json');
const DASHBOARD_OUTPUT_PATH = path.join(PACKAGE_ROOT, 'dashboard', 'index.html');

// Create dashboard directory if it doesn't exist
if (!fs.existsSync(path.join(PACKAGE_ROOT, 'dashboard'))) {
  fs.mkdirSync(path.join(PACKAGE_ROOT, 'dashboard'), { recursive: true });
}

// Load monitoring configuration
const monitoringConfig = JSON.parse(fs.readFileSync(MONITORING_CONFIG_PATH, 'utf8'));

// Generate dashboard HTML
function generateDashboard() {
  const htmlContent = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${monitoringConfig.app.name} - Monitoring Dashboard</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { padding-top: 2rem; }
    .card { margin-bottom: 1.5rem; }
    .alert-indicator { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 5px; }
    .alert-indicator.green { background-color: #28a745; }
    .alert-indicator.yellow { background-color: #ffc107; }
    .alert-indicator.red { background-color: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="mb-4">\${monitoringConfig.app.name} Monitoring Dashboard</h1>
    
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Application Status</h5>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <p class="mb-1"><strong>Version:</strong> \${monitoringConfig.app.version}</p>
                <p class="mb-1"><strong>Environment:</strong> \${monitoringConfig.app.environment}</p>
                <p class="mb-0"><strong>Last Updated:</strong> <span id="last-updated">Loading...</span></p>
              </div>
              <div>
                <div class="text-center">
                  <div class="alert-indicator green" id="status-indicator"></div>
                  <span id="status-text">Healthy</span>
                </div>
                <p class="text-center mt-2">
                  <button class="btn btn-sm btn-primary" id="refresh-btn">Refresh</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Alert Status</h5>
          </div>
          <div class="card-body">
            <ul class="list-group" id="alerts-list">
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Loading alerts...
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Performance Metrics</h5>
          </div>
          <div class="card-body">
            <canvas id="performance-chart"></canvas>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Business Metrics</h5>
          </div>
          <div class="card-body">
            <canvas id="business-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Technical Metrics</h5>
          </div>
          <div class="card-body">
            <canvas id="technical-chart"></canvas>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Conversion Metrics</h5>
          </div>
          <div class="card-body">
            <canvas id="conversion-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Mock data - in a real dashboard, this would come from your monitoring APIs
    function generateMockData() {
      // Generate random data for the performance metrics
      const performanceMetrics = \${JSON.stringify(monitoringConfig.metrics.performance)};
      const performanceData = {
        labels: performanceMetrics.map(m => m.name),
        datasets: [{
          label: 'Current Values',
          data: performanceMetrics.map(m => Math.random() * m.target * 1.5),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }, {
          label: 'Target Values',
          data: performanceMetrics.map(m => m.target),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      };
      
      // Generate random data for the business metrics
      const businessMetrics = \${JSON.stringify(monitoringConfig.metrics.business)};
      const businessData = {
        labels: businessMetrics.map(m => m.name),
        datasets: [{
          label: 'Current Values',
          data: businessMetrics.map(m => Math.random() * m.target * 1.5),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }, {
          label: 'Target Values',
          data: businessMetrics.map(m => m.target),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      };
      
      // Generate random data for the technical metrics
      const technicalMetrics = \${JSON.stringify(monitoringConfig.metrics.technical)};
      const technicalData = {
        labels: technicalMetrics.map(m => m.name),
        datasets: [{
          label: 'Current Values',
          data: technicalMetrics.map(m => Math.random() * m.target * 1.5),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }, {
          label: 'Target Values',
          data: technicalMetrics.map(m => m.target),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      };
      
      // Generate random data for the conversion metrics
      const conversionMetrics = \${JSON.stringify(monitoringConfig.metrics.conversion)};
      const conversionData = {
        labels: conversionMetrics.map(m => m.name),
        datasets: [{
          label: 'Current Values',
          data: conversionMetrics.map(m => Math.random() * m.target * 1.2),
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        }, {
          label: 'Target Values',
          data: conversionMetrics.map(m => m.target),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      };
      
      return {
        performance: performanceData,
        business: businessData,
        technical: technicalData,
        conversion: conversionData
      };
    }
    
    // Initialize charts
    function initCharts() {
      const data = generateMockData();
      
      // Performance chart
      new Chart(
        document.getElementById('performance-chart'),
        {
          type: 'bar',
          data: data.performance,
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        }
      );
      
      // Business chart
      new Chart(
        document.getElementById('business-chart'),
        {
          type: 'bar',
          data: data.business,
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        }
      );
      
      // Technical chart
      new Chart(
        document.getElementById('technical-chart'),
        {
          type: 'bar',
          data: data.technical,
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        }
      );
      
      // Conversion chart
      new Chart(
        document.getElementById('conversion-chart'),
        {
          type: 'bar',
          data: data.conversion,
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        }
      );
    }
    
    // Update timestamps and status
    function updateStatus() {
      document.getElementById('last-updated').textContent = new Date().toLocaleString();
      
      // Generate mock alerts
      const alerts = \${JSON.stringify(monitoringConfig.alerts)};
      const alertsListHTML = alerts.map(alert => {
        const status = Math.random() > 0.8 ? 'triggered' : 'normal';
        const statusClass = status === 'triggered' ? 'bg-danger' : 'bg-success';
        
        return \`
          <li class="list-group-item d-flex justify-content-between align-items-center">
            \${alert.metric} (\${alert.threshold})
            <span class="badge \${statusClass} rounded-pill">\${status}</span>
          </li>
        \`;
      }).join('');
      
      document.getElementById('alerts-list').innerHTML = alertsListHTML;
    }
    
    // Initialize the dashboard
    document.addEventListener('DOMContentLoaded', function() {
      initCharts();
      updateStatus();
      
      // Setup refresh button
      document.getElementById('refresh-btn').addEventListener('click', function() {
        updateStatus();
      });
    });
  </script>
</body>
</html>
\`;

  fs.writeFileSync(DASHBOARD_OUTPUT_PATH, htmlContent);
  console.log(\`Dashboard generated at: \${DASHBOARD_OUTPUT_PATH}\`);
}

// Generate the dashboard
generateDashboard();
`;

  fs.writeFileSync(dashboardScriptPath, dashboardScriptContent);
  fs.chmodSync(dashboardScriptPath, '755'); // Make executable
  console.log(`✅ Created dashboard generator: ${dashboardScriptPath}`);
  
  // Add script to package.json
  if (!packageJson.scripts['generate-dashboard']) {
    packageJson.scripts['generate-dashboard'] = 'node tools/generate-dashboard.mjs';
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added generate-dashboard script to package.json');
  }
  
  // Generate the initial dashboard
  console.log('Generating initial dashboard...');
  run('node tools/generate-dashboard.mjs');
  
  return true;
}

/**
 * Setup metrics collection utility
 */
function setupMetricsCollection() {
  console.log('\n📊 Setting up metrics collection utility...');
  
  const metricsUtilPath = path.join(PACKAGE_ROOT, 'src', 'utils', 'metrics.ts');
  const metricsUtilContent = `import { trackEvent } from './analytics';
import * as Sentry from '@sentry/react';

// Application Metric Types
export enum MetricType {
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  CONVERSION = 'conversion'
}

// Metric data interface
export interface MetricData {
  name: string;
  value: number;
  type: MetricType;
  timestamp?: number;
  additionalData?: Record<string, any>;
}

// Class for handling metrics collection
class MetricsCollector {
  private metrics: Record<string, MetricData[]> = {};
  
  /**
   * Record a metric
   */
  public recordMetric(metric: MetricData): void {
    const timestamp = metric.timestamp || Date.now();
    const metricWithTimestamp = {
      ...metric,
      timestamp
    };
    
    // Initialize array if it doesn't exist
    if (!this.metrics[metric.name]) {
      this.metrics[metric.name] = [];
    }
    
    // Add metric to collection
    this.metrics[metric.name].push(metricWithTimestamp);
    
    // Track in analytics
    trackEvent({
      category: \`Metric_\${metric.type}\`,
      action: metric.name,
      value: Math.round(metric.value * 100) / 100,
      label: JSON.stringify(metric.additionalData || {})
    });
    
    // Send to Sentry
    Sentry.addBreadcrumb({
      category: 'metrics',
      message: \`\${metric.name}: \${metric.value}\`,
      level: 'info',
      data: {
        ...metric,
        type: metric.type
      }
    });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(\`[Metric] \${metric.type} - \${metric.name}: \${metric.value}\`);
    }
  }
  
  /**
   * Record a performance metric
   */
  public recordPerformanceMetric(
    name: string, 
    value: number, 
    additionalData?: Record<string, any>
  ): void {
    this.recordMetric({
      name,
      value,
      type: MetricType.PERFORMANCE,
      additionalData
    });
  }
  
  /**
   * Record a business metric
   */
  public recordBusinessMetric(
    name: string, 
    value: number, 
    additionalData?: Record<string, any>
  ): void {
    this.recordMetric({
      name,
      value,
      type: MetricType.BUSINESS,
      additionalData
    });
  }
  
  /**
   * Record a technical metric
   */
  public recordTechnicalMetric(
    name: string, 
    value: number, 
    additionalData?: Record<string, any>
  ): void {
    this.recordMetric({
      name,
      value,
      type: MetricType.TECHNICAL,
      additionalData
    });
  }
  
  /**
   * Record a conversion metric
   */
  public recordConversionMetric(
    name: string, 
    value: number, 
    additionalData?: Record<string, any>
  ): void {
    this.recordMetric({
      name,
      value,
      type: MetricType.CONVERSION,
      additionalData
    });
  }
  
  /**
   * Get metrics by type
   */
  public getMetricsByType(type: MetricType): Record<string, MetricData[]> {
    const result: Record<string, MetricData[]> = {};
    
    Object.entries(this.metrics).forEach(([name, values]) => {
      const filteredValues = values.filter(value => value.type === type);
      if (filteredValues.length > 0) {
        result[name] = filteredValues;
      }
    });
    
    return result;
  }
  
  /**
   * Get metrics by name
   */
  public getMetricsByName(name: string): MetricData[] {
    return this.metrics[name] || [];
  }
  
  /**
   * Clear stored metrics
   */
  public clearMetrics(): void {
    this.metrics = {};
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();

// Helper functions
export function recordPerformanceMetric(name: string, value: number, additionalData?: Record<string, any>): void {
  metricsCollector.recordPerformanceMetric(name, value, additionalData);
}

export function recordBusinessMetric(name: string, value: number, additionalData?: Record<string, any>): void {
  metricsCollector.recordBusinessMetric(name, value, additionalData);
}

export function recordTechnicalMetric(name: string, value: number, additionalData?: Record<string, any>): void {
  metricsCollector.recordTechnicalMetric(name, value, additionalData);
}

export function recordConversionMetric(name: string, value: number, additionalData?: Record<string, any>): void {
  metricsCollector.recordConversionMetric(name, value, additionalData);
}

export default metricsCollector;
`;

  fs.writeFileSync(metricsUtilPath, metricsUtilContent);
  console.log(`✅ Created metrics collection utility: ${metricsUtilPath}`);
  
  return true;
}

/**
 * Set up A/B testing infrastructure
 */
function setupABTesting() {
  console.log('\n🧪 Setting up A/B testing infrastructure...');
  
  const abTestingPath = path.join(PACKAGE_ROOT, 'src', 'utils', 'ab-testing.ts');
  const abTestingContent = `import { trackEvent } from './analytics';

// Experiment variant type
export type Variant = 'A' | 'B' | 'C' | 'D' | 'control';

// Experiment interface
export interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
  weights?: number[];
  isActive: boolean;
}

// User assignment interface
export interface UserAssignment {
  experimentId: string;
  variant: Variant;
  timestamp: number;
}

// ExperimentResult interface
export interface ExperimentResult {
  experimentId: string;
  variant: Variant;
  action: string;
  value?: number;
  timestamp: number;
}

/**
 * A/B Testing Manager
 */
class ABTestingManager {
  private experiments: Record<string, Experiment> = {};
  private userAssignments: UserAssignment[] = [];
  private experimentResults: ExperimentResult[] = [];
  private storageKey = 'pdfspark_experiments';
  
  constructor() {
    this.loadUserAssignments();
  }
  
  /**
   * Load user assignments from localStorage
   */
  private loadUserAssignments(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        this.userAssignments = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Failed to load A/B testing data:', error);
      this.userAssignments = [];
    }
  }
  
  /**
   * Save user assignments to localStorage
   */
  private saveUserAssignments(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.userAssignments));
    } catch (error) {
      console.error('Failed to save A/B testing data:', error);
    }
  }
  
  /**
   * Register an experiment
   */
  public registerExperiment(experiment: Experiment): void {
    this.experiments[experiment.id] = experiment;
    console.log(\`Registered experiment: \${experiment.name} (ID: \${experiment.id})\`);
  }
  
  /**
   * Register multiple experiments
   */
  public registerExperiments(experiments: Experiment[]): void {
    experiments.forEach(experiment => this.registerExperiment(experiment));
  }
  
  /**
   * Get a random variant based on weights
   */
  private getRandomVariant(variants: Variant[], weights?: number[]): Variant {
    // If weights are not provided, use equal distribution
    if (!weights || weights.length !== variants.length) {
      weights = variants.map(() => 1 / variants.length);
    }
    
    // Normalize weights to ensure they sum to 1
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    const normalizedWeights = weights.map(weight => weight / totalWeight);
    
    // Generate a random number between 0 and 1
    const random = Math.random();
    
    // Find the variant based on the random number and weights
    let cumulativeWeight = 0;
    for (let i = 0; i < variants.length; i++) {
      cumulativeWeight += normalizedWeights[i];
      if (random <= cumulativeWeight) {
        return variants[i];
      }
    }
    
    // Fallback to the first variant
    return variants[0];
  }
  
  /**
   * Get assigned variant for a user
   */
  public getVariant(experimentId: string): Variant | null {
    // Check if experiment exists and is active
    const experiment = this.experiments[experimentId];
    if (!experiment || !experiment.isActive) {
      return null;
    }
    
    // Check if user is already assigned to this experiment
    const existingAssignment = this.userAssignments.find(
      assignment => assignment.experimentId === experimentId
    );
    
    if (existingAssignment) {
      return existingAssignment.variant;
    }
    
    // Assign user to a variant
    const variant = this.getRandomVariant(experiment.variants, experiment.weights);
    
    // Save the assignment
    const assignment: UserAssignment = {
      experimentId,
      variant,
      timestamp: Date.now()
    };
    
    this.userAssignments.push(assignment);
    this.saveUserAssignments();
    
    // Track the assignment in analytics
    trackEvent({
      category: 'Experiment',
      action: 'Assignment',
      label: \`\${experimentId}:\${variant}\`
    });
    
    return variant;
  }
  
  /**
   * Check if a specific variant is active for the user
   */
  public isVariant(experimentId: string, variant: Variant): boolean {
    const assignedVariant = this.getVariant(experimentId);
    return assignedVariant === variant;
  }
  
  /**
   * Record an experiment result
   */
  public recordResult(
    experimentId: string,
    action: string,
    value?: number
  ): void {
    // Get the user's variant
    const variant = this.getVariant(experimentId);
    if (!variant) return;
    
    // Record the result
    const result: ExperimentResult = {
      experimentId,
      variant,
      action,
      value,
      timestamp: Date.now()
    };
    
    this.experimentResults.push(result);
    
    // Track the result in analytics
    trackEvent({
      category: 'Experiment',
      action: \`\${experimentId}_\${action}\`,
      label: variant,
      value
    });
  }
  
  /**
   * Clear all user assignments (usually for testing)
   */
  public clearAssignments(): void {
    this.userAssignments = [];
    this.saveUserAssignments();
  }
  
  /**
   * Get experiment status
   */
  public getExperimentStatus(experimentId: string): {
    isActive: boolean;
    variant: Variant | null;
    experimentName: string | null;
  } {
    const experiment = this.experiments[experimentId];
    if (!experiment) {
      return { isActive: false, variant: null, experimentName: null };
    }
    
    return {
      isActive: experiment.isActive,
      variant: this.getVariant(experimentId),
      experimentName: experiment.name
    };
  }
}

// Create singleton instance
export const abTestingManager = new ABTestingManager();

// Example experiments
export const EXPERIMENTS = {
  PRICING_PAGE_LAYOUT: 'pricing_page_layout',
  CHECKOUT_FLOW: 'checkout_flow',
  LANDING_PAGE_CTA: 'landing_page_cta',
  CONVERSION_OPTIONS: 'conversion_options'
};

// React hook for A/B testing
export function useExperiment(experimentId: string): {
  variant: Variant | null;
  isVariant: (variantToCheck: Variant) => boolean;
  recordResult: (action: string, value?: number) => void;
} {
  const variant = abTestingManager.getVariant(experimentId);
  
  return {
    variant,
    isVariant: (variantToCheck: Variant) => variant === variantToCheck,
    recordResult: (action: string, value?: number) => {
      abTestingManager.recordResult(experimentId, action, value);
    }
  };
}

export default abTestingManager;
`;

  fs.writeFileSync(abTestingPath, abTestingContent);
  console.log(`✅ Created A/B testing utility: ${abTestingPath}`);
  
  // Create an A/B testing hook for React
  const abTestingHookPath = path.join(PACKAGE_ROOT, 'src', 'hooks', 'useABTesting.ts');
  const abTestingHookContent = `import { useMemo } from 'react';
import abTestingManager, { 
  Variant, 
  EXPERIMENTS 
} from '@utils/ab-testing';

/**
 * Hook for using A/B testing in components
 * 
 * @param experimentId - ID of the experiment to use
 * @returns Object with variant info and helper functions
 */
export function useABTesting(experimentId: string) {
  const experimentData = useMemo(() => {
    const variant = abTestingManager.getVariant(experimentId);
    
    return {
      variant,
      isControl: variant === 'control',
      isVariantA: variant === 'A',
      isVariantB: variant === 'B',
      isVariantC: variant === 'C',
      isVariantD: variant === 'D',
      isVariant: (variantToCheck: Variant) => variant === variantToCheck,
      recordResult: (action: string, value?: number) => {
        abTestingManager.recordResult(experimentId, action, value);
      },
      experimentStatus: abTestingManager.getExperimentStatus(experimentId)
    };
  }, [experimentId]);
  
  return experimentData;
}

// Add constants for common experiments
useABTesting.EXPERIMENTS = EXPERIMENTS;

export default useABTesting;
`;

  fs.writeFileSync(abTestingHookPath, abTestingHookContent);
  console.log(`✅ Created A/B testing hook: ${abTestingHookPath}`);
  
  // Register A/B tests in a separate file
  const abTestsPath = path.join(PACKAGE_ROOT, 'src', 'utils', 'ab-tests.ts');
  const abTestsContent = `import abTestingManager, { EXPERIMENTS } from './ab-testing';

/**
 * Register all A/B tests for the application
 */
export function registerABTests() {
  // Pricing Page Layout Test
  abTestingManager.registerExperiment({
    id: EXPERIMENTS.PRICING_PAGE_LAYOUT,
    name: 'Pricing Page Layout Variations',
    variants: ['control', 'A', 'B'],
    weights: [0.34, 0.33, 0.33], // Control gets slightly more traffic
    isActive: true
  });
  
  // Checkout Flow Test
  abTestingManager.registerExperiment({
    id: EXPERIMENTS.CHECKOUT_FLOW,
    name: 'Checkout Flow Optimization',
    variants: ['control', 'A'],
    weights: [0.5, 0.5],
    isActive: true
  });
  
  // Landing Page CTA Test
  abTestingManager.registerExperiment({
    id: EXPERIMENTS.LANDING_PAGE_CTA,
    name: 'Landing Page Call-to-Action',
    variants: ['control', 'A', 'B', 'C'],
    weights: [0.25, 0.25, 0.25, 0.25],
    isActive: true
  });
  
  // Conversion Options Test
  abTestingManager.registerExperiment({
    id: EXPERIMENTS.CONVERSION_OPTIONS,
    name: 'Conversion Options Layout',
    variants: ['control', 'A'],
    weights: [0.5, 0.5],
    isActive: true
  });
  
  console.log('A/B tests registered successfully');
}

export default registerABTests;
`;

  fs.writeFileSync(abTestsPath, abTestsContent);
  console.log(`✅ Created A/B tests configuration: ${abTestsPath}`);
  
  return true;
}

/**
 * Set up quality monitoring for conversions
 */
function setupQualityMonitoring() {
  console.log('\n🔍 Setting up conversion quality monitoring...');
  
  const qualityMonitoringPath = path.join(PACKAGE_ROOT, 'src', 'utils', 'quality-monitoring.ts');
  const qualityMonitoringContent = `import { trackEvent } from './analytics';
import { recordConversionMetric } from './metrics';
import * as Sentry from '@sentry/react';

/**
 * Quality metrics collected for each conversion
 */
export interface ConversionQualityMetrics {
  conversionId: string;
  originalFileSize: number;
  convertedFileSize: number;
  conversionTime: number;
  conversionSuccess: boolean;
  errorCount: number;
  visualQualityScore?: number;
  textAccuracyScore?: number;
  formatPreservationScore?: number;
  overallQualityScore?: number;
  fileType: string;
  timestamp: number;
  userId?: string;
  options: Record<string, any>;
}

/**
 * Quality score ranges
 */
const QUALITY_RANGES = {
  POOR: { min: 0, max: 3.9 },
  FAIR: { min: 4, max: 5.9 },
  GOOD: { min: 6, max: 7.9 },
  EXCELLENT: { min: 8, max: 10 }
};

/**
 * Conversion Quality Monitoring Service
 */
class QualityMonitoringService {
  private metrics: ConversionQualityMetrics[] = [];
  
  /**
   * Record quality metrics for a conversion
   */
  public recordQualityMetrics(metrics: Partial<ConversionQualityMetrics> & { conversionId: string }): void {
    // Ensure required fields
    if (!metrics.conversionId) {
      console.error('ConversionId is required for quality metrics');
      return;
    }
    
    // Complete the metrics object with defaults
    const fullMetrics: ConversionQualityMetrics = {
      conversionId: metrics.conversionId,
      originalFileSize: metrics.originalFileSize || 0,
      convertedFileSize: metrics.convertedFileSize || 0,
      conversionTime: metrics.conversionTime || 0,
      conversionSuccess: metrics.conversionSuccess !== false, // Default to true
      errorCount: metrics.errorCount || 0,
      visualQualityScore: metrics.visualQualityScore,
      textAccuracyScore: metrics.textAccuracyScore,
      formatPreservationScore: metrics.formatPreservationScore,
      overallQualityScore: this.calculateOverallQualityScore(metrics),
      fileType: metrics.fileType || 'unknown',
      timestamp: metrics.timestamp || Date.now(),
      userId: metrics.userId,
      options: metrics.options || {}
    };
    
    // Store the metrics
    this.metrics.push(fullMetrics);
    
    // Track metric in our analytics systems
    this.trackQualityMetric(fullMetrics);
    
    return;
  }
  
  /**
   * Calculate overall quality score based on component scores
   */
  private calculateOverallQualityScore(metrics: Partial<ConversionQualityMetrics>): number | undefined {
    const { visualQualityScore, textAccuracyScore, formatPreservationScore } = metrics;
    
    // If no component scores are available, return undefined
    if (
      visualQualityScore === undefined && 
      textAccuracyScore === undefined && 
      formatPreservationScore === undefined
    ) {
      return metrics.overallQualityScore; // Use provided score or undefined
    }
    
    // Count and sum the available scores
    let sum = 0;
    let count = 0;
    
    if (visualQualityScore !== undefined) {
      sum += visualQualityScore;
      count++;
    }
    
    if (textAccuracyScore !== undefined) {
      sum += textAccuracyScore;
      count++;
    }
    
    if (formatPreservationScore !== undefined) {
      sum += formatPreservationScore;
      count++;
    }
    
    // Calculate average if we have scores
    return count > 0 ? Math.round((sum / count) * 10) / 10 : undefined;
  }
  
  /**
   * Track quality metric in analytics
   */
  private trackQualityMetric(metrics: ConversionQualityMetrics): void {
    // Record in our metrics system
    if (metrics.overallQualityScore !== undefined) {
      recordConversionMetric('Conversion Quality Score', metrics.overallQualityScore, {
        conversionId: metrics.conversionId,
        fileType: metrics.fileType
      });
    }
    
    if (metrics.conversionTime) {
      recordConversionMetric('Conversion Time', metrics.conversionTime / 1000, {
        conversionId: metrics.conversionId,
        fileType: metrics.fileType
      });
    }
    
    recordConversionMetric('Conversion Success Rate', metrics.conversionSuccess ? 100 : 0, {
      conversionId: metrics.conversionId,
      fileType: metrics.fileType
    });
    
    // Track in Google Analytics
    trackEvent({
      category: 'Conversion',
      action: 'QualityMetrics',
      label: metrics.fileType,
      value: metrics.overallQualityScore !== undefined ? Math.round(metrics.overallQualityScore) : undefined
    });
    
    // Log quality issues to Sentry if quality is poor
    if (metrics.overallQualityScore !== undefined && metrics.overallQualityScore < QUALITY_RANGES.FAIR.min) {
      Sentry.captureMessage(\`Poor conversion quality: \${metrics.overallQualityScore.toFixed(1)}/10\`, {
        level: 'warning',
        tags: {
          conversion_id: metrics.conversionId,
          file_type: metrics.fileType,
          quality_score: metrics.overallQualityScore.toString()
        },
        extra: {
          ...metrics
        }
      });
    }
    
    // Log conversion failures to Sentry
    if (!metrics.conversionSuccess) {
      Sentry.captureMessage(\`Conversion failed: \${metrics.conversionId}\`, {
        level: 'error',
        tags: {
          conversion_id: metrics.conversionId,
          file_type: metrics.fileType,
          error_count: metrics.errorCount.toString()
        },
        extra: {
          ...metrics
        }
      });
    }
  }
  
  /**
   * Get quality metrics for a specific conversion
   */
  public getQualityMetrics(conversionId: string): ConversionQualityMetrics | undefined {
    return this.metrics.find(metric => metric.conversionId === conversionId);
  }
  
  /**
   * Get quality metrics for a specific user
   */
  public getQualityMetricsByUser(userId: string): ConversionQualityMetrics[] {
    return this.metrics.filter(metric => metric.userId === userId);
  }
  
  /**
   * Calculate average quality score across all conversions
   */
  public getAverageQualityScore(): number | undefined {
    const metricsWithScores = this.metrics.filter(
      metric => metric.overallQualityScore !== undefined
    );
    
    if (metricsWithScores.length === 0) {
      return undefined;
    }
    
    const sum = metricsWithScores.reduce(
      (acc, metric) => acc + (metric.overallQualityScore || 0),
      0
    );
    
    return Math.round((sum / metricsWithScores.length) * 10) / 10;
  }
  
  /**
   * Calculate success rate across all conversions
   */
  public getSuccessRate(): number {
    if (this.metrics.length === 0) {
      return 100; // Default to 100% if no conversions
    }
    
    const successfulConversions = this.metrics.filter(
      metric => metric.conversionSuccess
    );
    
    return Math.round((successfulConversions.length / this.metrics.length) * 100);
  }
  
  /**
   * Get quality metrics distribution
   */
  public getQualityDistribution(): Record<string, number> {
    const metricsWithScores = this.metrics.filter(
      metric => metric.overallQualityScore !== undefined
    );
    
    if (metricsWithScores.length === 0) {
      return {
        POOR: 0,
        FAIR: 0,
        GOOD: 0,
        EXCELLENT: 0
      };
    }
    
    // Count metrics in each range
    const counts = {
      POOR: 0,
      FAIR: 0,
      GOOD: 0,
      EXCELLENT: 0
    };
    
    metricsWithScores.forEach(metric => {
      const score = metric.overallQualityScore || 0;
      
      if (score >= QUALITY_RANGES.EXCELLENT.min) {
        counts.EXCELLENT++;
      } else if (score >= QUALITY_RANGES.GOOD.min) {
        counts.GOOD++;
      } else if (score >= QUALITY_RANGES.FAIR.min) {
        counts.FAIR++;
      } else {
        counts.POOR++;
      }
    });
    
    // Convert to percentages
    const total = metricsWithScores.length;
    
    return {
      POOR: Math.round((counts.POOR / total) * 100),
      FAIR: Math.round((counts.FAIR / total) * 100),
      GOOD: Math.round((counts.GOOD / total) * 100),
      EXCELLENT: Math.round((counts.EXCELLENT / total) * 100)
    };
  }
  
  /**
   * Clear all metrics (usually for testing)
   */
  public clearMetrics(): void {
    this.metrics = [];
  }
}

// Create singleton instance
export const qualityMonitoringService = new QualityMonitoringService();

// Helper functions
export function recordConversionQuality(
  metrics: Partial<ConversionQualityMetrics> & { conversionId: string }
): void {
  qualityMonitoringService.recordQualityMetrics(metrics);
}

export default qualityMonitoringService;
`;

  fs.writeFileSync(qualityMonitoringPath, qualityMonitoringContent);
  console.log(`✅ Created quality monitoring utility: ${qualityMonitoringPath}`);
  
  return true;
}

/**
 * Main function
 */
async function main() {
  console.log('=================================================');
  console.log('🚀 PDFSpark Monitoring & Analytics Setup');
  console.log('=================================================');
  console.log(`Application: ${APP_NAME} v${APP_VERSION}`);
  console.log('=================================================\n');
  
  // Setup Sentry release tracking
  await setupSentryRelease();
  
  // Setup performance monitoring
  await setupPerformanceMonitoring();
  
  // Setup monitoring dashboard
  setupMonitoringDashboard();
  
  // Setup metrics collection
  setupMetricsCollection();
  
  // Setup A/B testing
  setupABTesting();
  
  // Setup quality monitoring
  setupQualityMonitoring();
  
  console.log('\n=================================================');
  console.log('✅ Setup completed successfully!');
  console.log('=================================================');
  
  // Add the monitoring setup script to package.json
  if (!packageJson.scripts['setup-monitoring']) {
    packageJson.scripts['setup-monitoring'] = 'node tools/setup-monitoring.mjs';
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added setup-monitoring script to package.json');
  }
  
  // Close readline interface
  rl.close();
}

// Run the setup
main().catch(error => {
  console.error('Error during setup:', error);
  rl.close();
  process.exit(1);
});