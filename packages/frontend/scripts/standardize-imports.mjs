#!/usr/bin/env node

/**
 * This script helps standardize import statements and 
 * organize imports according to best practices.
 * 
 * Usage:
 *   node scripts/standardize-imports.mjs [--fix]
 * 
 * Options:
 *   --fix     Automatically fix import ordering
 */

import fs from 'fs';
import path from 'path';
import process from 'process';

// Config
const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const EXTENSIONS = ['.ts', '.tsx'];
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

console.log(`${COLORS.cyan}=== Import Statement Standardization ====${COLORS.reset}`);
console.log(`Scanning directory: ${SRC_DIR}`);
console.log(`Mode: ${FIX_MODE ? 'Fix' : 'Analysis'}\n`);

// Import categories
const IMPORT_GROUPS = {
  REACT: 1,          // React related imports
  THIRD_PARTY: 2,    // External libraries
  ABSOLUTE_INTERNAL: 3, // Absolute imports to project files (@/...)
  RELATIVE_PARENT: 4,  // Relative imports to parent directories (../../)
  RELATIVE_SIBLING: 5, // Relative imports to same directory (./)
  TYPES: 6,          // Type imports
  STYLE: 7,          // CSS/SCSS imports
  ASSETS: 8          // Images, fonts, etc.
};

// Get all TypeScript files recursively
function getTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getTypeScriptFiles(filePath, fileList);
    } else if (EXTENSIONS.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Analyze file imports and generate report
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importLines = content.match(/import\s+.*?from\s+['"].*?['"]/g) || [];
  
  if (importLines.length === 0) {
    return { 
      organized: true, 
      imports: [] 
    };
  }
  
  const imports = [];
  
  // Extract and categorize imports
  for (const line of importLines) {
    const importMatch = line.match(/import\s+(.*?)\s+from\s+['"]([^'"]+)['"]/);
    if (!importMatch) continue;
    
    const [, importStatement, importPath] = importMatch;
    const isTypeImport = line.includes('import type');
    const originalLine = line;
    
    // Categorize import
    let category;
    
    if (isTypeImport) {
      category = IMPORT_GROUPS.TYPES;
    } else if (importPath === 'react' || importPath.startsWith('react-')) {
      category = IMPORT_GROUPS.REACT;
    } else if (importPath.startsWith('@/') || importPath.startsWith('@components/') || 
               importPath.startsWith('@utils/') || importPath.startsWith('@pages/') ||
               importPath.startsWith('@services/') || importPath.startsWith('@hooks/') ||
               importPath.startsWith('@store/') || importPath.startsWith('@assets/')) {
      category = IMPORT_GROUPS.ABSOLUTE_INTERNAL;
    } else if (importPath.startsWith('..')) {
      category = IMPORT_GROUPS.RELATIVE_PARENT;
    } else if (importPath.startsWith('.')) {
      category = IMPORT_GROUPS.RELATIVE_SIBLING;
    } else if (importPath.match(/\.(css|scss|sass|less)$/)) {
      category = IMPORT_GROUPS.STYLE;
    } else if (importPath.match(/\.(png|jpe?g|gif|svg|webp|ttf|woff2?)$/)) {
      category = IMPORT_GROUPS.ASSETS;
    } else {
      category = IMPORT_GROUPS.THIRD_PARTY;
    }
    
    imports.push({
      originalLine,
      importStatement,
      importPath,
      category,
      isTypeImport,
    });
  }
  
  // Sort imports by category then by path
  const sortedImports = [...imports].sort((a, b) => {
    if (a.category !== b.category) {
      return a.category - b.category;
    }
    return a.importPath.localeCompare(b.importPath);
  });
  
  // Check if imports are already organized
  const organized = imports.every((imp, i) => 
    imp.originalLine === sortedImports[i].originalLine);
  
  return {
    organized,
    imports: sortedImports
  };
}

// Fix imports in a file
function fixImports(filePath, sortedImports) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // First, remove all existing imports
  let contentWithoutImports = content;
  for (const imp of sortedImports) {
    contentWithoutImports = contentWithoutImports.replace(imp.originalLine, '');
  }
  
  // Clean up empty lines at the beginning
  contentWithoutImports = contentWithoutImports.replace(/^\s*\n*/g, '');
  
  // Group imports by category
  const importsByCategory = {};
  
  for (const imp of sortedImports) {
    if (!importsByCategory[imp.category]) {
      importsByCategory[imp.category] = [];
    }
    importsByCategory[imp.category].push(imp.originalLine);
  }
  
  // Build the new content with organized imports
  let newImports = '';
  
  // Add each category with a blank line between categories
  Object.keys(importsByCategory)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((category) => {
      if (newImports) newImports += '\n';
      newImports += importsByCategory[category].join('\n');
    });
  
  // Final content with organized imports
  const newContent = newImports + '\n\n' + contentWithoutImports;
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  return true;
}

// Main function
function main() {
  const files = getTypeScriptFiles(SRC_DIR);
  console.log(`Found ${files.length} TypeScript files to analyze\n`);
  
  let disorganizedCount = 0;
  const disorganizedFiles = [];
  
  // Analyze all files
  files.forEach(filePath => {
    const relPath = path.relative(ROOT_DIR, filePath);
    const { organized, imports } = analyzeFile(filePath);
    
    if (!organized) {
      disorganizedCount++;
      disorganizedFiles.push({
        filePath,
        relPath,
        imports
      });
    }
  });
  
  // Report findings
  if (disorganizedCount === 0) {
    console.log(`${COLORS.green}All import statements are properly organized!${COLORS.reset}`);
  } else {
    console.log(`${COLORS.yellow}Found ${disorganizedCount} files with disorganized imports${COLORS.reset}`);
    
    // List files with disorganized imports
    disorganizedFiles.forEach(file => {
      console.log(`- ${file.relPath}`);
    });
    
    // Fix imports if requested
    if (FIX_MODE) {
      console.log(`\n${COLORS.cyan}Fixing imports...${COLORS.reset}`);
      
      let fixedCount = 0;
      disorganizedFiles.forEach(file => {
        if (fixImports(file.filePath, file.imports)) {
          fixedCount++;
          console.log(`${COLORS.green}✓${COLORS.reset} Fixed imports in ${file.relPath}`);
        }
      });
      
      console.log(`\n${COLORS.green}Fixed imports in ${fixedCount} files${COLORS.reset}`);
    } else {
      console.log(`\nRun with --fix to automatically reorganize imports.`);
    }
  }
}

main();