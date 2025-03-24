import React, { useState, useRef, ChangeEvent } from 'react';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';

type ConversionType = 'pdf-to-docx' | 'docx-to-pdf';

const ConversionPage: React.FC = (): React.ReactElement => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<ConversionType>('pdf-to-docx');
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File): void => {
    setError('');
    
    // Validate file type based on conversion type
    if (conversionType === 'pdf-to-docx' && file.type !== 'application/pdf') {
      setError('Please select a PDF file for PDF to DOCX conversion.');
      return;
    }
    
    if (conversionType === 'docx-to-pdf' && 
        !['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'].includes(file.type)) {
      setError('Please select a DOCX or DOC file for DOCX to PDF conversion.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleBrowseClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleConversionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setConversionType(e.target.value as ConversionType);
    setSelectedFile(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to convert.');
      return;
    }
    
    setIsConverting(true);
    
    // In a real implementation, you would upload the file to your API here
    // This is a mockup for demonstration purposes
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Successfully converted
      alert('File converted successfully! In a real implementation, you would be redirected to a download page.');
    } catch (err) {
      setError('An error occurred during conversion. Please try again.');
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Convert Your Document</h1>
            <p className="mt-4 text-lg text-gray-500">
              Get high-quality document conversion with our state-of-the-art technology.
            </p>
          </div>
          
          <Card className="overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label htmlFor="conversion-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Conversion Type
                </label>
                <select
                  id="conversion-type"
                  value={conversionType}
                  onChange={handleConversionTypeChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="pdf-to-docx">PDF to DOCX</option>
                  <option value="docx-to-pdf">DOCX to PDF</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  {conversionType === 'pdf-to-docx' 
                    ? 'Convert your PDF file to an editable Word document.' 
                    : 'Convert your Word document to a PDF file.'}
                </p>
              </div>
              
              <div 
                className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                } ${selectedFile ? 'bg-primary-50 border-primary-300' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleBrowseClick}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden" 
                  accept={conversionType === 'pdf-to-docx' ? '.pdf' : '.docx,.doc'}
                />
                
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path 
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12m4-12v8m0 0v4m0-23v4m0 0h-4m4 0h4m-11 18h4" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                  
                  {selectedFile ? (
                    <div>
                      <span className="block text-sm font-medium text-gray-900">{selectedFile.name}</span>
                      <span className="block text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="block text-sm font-medium text-gray-900">
                        Drag and drop your file here, or click to browse
                      </span>
                      <span className="block text-xs text-gray-500 mt-1">
                        {conversionType === 'pdf-to-docx' 
                          ? 'PDF files up to 10MB' 
                          : 'DOCX or DOC files up to 10MB'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="mb-6 rounded-md bg-error-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-error-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-error-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  isLoading={isConverting}
                  disabled={!selectedFile || isConverting}
                  fullWidth
                >
                  {isConverting ? 'Converting...' : 'Convert Now'}
                </Button>
              </div>
              
              <div className="mt-4 text-center text-xs text-gray-500">
                By using our service you agree to our Terms of Service and Privacy Policy.
              </div>
            </form>
          </Card>
          
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Need to convert something else?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Image Conversion</h3>
                <p className="text-sm text-gray-500">Convert images between formats like JPG, PNG, WebP, and more.</p>
              </Card>
              <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <h3 className="text-lg font-medium text-gray-900 mb-2">QR Code Generation</h3>
                <p className="text-sm text-gray-500">Create QR codes for URLs, text, contact information, and more.</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionPage;