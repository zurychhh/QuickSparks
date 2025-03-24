/**
 * PDF Service Test Environment
 * 
 * This service provides a test environment for comparing different PDF conversion libraries
 * in terms of quality, performance, and features.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Import conversion pipeline and quality metrics
const { 
  convertPdfToDocx,
  convertDocxToPdf,
  compareConverters
} = require('./conversion-pipeline');
const qualityMetrics = require('./quality-metrics');

// Setup storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only PDF and DOCX files
    const allowedFileTypes = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only PDF and DOCX files are allowed'));
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create Express app
const app = express();
app.use(express.json());

// Create needed directories if they don't exist
const outputsDir = path.join(__dirname, '../outputs');
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Serve static files
app.use('/outputs', express.static(outputsDir));
app.use('/reports', express.static(reportsDir));
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'pdf-service-test',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Conversion endpoints
app.post('/convert/pdf-to-docx', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const converter = req.body.library || 'default'; // Default or specific converter
    
    // Start measuring the total API response time (includes file reading/writing)
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;

    // Use the conversion pipeline
    const result = await convertPdfToDocx(filePath, {
      outputDir: outputsDir,
      converter: converter,
      assessQuality: req.body.evaluateQuality === 'true'
    });

    // End measuring total API performance
    const hrtime = process.hrtime(startTime);
    const executionTime = hrtime[0] * 1000 + hrtime[1] / 1000000; // ms
    const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024; // MB

    // Get file stats
    const stats = fs.statSync(result.outputPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

    res.json({
      success: true,
      inputFile: req.file.originalname,
      outputFile: path.basename(result.outputPath),
      outputUrl: `/outputs/${path.basename(result.outputPath)}`,
      conversionTime: result.conversionTime,
      performance: {
        executionTime,
        memoryUsed,
        fileSizeInMB
      },
      quality: result.quality,
      library: result.converter
    });
  } catch (error) {
    console.error('Error converting PDF to DOCX:', error);
    res.status(500).json({ error: 'Failed to convert PDF to DOCX', details: error.message });
  }
});

app.post('/convert/docx-to-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const converter = req.body.library || 'default'; // Default or specific converter
    
    // Start measuring the total API response time
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;

    // Use the conversion pipeline
    const result = await convertDocxToPdf(filePath, {
      outputDir: outputsDir,
      converter: converter,
      assessQuality: req.body.evaluateQuality === 'true'
    });

    // End measuring total API performance
    const hrtime = process.hrtime(startTime);
    const executionTime = hrtime[0] * 1000 + hrtime[1] / 1000000; // ms
    const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024; // MB

    // Get file stats
    const stats = fs.statSync(result.outputPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

    res.json({
      success: true,
      inputFile: req.file.originalname,
      outputFile: path.basename(result.outputPath),
      outputUrl: `/outputs/${path.basename(result.outputPath)}`,
      conversionTime: result.conversionTime,
      performance: {
        executionTime,
        memoryUsed,
        fileSizeInMB
      },
      quality: result.quality,
      library: result.converter
    });
  } catch (error) {
    console.error('Error converting DOCX to PDF:', error);
    res.status(500).json({ error: 'Failed to convert DOCX to PDF', details: error.message });
  }
});

// Compare conversion quality endpoint
app.post('/compare', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    // Start measuring total API performance
    const startTime = process.hrtime();
    
    // Use the conversion pipeline's compare function
    const comparisonResult = await compareConverters(filePath, {
      outputDir: outputsDir
    });
    
    // End measuring total API performance
    const hrtime = process.hrtime(startTime);
    const executionTime = hrtime[0] * 1000 + hrtime[1] / 1000000; // ms
    
    // Format the results for the API response
    const formattedResults = comparisonResult.results.map(result => {
      if (!result.success) {
        return {
          library: result.converter,
          success: false,
          error: result.error
        };
      }
      
      return {
        library: result.converter,
        success: true,
        outputFile: path.basename(result.outputPath),
        outputUrl: `/outputs/${path.basename(result.outputPath)}`,
        conversionTime: result.conversionTime,
        quality: result.quality,
        performance: {
          conversionTime: result.conversionTime,
          // Add other performance metrics if available
        }
      };
    });
    
    // Generate visual comparison report if requested
    if (req.body.generateVisualReport === 'true' && formattedResults.some(r => r.success)) {
      try {
        const successfulResult = formattedResults.find(r => r.success);
        const outputFilePath = path.join(outputsDir, successfulResult.outputFile);
        
        const conversionType = comparisonResult.inputType === 'pdf' ? 'pdf-to-docx' : 'docx-to-pdf';
        
        const reportPath = await qualityMetrics.generateVisualComparison(
          filePath,
          outputFilePath,
          conversionType
        );
        
        const reportUrl = `/reports/${path.basename(reportPath)}`;
        
        // Add report URL to response
        formattedResults = formattedResults.map(r => ({
          ...r,
          reportUrl: r.success ? reportUrl : null
        }));
      } catch (error) {
        console.error('Error generating visual comparison:', error);
      }
    }
    
    res.json({
      inputFile: req.file.originalname,
      inputType: comparisonResult.inputType,
      outputType: comparisonResult.outputType,
      totalExecutionTime: executionTime,
      results: formattedResults
    });
    
  } catch (error) {
    console.error('Error in comparison:', error);
    res.status(500).json({ error: 'Failed to compare conversions', details: error.message });
  }
});

// Performance test endpoint
app.post('/performance-test', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const iterations = parseInt(req.body.iterations) || 3;
    
    // Limit iterations to a reasonable number
    const maxIterations = 10;
    const testIterations = Math.min(iterations, maxIterations);
    
    let results = [];
    
    if (fileExt === '.pdf') {
      // Test PDF to DOCX converters
      const libraries = ['pdf-lib', 'pdf2json', 'pdfjs'];
      
      for (const lib of libraries) {
        try {
          const iterationResults = [];
          
          for (let i = 0; i < testIterations; i++) {
            // Start measuring
            const startTime = process.hrtime();
            const startMemory = process.memoryUsage().heapUsed;
            
            // Run conversion
            let result;
            switch(lib) {
              case 'pdf-lib':
                result = await pdfLibConverter.pdfToDocx(filePath);
                break;
              case 'pdf2json':
                result = await pdf2jsonConverter.pdfToDocx(filePath);
                break;
              case 'pdfjs':
                result = await pdfjsConverter.pdfToDocx(filePath);
                break;
            }
            
            // End measuring
            const hrtime = process.hrtime(startTime);
            const executionTime = hrtime[0] * 1000 + hrtime[1] / 1000000; // ms
            const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024; // MB
            
            iterationResults.push({
              iteration: i + 1,
              executionTime,
              memoryUsed,
              outputFile: result.fileName
            });
          }
          
          // Calculate stats
          const executionTimes = iterationResults.map(r => r.executionTime);
          const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
          const minExecutionTime = Math.min(...executionTimes);
          const maxExecutionTime = Math.max(...executionTimes);
          
          // Standard deviation
          const variance = executionTimes.reduce((a, b) => a + Math.pow(b - avgExecutionTime, 2), 0) / executionTimes.length;
          const stdDevExecutionTime = Math.sqrt(variance);
          
          // Memory usage
          const memoryUsages = iterationResults.map(r => r.memoryUsed);
          const avgMemoryUsed = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
          
          results.push({
            library: lib,
            iterations: testIterations,
            results: iterationResults,
            stats: {
              avgExecutionTime,
              minExecutionTime,
              maxExecutionTime,
              stdDevExecutionTime,
              avgMemoryUsed
            }
          });
        } catch (error) {
          results.push({
            library: lib,
            success: false,
            error: error.message
          });
        }
      }
    } else if (fileExt === '.docx') {
      // Test DOCX to PDF converters
      try {
        const iterationResults = [];
        
        for (let i = 0; i < testIterations; i++) {
          // Start measuring
          const startTime = process.hrtime();
          const startMemory = process.memoryUsage().heapUsed;
          
          // Run conversion
          const result = await mammothConverter.docxToPdf(filePath);
          
          // End measuring
          const hrtime = process.hrtime(startTime);
          const executionTime = hrtime[0] * 1000 + hrtime[1] / 1000000; // ms
          const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024; // MB
          
          iterationResults.push({
            iteration: i + 1,
            executionTime,
            memoryUsed,
            outputFile: result.fileName
          });
        }
        
        // Calculate stats
        const executionTimes = iterationResults.map(r => r.executionTime);
        const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
        const minExecutionTime = Math.min(...executionTimes);
        const maxExecutionTime = Math.max(...executionTimes);
        
        // Standard deviation
        const variance = executionTimes.reduce((a, b) => a + Math.pow(b - avgExecutionTime, 2), 0) / executionTimes.length;
        const stdDevExecutionTime = Math.sqrt(variance);
        
        // Memory usage
        const memoryUsages = iterationResults.map(r => r.memoryUsed);
        const avgMemoryUsed = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
        
        results.push({
          library: 'mammoth',
          iterations: testIterations,
          results: iterationResults,
          stats: {
            avgExecutionTime,
            minExecutionTime,
            maxExecutionTime,
            stdDevExecutionTime,
            avgMemoryUsed
          }
        });
      } catch (error) {
        results.push({
          library: 'mammoth',
          success: false,
          error: error.message
        });
      }
    }
    
    // Save performance test results
    const resultDir = path.join(__dirname, '../results');
    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }
    
    const resultPath = path.join(resultDir, `performance-${Date.now()}.json`);
    fs.writeFileSync(resultPath, JSON.stringify({
      inputFile: req.file.originalname,
      timestamp: new Date().toISOString(),
      results
    }, null, 2));
    
    res.json({
      inputFile: req.file.originalname,
      results,
      resultFile: path.basename(resultPath)
    });
    
  } catch (error) {
    console.error('Error in performance test:', error);
    res.status(500).json({ error: 'Failed to run performance test', details: error.message });
  }
});

// Quality assessment endpoint
app.post('/quality-assessment', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const originalFilePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    if (!req.body.comparisonFile) {
      return res.status(400).json({ error: 'No comparison file specified' });
    }
    
    const comparisonFilePath = path.join(outputsDir, req.body.comparisonFile);
    if (!fs.existsSync(comparisonFilePath)) {
      return res.status(404).json({ error: 'Comparison file not found' });
    }
    
    const comparisonFileExt = path.extname(req.body.comparisonFile).toLowerCase();
    
    let quality;
    let reportPath;
    
    if (fileExt === '.pdf' && comparisonFileExt === '.docx') {
      // PDF to DOCX quality assessment
      quality = await qualityMetrics.evaluatePdfToDocxQuality(
        originalFilePath,
        comparisonFilePath
      );
      
      reportPath = await qualityMetrics.generateVisualComparison(
        originalFilePath,
        comparisonFilePath,
        'pdf-to-docx'
      );
    } else if (fileExt === '.docx' && comparisonFileExt === '.pdf') {
      // DOCX to PDF quality assessment
      quality = await qualityMetrics.evaluateDocxToPdfQuality(
        originalFilePath,
        comparisonFilePath
      );
      
      reportPath = await qualityMetrics.generateVisualComparison(
        originalFilePath,
        comparisonFilePath,
        'docx-to-pdf'
      );
    } else {
      return res.status(400).json({ error: 'Invalid file type combination' });
    }
    
    res.json({
      originalFile: req.file.originalname,
      comparisonFile: req.body.comparisonFile,
      quality,
      reportUrl: `/reports/${path.basename(reportPath)}`
    });
    
  } catch (error) {
    console.error('Error in quality assessment:', error);
    res.status(500).json({ error: 'Failed to assess quality', details: error.message });
  }
});

// Start the server
const PORT = process.env.PDF_TEST_SERVICE_PORT || 3010;
app.listen(PORT, () => {
  console.log(`PDF Service Test running on port ${PORT}`);
  console.log(`Web interface available at http://localhost:${PORT}`);
  console.log(`API endpoints available at:`);
  console.log(`- http://localhost:${PORT}/convert/pdf-to-docx`);
  console.log(`- http://localhost:${PORT}/convert/docx-to-pdf`);
  console.log(`- http://localhost:${PORT}/compare`);
  console.log(`- http://localhost:${PORT}/performance-test`);
  console.log(`- http://localhost:${PORT}/quality-assessment`);
});

module.exports = app;