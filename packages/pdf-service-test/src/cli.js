#!/usr/bin/env node

/**
 * PDF Conversion CLI Tool
 * 
 * A command-line interface for using the PDF conversion pipeline.
 * 
 * Usage examples:
 *   node cli.js convert sample.pdf --to docx
 *   node cli.js convert example.docx --to pdf --converter mammoth
 *   node cli.js compare sample.pdf
 *   node cli.js batch-convert *.pdf
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

// Import conversion pipeline
const { 
  convertPdfToDocx,
  convertDocxToPdf,
  compareConverters,
  batchConvert
} = require('./conversion-pipeline');

// Define command-line interface
yargs(hideBin(process.argv))
  .command('convert <file>', 'Convert a file from one format to another', (yargs) => {
    return yargs
      .positional('file', {
        describe: 'File to convert',
        type: 'string'
      })
      .option('to', {
        alias: 't',
        describe: 'Target format (pdf or docx)',
        choices: ['pdf', 'docx'],
        demandOption: true
      })
      .option('converter', {
        alias: 'c',
        describe: 'Converter to use',
        type: 'string'
      })
      .option('output-dir', {
        alias: 'o',
        describe: 'Output directory',
        type: 'string',
        default: path.join(__dirname, '../outputs')
      })
      .option('quality', {
        alias: 'q',
        describe: 'Assess conversion quality',
        type: 'boolean',
        default: false
      });
  }, async (argv) => {
    try {
      // Verify file exists
      if (!fs.existsSync(argv.file)) {
        throw new Error(`File not found: ${argv.file}`);
      }
      
      const options = {
        outputDir: argv.outputDir,
        converter: argv.converter,
        assessQuality: argv.quality
      };
      
      // Determine conversion function based on file extension and target format
      const ext = path.extname(argv.file).toLowerCase();
      let result;
      
      if (ext === '.pdf' && argv.to === 'docx') {
        result = await convertPdfToDocx(argv.file, options);
      } else if (ext === '.docx' && argv.to === 'pdf') {
        result = await convertDocxToPdf(argv.file, options);
      } else {
        throw new Error(`Unsupported conversion: ${ext} to ${argv.to}`);
      }
      
      // Display result
      console.log('Conversion completed successfully!');
      console.log(`Input: ${result.inputPath}`);
      console.log(`Output: ${result.outputPath}`);
      console.log(`Conversion time: ${result.conversionTime}ms`);
      
      if (result.quality) {
        console.log('\nQuality Assessment:');
        console.log(`Overall: ${result.quality.overall.toFixed(2)}/100`);
        console.log('Individual Metrics:');
        
        for (const [metric, score] of Object.entries(result.quality.scores)) {
          console.log(`- ${metric}: ${score.toFixed(2)}`);
        }
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  })
  .command('compare <file>', 'Compare different converters for a file', (yargs) => {
    return yargs
      .positional('file', {
        describe: 'File to test with different converters',
        type: 'string'
      })
      .option('output-dir', {
        alias: 'o',
        describe: 'Output directory',
        type: 'string',
        default: path.join(__dirname, '../outputs')
      });
  }, async (argv) => {
    try {
      // Verify file exists
      if (!fs.existsSync(argv.file)) {
        throw new Error(`File not found: ${argv.file}`);
      }
      
      const result = await compareConverters(argv.file, {
        outputDir: argv.outputDir
      });
      
      // Display results as a table
      console.log(`\nComparing converters for: ${path.basename(argv.file)}`);
      console.log('Converter | Time (ms) | Quality | Output File');
      console.log('----------|-----------|---------|------------');
      
      for (const res of result.results) {
        if (res.success) {
          const quality = res.quality ? res.quality.overall.toFixed(2) : 'N/A';
          console.log(`${res.converter.padEnd(10)} | ${res.conversionTime.toString().padEnd(9)} | ${quality.padEnd(7)} | ${res.outputFileName}`);
        } else {
          console.log(`${res.converter.padEnd(10)} | FAILED: ${res.error}`);
        }
      }
      
      console.log('\nOutputs saved to:', argv.outputDir);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  })
  .command('batch-convert <pattern>', 'Convert multiple files', (yargs) => {
    return yargs
      .positional('pattern', {
        describe: 'File pattern to match (e.g., "*.pdf" or "docs/*.docx")',
        type: 'string'
      })
      .option('output-dir', {
        alias: 'o',
        describe: 'Output directory',
        type: 'string',
        default: path.join(__dirname, '../outputs')
      })
      .option('converter', {
        alias: 'c',
        describe: 'Converter to use',
        type: 'string'
      });
  }, async (argv) => {
    try {
      // Find files matching pattern
      const files = glob.sync(argv.pattern);
      
      if (files.length === 0) {
        throw new Error(`No files found matching pattern: ${argv.pattern}`);
      }
      
      console.log(`Found ${files.length} files to convert`);
      
      const options = {
        outputDir: argv.outputDir,
        converter: argv.converter
      };
      
      const results = await batchConvert(files, options);
      
      // Display results
      console.log('\nBatch conversion results:');
      
      let successful = 0;
      let failed = 0;
      
      for (const result of results) {
        if (result.success) {
          console.log(`✓ ${path.basename(result.inputPath)} → ${path.basename(result.outputPath)} (${result.conversionTime}ms)`);
          successful++;
        } else {
          console.log(`✗ ${path.basename(result.inputPath)}: ${result.error}`);
          failed++;
        }
      }
      
      console.log(`\nSummary: ${successful} successful, ${failed} failed`);
      console.log('Outputs saved to:', argv.outputDir);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  })
  .demandCommand(1, 'You need to specify a command')
  .help()
  .alias('help', 'h')
  .version('1.0.0')
  .alias('version', 'v')
  .argv;