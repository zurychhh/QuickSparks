#!/usr/bin/env node

/**
 * PDFSpark Dashboard Generator
 * 
 * Generates a simple HTML dashboard for monitoring PDFSpark metrics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.join(__dirname, '..');
const DASHBOARD_OUTPUT_PATH = path.join(PACKAGE_ROOT, 'dashboard', 'index.html');

// Create dashboard directory if it doesn't exist
if (!fs.existsSync(path.join(PACKAGE_ROOT, 'dashboard'))) {
  fs.mkdirSync(path.join(PACKAGE_ROOT, 'dashboard'), { recursive: true });
}

// Simple monitoring configuration
const monitoringConfig = {
  app: {
    name: "PDFSpark",
    version: "1.0.0",
    environment: "production"
  },
  metrics: {
    performance: [
      { name: "First Contentful Paint", target: 1800 },
      { name: "Largest Contentful Paint", target: 2500 },
      { name: "Cumulative Layout Shift", target: 0.1 },
      { name: "First Input Delay", target: 100 }
    ],
    business: [
      { name: "Conversion Rate", target: 2.5 },
      { name: "Bounce Rate", target: 55 },
      { name: "Average Session Duration", target: 120 }
    ],
    technical: [
      { name: "API Response Time", target: 500 },
      { name: "Error Rate", target: 1 },
      { name: "JavaScript Errors", target: 0 }
    ],
    conversion: [
      { name: "Conversion Time", target: 30 },
      { name: "Conversion Success Rate", target: 95 },
      { name: "Conversion Quality Score", target: 8.5 }
    ]
  }
};

// Generate dashboard HTML
function generateDashboard() {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${monitoringConfig.app.name} - Monitoring Dashboard</title>
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
    <h1 class="mb-4">${monitoringConfig.app.name} Monitoring Dashboard</h1>
    
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Application Status</h5>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <p class="mb-1"><strong>Version:</strong> ${monitoringConfig.app.version}</p>
                <p class="mb-1"><strong>Environment:</strong> ${monitoringConfig.app.environment}</p>
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
            <h5 class="card-title mb-0">Deployment Status</h5>
          </div>
          <div class="card-body">
            <p><strong>Deployment URL:</strong> <a href="https://quicksparks.dev/pdfspark/" target="_blank">https://quicksparks.dev/pdfspark/</a></p>
            <p><strong>Last Deployment:</strong> <span id="last-deployment">Loading...</span></p>
            <p><strong>Status:</strong> <span class="badge bg-success">Active</span></p>
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
      const performanceMetrics = ${JSON.stringify(monitoringConfig.metrics.performance)};
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
      const businessMetrics = ${JSON.stringify(monitoringConfig.metrics.business)};
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
      const technicalMetrics = ${JSON.stringify(monitoringConfig.metrics.technical)};
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
      const conversionMetrics = ${JSON.stringify(monitoringConfig.metrics.conversion)};
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
    
    // Update timestamps
    function updateStatus() {
      document.getElementById('last-updated').textContent = new Date().toLocaleString();
      document.getElementById('last-deployment').textContent = new Date().toLocaleString();
    }
    
    // Initialize the dashboard
    document.addEventListener('DOMContentLoaded', function() {
      initCharts();
      updateStatus();
      
      // Setup refresh button
      document.getElementById('refresh-btn').addEventListener('click', function() {
        location.reload();
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(DASHBOARD_OUTPUT_PATH, htmlContent);
  console.log(`Dashboard generated at: ${DASHBOARD_OUTPUT_PATH}`);
}

// Generate the dashboard
generateDashboard();

console.log('✅ Done! You can open the dashboard in your browser at:');
console.log(`file:///${DASHBOARD_OUTPUT_PATH}`);