#!/usr/bin/env node

/**
 * Script to generate TypeScript interfaces from JSON Schema
 */

const fs = require('fs');
const path = require('path');

// Load the API schema
const apiSchema = require('../src/api-schema.json');

// Output file path
const outputFile = path.join(__dirname, '../src/generated/interfaces.ts');

// Ensure directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper function to convert JSON Schema to TypeScript
function jsonSchemaToTypeScript(schema, name) {
  let result = `export interface ${name} {\n`;
  
  // Process properties
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      let typeName = 'any';
      let comment = propSchema.description ? `  /** ${propSchema.description} */\n` : '';
      
      // Generate property type
      if (propSchema.type === 'string') {
        if (propSchema.enum) {
          typeName = propSchema.enum.map(v => `'${v}'`).join(' | ');
        } else if (propSchema.format === 'date-time') {
          typeName = 'string';
        } else {
          typeName = 'string';
        }
      } else if (propSchema.type === 'number') {
        typeName = 'number';
      } else if (propSchema.type === 'boolean') {
        typeName = 'boolean';
      } else if (propSchema.type === 'object') {
        // Nested object
        const nestedName = `${name}_${propName.charAt(0).toUpperCase() + propName.slice(1)}`;
        typeName = nestedName;
        
        // Recursively process nested objects
        if (propSchema.properties) {
          result = `${jsonSchemaToTypeScript(propSchema, nestedName)}\n${result}`;
        }
      } else if (propSchema.type === 'array') {
        if (propSchema.items.type === 'string') {
          typeName = 'string[]';
        } else if (propSchema.items.type === 'number') {
          typeName = 'number[]';
        } else if (propSchema.items.type === 'boolean') {
          typeName = 'boolean[]';
        } else {
          typeName = 'any[]';
        }
      }
      
      // Check if property is required
      const isRequired = schema.required && schema.required.includes(propName);
      const optionalMarker = isRequired ? '' : '?';
      
      // Add nullable annotation
      if (propSchema.nullable) {
        typeName = `${typeName} | null`;
      }
      
      // Add property to interface
      result += `${comment}  ${propName}${optionalMarker}: ${typeName};\n`;
    }
  }
  
  result += '}';
  return result;
}

// Generate TypeScript interfaces from schema definitions
let output = '// THIS FILE IS AUTO-GENERATED - DO NOT EDIT\n\n';

for (const [name, schema] of Object.entries(apiSchema.definitions)) {
  output += `${jsonSchemaToTypeScript(schema, name)}\n\n`;
}

// Write output file
fs.writeFileSync(outputFile, output);
console.log(`Generated TypeScript interfaces at ${outputFile}`);