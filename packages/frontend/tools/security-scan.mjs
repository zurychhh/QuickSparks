#!/usr/bin/env node

/**
 * Simple security scan script for PDFSpark application
 * 
 * This script performs:
 * 1. Content Security Policy checks
 * 2. SSL/TLS security headers checks
 * 3. Basic vulnerability scanning for common web risks
 * 4. Dependency vulnerability checks
 */

import { execSync } from 'child_process';
import fs from 'fs';
import fetch from 'node-fetch';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_URL = process.env.APP_URL || 'https://quicksparks.dev/pdfspark';
const REPORT_PATH = path.join(__dirname, '../security-report.json');

// Disable SSL verification for testing only
const agent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Checks HTTP response headers for security headers
 */
async function checkSecurityHeaders() {
  console.log('Checking security headers...');
  
  try {
    const response = await fetch(APP_URL, { agent });
    const headers = response.headers;
    
    const securityHeaders = {
      'Strict-Transport-Security': headers.get('Strict-Transport-Security'),
      'Content-Security-Policy': headers.get('Content-Security-Policy'),
      'X-Content-Type-Options': headers.get('X-Content-Type-Options'),
      'X-Frame-Options': headers.get('X-Frame-Options'),
      'X-XSS-Protection': headers.get('X-XSS-Protection'),
      'Referrer-Policy': headers.get('Referrer-Policy'),
      'Permissions-Policy': headers.get('Permissions-Policy'),
    };
    
    // Check which security headers are missing
    const missingHeaders = Object.keys(securityHeaders)
      .filter(header => !securityHeaders[header])
      .map(header => ({ header, severity: header === 'Strict-Transport-Security' ? 'High' : 'Medium' }));
    
    // Check for weak configuration in existing headers
    const weakHeaders = [];
    if (securityHeaders['Strict-Transport-Security'] && 
        !securityHeaders['Strict-Transport-Security'].includes('max-age=31536000')) {
      weakHeaders.push({ 
        header: 'Strict-Transport-Security', 
        value: securityHeaders['Strict-Transport-Security'],
        issue: 'max-age should be at least 31536000 (1 year)',
        severity: 'Medium'
      });
    }
    
    if (securityHeaders['X-Frame-Options'] && 
        securityHeaders['X-Frame-Options'] !== 'DENY' && 
        securityHeaders['X-Frame-Options'] !== 'SAMEORIGIN') {
      weakHeaders.push({ 
        header: 'X-Frame-Options', 
        value: securityHeaders['X-Frame-Options'],
        issue: 'Should be set to DENY or SAMEORIGIN',
        severity: 'Medium'
      });
    }
    
    return {
      allHeaders: securityHeaders,
      missingHeaders,
      weakHeaders
    };
  } catch (error) {
    console.error('Error checking security headers:', error.message);
    return {
      error: error.message,
      allHeaders: {},
      missingHeaders: [],
      weakHeaders: []
    };
  }
}

/**
 * Checks for outdated dependencies with security vulnerabilities
 */
function checkDependencyVulnerabilities() {
  console.log('Checking dependencies for vulnerabilities...');
  
  try {
    const npmAuditOutput = execSync('npm audit --json', { 
      cwd: path.join(__dirname, '..'), 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'] 
    });
    
    const auditResults = JSON.parse(npmAuditOutput);
    
    // Format the vulnerabilities in a more readable way
    const vulnerabilities = Object.values(auditResults.vulnerabilities || {})
      .map(vuln => ({
        name: vuln.name,
        severity: vuln.severity,
        description: vuln.title || vuln.url || 'No description provided',
        recommendedAction: vuln.recommendation || 'No recommendation provided'
      }));
    
    return {
      summary: {
        vulnerabilities: auditResults.metadata?.vulnerabilities || {},
        totalDependencies: auditResults.metadata?.totalDependencies || 0
      },
      vulnerabilities
    };
  } catch (error) {
    let errorData = { error: error.message };
    
    // Try to parse the error output as it might contain JSON with vulnerability info
    try {
      if (error.stdout) {
        const auditResults = JSON.parse(error.stdout.toString());
        
        errorData = {
          error: error.message,
          summary: {
            vulnerabilities: auditResults.metadata?.vulnerabilities || {},
            totalDependencies: auditResults.metadata?.totalDependencies || 0
          },
          vulnerabilities: Object.values(auditResults.vulnerabilities || {})
            .map(vuln => ({
              name: vuln.name,
              severity: vuln.severity,
              description: vuln.title || vuln.url || 'No description provided',
              recommendedAction: vuln.recommendation || 'No recommendation provided'
            }))
        };
      }
    } catch (parseError) {
      // Could not parse output, continue with basic error message
    }
    
    return errorData;
  }
}

/**
 * Checks for client-side security risks (localStorage usage, XSS vulnerabilities)
 */
