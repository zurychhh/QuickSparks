const fs = require('fs');
const path = require('path');

// Constants
const FIXTURES_DIR = path.join(__dirname);
const PDF_TYPES = ['simple', 'text_heavy', 'formatted', 'with_images', 'with_tables'];
const DOCX_TYPES = ['simple', 'text_heavy', 'formatted', 'with_images', 'with_tables'];

describe('Test Fixtures', () => {
  test('PDF test fixtures should exist and have content', () => {
    PDF_TYPES.forEach(type => {
      const fixturePath = path.join(FIXTURES_DIR, `${type}.pdf`);
      expect(fs.existsSync(fixturePath)).toBe(true);
      
      const stats = fs.statSync(fixturePath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
  
  test('DOCX test fixtures should exist and have content', () => {
    DOCX_TYPES.forEach(type => {
      const fixturePath = path.join(FIXTURES_DIR, `${type}.docx`);
      expect(fs.existsSync(fixturePath)).toBe(true);
      
      const stats = fs.statSync(fixturePath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
  
  test('README.md should exist in fixtures directory', () => {
    const readmePath = path.join(FIXTURES_DIR, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
    
    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('Test Fixtures for PDF ↔ DOCX Conversion Service');
  });
  
  test('Fixture generator script should exist', () => {
    const scriptPath = path.join(FIXTURES_DIR, 'generate-test-files.js');
    expect(fs.existsSync(scriptPath)).toBe(true);
  });
});