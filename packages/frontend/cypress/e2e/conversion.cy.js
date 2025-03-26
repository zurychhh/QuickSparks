describe('Conversion Page', () => {
  beforeEach(() => {
    // Mock the API responses
    cy.intercept('POST', '/api/upload', {
      statusCode: 200,
      body: {
        data: {
          conversionId: 'test-conversion-id'
        }
      },
      delay: 500
    }).as('uploadFile');
    
    cy.intercept('GET', '/api/conversion/*/status', {
      statusCode: 200,
      body: {
        status: 'completed',
        resultFile: {
          id: 'result-file-id'
        }
      },
      delay: 300
    }).as('checkStatus');
    
    cy.intercept('GET', '/api/file/*/download-token', {
      statusCode: 200,
      body: {
        downloadUrl: '/test-download-url.pdf'
      }
    }).as('getDownloadToken');
    
    // Mock the file download
    cy.intercept('GET', '/test-download-url.pdf', {
      statusCode: 200,
      body: 'test file content'
    }).as('downloadFile');
    
    // Visit the conversion page
    cy.visit('/conversion');
  });
  
  it('displays all conversion steps', () => {
    cy.contains('Select File').should('be.visible');
    cy.contains('Upload').should('be.visible');
    cy.contains('Convert').should('be.visible');
    cy.contains('Download').should('be.visible');
  });
  
  it('allows changing conversion type', () => {
    cy.get('select#conversion-type').should('be.visible');
    
    // Initially should be PDF to DOCX
    cy.get('select#conversion-type').should('have.value', 'pdf-to-docx');
    
    // Change to DOCX to PDF
    cy.get('select#conversion-type').select('docx-to-pdf');
    cy.get('select#conversion-type').should('have.value', 'docx-to-pdf');
  });
  
  it('shows feedback when conversion options are changed', () => {
    // Upload a file first to reveal the options
    cy.fixture('sample.pdf', 'base64').as('pdfFixture');
    cy.get('input[type=file]').selectFile({
      contents: '@pdfFixture',
      fileName: 'sample.pdf',
      mimeType: 'application/pdf'
    }, { force: true });
    
    // Wait for file to be accepted
    cy.contains('sample.pdf').should('be.visible');
    
    // Quality options should be visible
    cy.contains('High Quality').should('be.visible');
    cy.contains('Standard').should('be.visible');
    
    // Click on high quality option
    cy.contains('High Quality').click();
    
    // Feedback should be displayed
    cy.contains('High quality selected').should('be.visible');
    
    // Click on preserve formatting option
    cy.contains('Preserve formatting').click();
    
    // Feedback should be displayed
    cy.contains('Formatting will be preserved').should('be.visible');
  });
  
  it('shows conversion progress with feedback', () => {
    // Upload a file
    cy.fixture('sample.pdf', 'base64').as('pdfFixture');
    cy.get('input[type=file]').selectFile({
      contents: '@pdfFixture',
      fileName: 'sample.pdf',
      mimeType: 'application/pdf'
    }, { force: true });
    
    // Click convert button
    cy.contains('Convert Now').click();
    
    // Progress feedback should be visible
    cy.contains('Starting conversion process').should('be.visible');
    
    // Wait for upload to complete
    cy.wait('@uploadFile');
    
    // Processing feedback should be visible
    cy.contains('Processing your document').should('be.visible');
    
    // Wait for conversion to complete
    cy.wait('@checkStatus');
    cy.wait('@getDownloadToken');
    
    // Success feedback should be visible
    cy.contains('Conversion completed successfully').should('be.visible');
    
    // Download button should be available
    cy.contains('Download').should('be.visible');
  });
  
  it('allows canceling a conversion', () => {
    // Upload a file
    cy.fixture('sample.pdf', 'base64').as('pdfFixture');
    cy.get('input[type=file]').selectFile({
      contents: '@pdfFixture',
      fileName: 'sample.pdf',
      mimeType: 'application/pdf'
    }, { force: true });
    
    // Click convert button
    cy.contains('Convert Now').click();
    
    // Cancel button should be visible
    cy.contains('Cancel').click();
    
    // Feedback should be visible
    cy.contains('Conversion cancelled').should('be.visible');
  });
});