#!/usr/bin/env node

/**
 * This script helps analyze and fix module import inconsistencies
 * throughout the codebase, standardizing on ES modules.
 * 
 * Usage:
 *   node scripts/fix-module-imports.mjs [--check] [--fix]
 * 
 * Options:
 *   --check   Only check for issues without making changes
 *   --fix     Automatically fix issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';

// Config
const ROOT_DIR = path.resolve(process.cwd());
const SRC_DIR = path.join(ROOT_DIR, 'src');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const CHECK_ONLY = process.argv.includes('--check');
const FIX_MODE = process.argv.includes('--fix');

// Colors for terminal output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${COLORS.cyan}=== Module Import Standardization ====${COLORS.reset}`);
console.log(`Scanning directory: ${SRC_DIR}`);
console.log(`Mode: ${CHECK_ONLY ? 'Check only' : FIX_MODE ? 'Auto-fix' : 'Analysis'}\n`);

// Track issues and fixes
const issues = {
  requireStatements: 0,
  moduleExports: 0,
  defaultExports: 0,
  inconsistentImports: 0,
  missingExtensions: 0,
  total: 0
};

// Track fixes
const fixes = {
  requireToImport: 0,
  moduleExportsToExport: 0,
  defaultExportsConverted: 0,
  importsReorganized: 0,
  total: 0
};

// Get all files recursively
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (EXTENSIONS.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check file for CommonJS patterns
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileIssues = [];
  
  // Check for require() statements
  const requireRegex = /(?<!['"\/])require\(['"]([^'"]+)['"]\)/g;
  if (requireRegex.test(content)) {
    fileIssues.push({
      type: 'requireStatement',
      message: 'Contains require() statements that should be replaced with imports'
    });
    issues.requireStatements++;
  }
  
  // Check for module.exports
  const moduleExportsRegex = /module\.exports\s*=\s*/g;
  if (moduleExportsRegex.test(content)) {
    fileIssues.push({
      type: 'moduleExports',
      message: 'Contains module.exports that should be replaced with export statements'
    });
    issues.moduleExports++;
  }
  
  // Check for export default
  const defaultExportRegex = /export\s+default\s+/g;
  if (defaultExportRegex.test(content)) {
    fileIssues.push({
      type: 'defaultExport',
      message: 'Contains export default that should be replaced with named exports'
    });
    issues.defaultExports++;
  }
  
  // Check for inconsistent import patterns
  const importLines = content.match(/import\s+.*?from\s+['"].*?['"]/g) || [];
  const importPatterns = importLines.map(line => {
    if (line.includes('{') && line.includes('}')) return 'named';
    if (line.includes('* as')) return 'namespace';
    return 'default';
  });
  
  if (new Set(importPatterns).size > 1) {
    fileIssues.push({
      type: 'inconsistentImports',
      message: 'Contains inconsistent import patterns'
    });
    issues.inconsistentImports++;
  }
  
  issues.total += fileIssues.length;
  
  return fileIssues.length > 0 ? fileIssues : null;
}

// Fix module issues in a file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fileFixed = false;
  
  // Replace require with import
  const requireRegex = /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g;
  if (requireRegex.test(content)) {
    content = content.replace(requireRegex, 'import $1 from \'$2\'');
    fixes.requireToImport++;
    fileFixed = true;
  }
  
  // Replace module.exports with export
  const moduleExportsRegex = /module\.exports\s*=\s*{([^}]*)}/g;
  if (moduleExportsRegex.test(content)) {
    content = content.replace(moduleExportsRegex, (match, exportContent) => {
      const exports = exportContent.split(',')
        .map(exp => exp.trim())
        .filter(exp => exp)
        .map(exp => {
          const parts = exp.split(':').map(p => p.trim());
          if (parts.length === 1) return `export const ${parts[0]} = ${parts[0]};`;
          return `export const ${parts[0]} = ${parts[1]};`;
        })
        .join('\n');
      return exports;
    });
    fixes.moduleExportsToExport++;
    fileFixed = true;
  }
  
  // Only write if changes were made
  if (fileFixed && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixes.total++;
    return true;
  }
  
  return false;
}

