// data-validation-test.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create test reports directory
const reportsDir = path.join(__dirname, '..', '..', 'test-reports', 'data-validation');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Sample data validation schema for export
export const fileSchema = {
  name: {
    type: 'string',
    required: true,
    minLength: 1
  },
  size: {
    type: 'number',
    required: true,
    min: 0
  },
  type: {
    type: 'string',
    required: true,
    enum: ['pdf', 'docx', 'doc', 'txt']
  },
  lastModified: {
    type: 'number',
    required: false
  }
};

export const conversionSchema = {
  id: {
    type: 'string',
    required: true,
    minLength: 5
  },
  status: {
    type: 'string',
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed']
  },
  progress: {
    type: 'number',
    required: false,
    min: 0,
    max: 100
  },
  result: {
    type: 'object',
    required: false
  }
};

// Validation function - exported for reuse in real backend tests
export function validateObject(obj, schema) {
  const errors = [];

  Object.entries(schema).forEach(([field, rules]) => {
    // Check required fields
    if (rules.required && (obj[field] === undefined || obj[field] === null)) {
      errors.push(`Field '${field}' is required but missing`);
      return;
    }

    // Skip validation for undefined optional fields
    if (obj[field] === undefined) {
      return;
    }

    // Type validation
    if (rules.type && typeof obj[field] !== rules.type) {
      errors.push(`Field '${field}' should be of type ${rules.type}, but got ${typeof obj[field]}`);
    }

    // String validations
    if (rules.type === 'string') {
      if (rules.minLength && obj[field].length < rules.minLength) {
        errors.push(`Field '${field}' should have a minimum length of ${rules.minLength}`);
      }
      if (rules.enum && !rules.enum.includes(obj[field])) {
        errors.push(`Field '${field}' must be one of [${rules.enum.join(', ')}], but got '${obj[field]}'`);
      }
    }

    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && obj[field] < rules.min) {
        errors.push(`Field '${field}' must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && obj[field] > rules.max) {
        errors.push(`Field '${field}' must be at most ${rules.max}`);
      }
    }
  });

  return errors;
}

// Data for testing - exported for use in other files
export const sampleFileData = [
  {
    name: 'sample-document.pdf',
    size: 1024,
    type: 'pdf',
    lastModified: Date.now()
  },
  {
    name: 'document.docx',
    size: 2048,
    type: 'docx',
    lastModified: Date.now()
  },
  {
    name: '', // Invalid - empty name
    size: 1024,
    type: 'pdf',
    lastModified: Date.now()
  },
  {
    name: 'doc.pdf',
    size: -5, // Invalid - negative size
    type: 'pdf',
    lastModified: Date.now()
  },
  {
    name: 'doc.xyz', // Invalid - unsupported type
    size: 1024,
    type: 'xyz',
    lastModified: Date.now()
  }
];

export const sampleConversionData = [
  {
    id: 'conv-123456',
    status: 'pending',
    progress: 0
  },
  {
    id: 'conv-789012',
    status: 'processing',
    progress: 45
  },
  {
    id: 'conv-345678',
    status: 'completed',
    progress: 100,
    result: {
      url: 'https://example.com/output/conv-345678.docx'
    }
  },
  {
    id: 'conv-901234',
    status: 'failed',
    error: 'File format not supported'
  },
  {
    id: 'x', // Invalid - too short
    status: 'unknown', // Invalid - unknown status
    progress: 150 // Invalid - exceeds maximum
  }
];

// This function runs standalone validation tests against real data
export async function validateRealData(fileData, conversionData) {
  const testResults = {
    file: {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    },
    conversion: {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    }
  };
  
  // Validate file data
  if (fileData && Array.isArray(fileData)) {
    fileData.forEach((file, index) => {
      testResults.file.total++;
      const errors = validateObject(file, fileSchema);
      
      if (errors.length > 0) {
        testResults.file.failed++;
        testResults.file.details.push({
          sample: index + 1,
          data: file,
          errors,
          status: 'failed'
        });
      } else {
        testResults.file.passed++;
        testResults.file.details.push({
          sample: index + 1,
          data: file,
          status: 'passed'
        });
      }
    });
  }
  
  // Validate conversion data
  if (conversionData && Array.isArray(conversionData)) {
    conversionData.forEach((conversion, index) => {
      testResults.conversion.total++;
      const errors = validateObject(conversion, conversionSchema);
      
      if (errors.length > 0) {
        testResults.conversion.failed++;
        testResults.conversion.details.push({
          sample: index + 1,
          data: conversion,
          errors,
          status: 'failed'
        });
      } else {
        testResults.conversion.passed++;
        testResults.conversion.details.push({
          sample: index + 1,
          data: conversion,
          status: 'passed'
        });
      }
    });
  }
  
  return testResults;
}

// Export main test function for direct CLI usage
export async function runDataValidationTests() {
  console.log('Starting Data Validation Tests...');
  console.log('This module is meant to be imported by run-validation-tests.js');
  console.log('Run npm run test:data-validation to execute the tests');
  return true;
}

// Allow running directly
if (import.meta.url === fileURLToPath(import.meta.url)) {
  runDataValidationTests().then(() => {
    console.log('Data validation module loaded successfully');
  }).catch(err => {
    console.error('Error in data validation module:', err);
  });
}