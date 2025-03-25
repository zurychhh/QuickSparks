import React, { useState, useRef, useEffect } from 'react';
import { captureException } from '@utils/sentry';
import { uploadFile, createCancelToken, UploadProgress as UploadProgressType } from '@services/api';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import FileUpload from '@components/ui/FileUpload';
import FilePreview from '@components/ui/FilePreview';
import UploadProgress from '@components/ui/UploadProgress';

type ConversionType = 'pdf-to-docx' | 'docx-to-pdf';

interface ConversionOptions {
  conversionType: ConversionType;
  quality?: 'standard' | 'high';
  preserveFormatting?: boolean;
}

const ConversionPage: React.FC = (): React.ReactElement => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<ConversionType>('pdf-to-docx');
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({
    conversionType: 'pdf-to-docx',
    quality: 'high',
    preserveFormatting: true,
  });
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const cancelTokenRef = useRef(createCancelToken());
  
  // Reset cancel token on unmount
  useEffect(() => {
    return () => {
      cancelTokenRef.current.cancel('Component unmounted');
    };
  }, []);

  // Determine accepted file types based on conversion type
  const getAcceptedFileTypes = (): string[] => {
    if (conversionType === 'pdf-to-docx') {
      return ['application/pdf'];
    } else {
      return ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    }
  };

  // Handle file selection
  const handleFileAccepted = (file: File): void => {
    setSelectedFile(file);
    setError(null);
    setConvertedFileUrl(null);
  };

  // Handle file rejection
  const handleFileRejected = (errors: Array<{ code: string; message: string }>): void => {
    console.error('File rejected:', errors);
    setError(errors[0]?.message || 'File upload error');
  };

  // Handle conversion type change
  const handleConversionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newType = e.target.value as ConversionType;
    setConversionType(newType);
    setConversionOptions(prev => ({ ...prev, conversionType: newType }));
    setSelectedFile(null);
    setError(null);
    setConvertedFileUrl(null);
  };

  // Handle option changes
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, type, checked, value } = e.target;
    setConversionOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle file removal
  const handleRemoveFile = (): void => {
    setSelectedFile(null);
    setError(null);
    setConvertedFileUrl(null);
  };

  // Handle conversion
  const handleConvert = async (): Promise<void> => {
    if (!selectedFile) return;

    setIsConverting(true);
    setError(null);
    setUploadStatus('uploading');
    setUploadProgress(null);
    
    // Reset cancel token
    cancelTokenRef.current = createCancelToken();

    try {
      // Upload the file with progress tracking
      uploadFile({
        file: selectedFile,
        additionalData: {
          conversionType: conversionOptions.conversionType,
          quality: conversionOptions.quality || 'high',
          preserveFormatting: String(conversionOptions.preserveFormatting),
        },
        cancelToken: cancelTokenRef.current,
        onProgress: (progress) => {
          setUploadProgress(progress);
          
          // Simulate processing after upload is complete
          if (progress.percentage === 100) {
            setUploadStatus('processing');
          }
        },
        onSuccess: async (response) => {
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // In a real implementation, you would get the converted file URL from the response
          // For demo, create a blob URL from the original file
          const fakeUrl = URL.createObjectURL(new Blob([selectedFile], { type: selectedFile.type }));
          setConvertedFileUrl(fakeUrl);
          setUploadStatus('success');
          setIsConverting(false);
        },
        onError: (err) => {
          console.error('Conversion error:', err);
          captureException(err);
          setError('An error occurred during conversion. Please try again.');
          setUploadStatus('error');
          setIsConverting(false);
        }
      });
    } catch (err) {
      console.error('Conversion error:', err);
      captureException(err);
      setError('An error occurred during conversion. Please try again.');
      setUploadStatus('error');
      setIsConverting(false);
    }
  };

  // Handle download
  const handleDownload = (): void => {
    if (!convertedFileUrl) return;
    
    // Create a download link and click it
    const link = document.createElement('a');
    link.href = convertedFileUrl;
    link.download = `converted_${selectedFile?.name || 'file'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="conversion-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Conversion Type
                </label>
                <select
                  id="conversion-type"
                  value={conversionType}
                  onChange={handleConversionTypeChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  disabled={isConverting}
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
              
              {!selectedFile ? (
                <FileUpload
                  onFileAccepted={handleFileAccepted}
                  onFileRejected={handleFileRejected}
                  acceptedFileTypes={getAcceptedFileTypes()}
                  maxSize={10 * 1024 * 1024} // 10MB
                  label="Upload your file"
                  dropzoneText="Drag & drop your file here, or click to browse"
                  className="mb-6"
                />
              ) : (
                <div className="mb-6">
                  <FilePreview
                    file={selectedFile}
                    onRemove={handleRemoveFile}
                    onConvert={handleConvert}
                    isConverting={isConverting}
                    className="mb-4"
                  />
                  
                  <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Conversion Options</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          id="quality-high"
                          name="quality"
                          type="radio"
                          value="high"
                          checked={conversionOptions.quality === 'high'}
                          onChange={handleOptionChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          disabled={isConverting}
                        />
                        <label htmlFor="quality-high" className="ml-3 text-sm text-gray-700">
                          High Quality (Recommended)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="quality-standard"
                          name="quality"
                          type="radio"
                          value="standard"
                          checked={conversionOptions.quality === 'standard'}
                          onChange={handleOptionChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          disabled={isConverting}
                        />
                        <label htmlFor="quality-standard" className="ml-3 text-sm text-gray-700">
                          Standard Quality (Faster)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="preserve-formatting"
                          name="preserveFormatting"
                          type="checkbox"
                          checked={conversionOptions.preserveFormatting}
                          onChange={handleOptionChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          disabled={isConverting}
                        />
                        <label htmlFor="preserve-formatting" className="ml-3 text-sm text-gray-700">
                          Preserve formatting (fonts, layout, styles)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
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
              
              {convertedFileUrl && (
                <div className="mb-6 rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-green-700">Conversion completed successfully!</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleDownload}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              )}
              
              {uploadProgress && isConverting && (
                <div className="mb-6">
                  <UploadProgress 
                    progress={uploadProgress.percentage} 
                    fileName={selectedFile?.name}
                    fileSize={selectedFile?.size}
                    status={uploadStatus}
                    error={error || undefined}
                  />
                </div>
              )}
              
              {selectedFile && !convertedFileUrl && (
                <div className="flex justify-center">
                  <Button 
                    onClick={handleConvert}
                    variant="primary" 
                    size="lg" 
                    isLoading={isConverting}
                    disabled={!selectedFile || isConverting}
                    fullWidth
                  >
                    {isConverting ? (
                      uploadStatus === 'processing' ? 'Processing...' : 'Uploading...'
                    ) : 'Convert Now'}
                  </Button>
                  
                  {isConverting && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="ml-2"
                      onClick={() => {
                        cancelTokenRef.current.cancel('Cancelled by user');
                        setIsConverting(false);
                        setUploadStatus('idle');
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )}
              
              <div className="mt-4 text-center text-xs text-gray-500">
                By using our service you agree to our Terms of Service and Privacy Policy.
              </div>
            </div>
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