function checkClientSideRisks() {
  console.log('Checking client-side security risks...');
  
  const clientSideRiskPatterns = [
    {
      pattern: /localStorage\.setItem\(\s*["']auth|token|jwt|password|secret|key["']/gi,
      file: '**/*.{js,jsx,ts,tsx}',
      risk: 'Storing sensitive data in localStorage',
      description: 'Sensitive data stored in localStorage is accessible to any script running on the page and can be stolen in XSS attacks',
      severity: 'High',
      recommendation: 'Use httpOnly cookies for authentication tokens instead of localStorage'
    },
    {
      pattern: /dangerouslySetInnerHTML/g,
      file: '**/*.{jsx,tsx}',
      risk: 'Using dangerouslySetInnerHTML',
      description: 'dangerouslySetInnerHTML can lead to XSS vulnerabilities if user input is used',
      severity: 'Medium',
      recommendation: 'Avoid using dangerouslySetInnerHTML or ensure content is properly sanitized'
    },
    {
      pattern: /eval\(/g,
      file: '**/*.{js,jsx,ts,tsx}',
      risk: 'Using eval()',
      description: 'eval() executes arbitrary code and can lead to XSS vulnerabilities',
      severity: 'High',
      recommendation: 'Avoid using eval() and use safer alternatives'
    },
    {
      pattern: /document\.write\(/g,
      file: '**/*.{js,jsx,ts,tsx}',
      risk: 'Using document.write()',
      description: 'document.write() can lead to XSS vulnerabilities if user input is used',
      severity: 'Medium',
      recommendation: 'Avoid using document.write() and use safer DOM manipulation methods'
    }
  ];
  
  try {
    const srcDir = path.join(__dirname, '../src');
    const risks = [];
    
    // Simplified implementation that uses grep to search for patterns
    for (const riskPattern of clientSideRiskPatterns) {
      try {
        const grepCommand = `grep -r "${riskPattern.pattern.source}" --include="${riskPattern.file}" ${srcDir}`;
        const grepOutput = execSync(grepCommand, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        
        if (grepOutput) {
          const findings = grepOutput.split('\n').map(line => {
            const [filePath, ...rest] = line.split(':');
            return {
              file: path.relative(path.join(__dirname, '..'), filePath),
              line: rest.join(':'),
            };
          });
          
          risks.push({
            ...riskPattern,
            findings,
          });
        }
      } catch (error) {
        // grep returns non-zero exit code when no matches are found, which is not an error for us
        if (!error.status === 1) {
          console.error(`Error searching for pattern ${riskPattern.pattern.source}:`, error.message);
        }
      }
    }
    
    return { risks };
  } catch (error) {
    console.error('Error checking client-side risks:', error.message);
    return { error: error.message, risks: [] };
  }
}

/**
 * Generates a security report
 */
async function generateSecurityReport() {
  console.log('Generating security report...');
  
  const securityHeaders = await checkSecurityHeaders();
  const dependencyVulnerabilities = checkDependencyVulnerabilities();
  const clientSideRisks = checkClientSideRisks();
  
  const report = {
    timestamp: new Date().toISOString(),
    appUrl: APP_URL,
    securityHeaders,
    dependencyVulnerabilities,
    clientSideRisks,
    summary: {
      missingHeadersCount: securityHeaders.missingHeaders.length,
      weakHeadersCount: securityHeaders.weakHeaders.length,
      vulnerabilitiesCount: dependencyVulnerabilities.vulnerabilities?.length || 0,
      clientSideRisksCount: clientSideRisks.risks?.length || 0,
      highSeverityIssues: [
        ...securityHeaders.missingHeaders.filter(h => h.severity === 'High'),
        ...securityHeaders.weakHeaders.filter(h => h.severity === 'High'),
        ...(dependencyVulnerabilities.vulnerabilities || []).filter(v => v.severity === 'high' || v.severity === 'critical'),
        ...(clientSideRisks.risks || []).filter(r => r.severity === 'High')
      ].length,
      mediumSeverityIssues: [
        ...securityHeaders.missingHeaders.filter(h => h.severity === 'Medium'),
        ...securityHeaders.weakHeaders.filter(h => h.severity === 'Medium'),
        ...(dependencyVulnerabilities.vulnerabilities || []).filter(v => v.severity === 'moderate'),
        ...(clientSideRisks.risks || []).filter(r => r.severity === 'Medium')
      ].length,
      lowSeverityIssues: [
        ...securityHeaders.missingHeaders.filter(h => h.severity === 'Low'),
        ...securityHeaders.weakHeaders.filter(h => h.severity === 'Low'),
        ...(dependencyVulnerabilities.vulnerabilities || []).filter(v => v.severity === 'low'),
        ...(clientSideRisks.risks || []).filter(r => r.severity === 'Low')
      ].length
    }
  };
  
  // Save report to file
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  
  console.log(`Security report saved to ${REPORT_PATH}`);
  
  // Print summary
  console.log('\nSecurity Scan Summary:');
  console.log('---------------------');
  console.log(`Missing Security Headers: ${report.summary.missingHeadersCount}`);
  console.log(`Weak Security Headers: ${report.summary.weakHeadersCount}`);
  console.log(`Dependency Vulnerabilities: ${report.summary.vulnerabilitiesCount}`);
  console.log(`Client-side Security Risks: ${report.summary.clientSideRisksCount}`);
  console.log('\nSeverity Summary:');
  console.log(`High: ${report.summary.highSeverityIssues}`);
  console.log(`Medium: ${report.summary.mediumSeverityIssues}`);
  console.log(`Low: ${report.summary.lowSeverityIssues}`);
  
  return report;
}

// Run the security scan
generateSecurityReport().catch(error => {
  console.error('Error running security scan:', error);
  process.exit(1);
});