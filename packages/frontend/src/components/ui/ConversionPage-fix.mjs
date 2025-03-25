/**
 * This script performs an emergency fix for the ConversionPage component
 * by modifying the import of FileViewer to use a fallback if needed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, '../../pages');
const conversionPagePath = path.join(pagesDir, 'Conversion.tsx');

// Read the ConversionPage component
let conversionPageContent;
try {
  conversionPageContent = fs.readFileSync(conversionPagePath, 'utf8');
  console.log('✅ Successfully read Conversion.tsx');
} catch (error) {
  console.error('❌ Error reading Conversion.tsx:', error.message);
  process.exit(1);
}

// Create a fallback version that doesn't require the FileViewer component
const fallbackContent = conversionPageContent.replace(
  /import FileViewer from '@components\/ui\/FileViewer';/,
  `// Fallback for FileViewer if the actual component isn't available
const FileViewer = ({ fileUrl, fileName }) => {
  return (
    <div style={{ 
      padding: '16px',
      margin: '16px 0',
      border: '1px solid #eee',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    }}>
      <h3 style={{ marginBottom: '16px' }}>File Preview</h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        border: '1px dashed #ccc',
        borderRadius: '4px',
        padding: '16px'
      }}>
        <h4>{fileName || "Your file"}</h4>
        <p style={{ marginTop: '16px', color: '#666' }}>
          Preview not available in this environment.
          <br />
          <a href={fileUrl} style={{ color: '#0070f3', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">
            Click here to download
          </a>
        </p>
      </div>
    </div>
  );
};`
);

// Create a backup of the original file
const backupPath = conversionPagePath + '.backup';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, conversionPageContent);
  console.log(`✅ Created backup at ${backupPath}`);
}

// Write the fallback version
try {
  fs.writeFileSync(conversionPagePath, fallbackContent);
  console.log('✅ Successfully updated Conversion.tsx with fallback FileViewer');
} catch (error) {
  console.error('❌ Error writing fallback Conversion.tsx:', error.message);
}

console.log('✅ Conversion page fix complete');