// Run ESLint to identify module issues
function runEslintCheck() {
  try {
    const cmd = `npx eslint --config .eslintrc.module.cjs "src/**/*.{ts,tsx}" --format json`;
    const result = execSync(cmd, { encoding: 'utf8' });
    
    try {
      const issues = JSON.parse(result);
      return issues;
    } catch (e) {
      console.error(`${COLORS.red}Failed to parse ESLint output${COLORS.reset}`);
      return [];
    }
  } catch (error) {
    try {
      const issues = JSON.parse(error.stdout);
      return issues;
    } catch (e) {
      console.error(`${COLORS.red}ESLint check failed:${COLORS.reset}`, error.message);
      return [];
    }
  }
}

// Fix ESLint module issues
function fixEslintIssues() {
  try {
    const cmd = `npx eslint --config .eslintrc.module.cjs "src/**/*.{ts,tsx}" --fix`;
    execSync(cmd, { encoding: 'utf8' });
    console.log(`${COLORS.green}ESLint automated fixes applied${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}ESLint fix failed:${COLORS.reset}`, error.message);
  }
}

// Main function
function main() {
  const allFiles = getAllFiles(SRC_DIR);
  console.log(`Found ${allFiles.length} files to analyze\n`);
  
  // Manual analysis
  console.log(`${COLORS.cyan}File Analysis:${COLORS.reset}`);
  const fileIssues = {};
  
  allFiles.forEach(filePath => {
    const fileRelativePath = path.relative(ROOT_DIR, filePath);
    const fileProblems = analyzeFile(filePath);
    
    if (fileProblems) {
      fileIssues[fileRelativePath] = fileProblems;
    }
  });
  
  // Report issues
  console.log(`\n${COLORS.cyan}Issue Summary:${COLORS.reset}`);
  console.log(`- Require statements: ${issues.requireStatements}`);
  console.log(`- Module.exports: ${issues.moduleExports}`);
  console.log(`- Default exports: ${issues.defaultExports}`);
  console.log(`- Inconsistent imports: ${issues.inconsistentImports}`);
  console.log(`- Total issues: ${issues.total}`);
  
  // If in fix mode, attempt to fix issues
  if (FIX_MODE) {
    console.log(`\n${COLORS.yellow}Applying fixes...${COLORS.reset}`);
    
    let fixedFiles = 0;
    for (const filePath in fileIssues) {
      if (fixFile(path.join(ROOT_DIR, filePath))) {
        fixedFiles++;
      }
    }
    
    console.log(`\n${COLORS.green}Fix Summary:${COLORS.reset}`);
    console.log(`- Require statements converted: ${fixes.requireToImport}`);
    console.log(`- Module.exports converted: ${fixes.moduleExportsToExport}`);
    console.log(`- Files fixed: ${fixedFiles}`);
    
    // Run ESLint to fix more complex issues
    console.log(`\n${COLORS.yellow}Running ESLint to fix additional issues...${COLORS.reset}`);
    fixEslintIssues();
  } else if (CHECK_ONLY) {
    console.log(`\n${COLORS.yellow}ESLint Check:${COLORS.reset}`);
    const eslintIssues = runEslintCheck();
    
    if (eslintIssues.length === 0) {
      console.log(`${COLORS.green}No ESLint issues found${COLORS.reset}`);
    } else {
      console.log(`${COLORS.red}Found ${eslintIssues.length} files with ESLint issues${COLORS.reset}`);
      
      eslintIssues.forEach(file => {
        if (file.errorCount > 0 || file.warningCount > 0) {
          console.log(`\n${COLORS.yellow}${file.filePath}${COLORS.reset}`);
          file.messages.forEach(msg => {
            const severity = msg.severity === 2 ? COLORS.red : COLORS.yellow;
            console.log(`  ${severity}${msg.line}:${msg.column} ${msg.ruleId} - ${msg.message}${COLORS.reset}`);
          });
        }
      });
    }
  }
  
  console.log(`\n${COLORS.cyan}=== Analysis Complete ===${COLORS.reset}`);
  if (issues.total > 0 && !FIX_MODE) {
    console.log(`Run with --fix to automatically fix issues.`);
  }
}

main();