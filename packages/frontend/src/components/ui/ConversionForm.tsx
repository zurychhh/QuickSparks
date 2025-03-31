import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import FileUpload from './FileUpload';
import FilePreview from './FilePreview';
import ConversionSteps, { ConversionStep } from './ConversionSteps';
import ConversionOptions from './ConversionOptions';
import PaymentRequiredDownload from './PaymentRequiredDownload';
import apiService, { UploadProgress as UploadProgressType } from '../../services/apiService';
import { sanitize, isSafeUrl } from '../../utils/sanitize';
import { validateFileBeforeUpload, getAcceptedFileTypes } from '../../utils/fileValidation';
import { usePaymentStore } from '../../store/subscriptionStore';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ServiceStatus from './ServiceStatus';

interface ConversionFormProps {
  initialFileUrl?: string;
  initialConversionId?: string;
}

/**
 * Comprehensive conversion form with robust error handling and fallbacks
 */
const ConversionForm: React.FC<ConversionFormProps> = ({ 
  initialFileUrl,
  initialConversionId
}) => {
  // Navigation
  const navigate = useNavigate();
  
  // Error handling
  const { handleError } = useErrorHandler();
  const { setApiError, clearError } = usePaymentStore(state => ({
    setApiError: state.setApiError,
    clearError: state.clearError
  }));
  
  // Component state
  const [file, setFile] = useState<File | null>(null);
  const [isConversionTypeSelected, setIsConversionTypeSelected] = useState<boolean>(false);
  const [conversionType, setConversionType] = useState<'pdf-to-docx' | 'docx-to-pdf'>('pdf-to-docx');
  const [conversionOptions, setConversionOptions] = useState({
    quality: 'high',
    preserveImages: true,
    preserveFormatting: true
  });
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<ConversionStep>('select');
  const [conversionId, setConversionId] = useState<string | null>(initialConversionId || null);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(initialFileUrl || null);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [isPaymentRequired, setIsPaymentRequired] = useState<boolean>(false);
  
  // Refs
  const cancelTokenRef = useRef<any>(null);
  const statusPollerRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Get accepted file types based on conversion direction
  const acceptedFileTypes = getAcceptedFileTypes(conversionType);
  
  // Cleanup function
  const cleanup = () => {
    // Cancel any ongoing uploads
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Operation canceled by user');
      cancelTokenRef.current = null;
    }
    
    // Stop status polling
    if (statusPollerRef.current) {
      statusPollerRef.current.stop();
      statusPollerRef.current = null;
    }
    
    // Close WebSocket connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return cleanup;
  }, []);
  
  // Handle initial conversionId if provided
  useEffect(() => {
    if (initialConversionId && !conversionId) {
      setConversionId(initialConversionId);
      
      // If we have an ID but no URL, fetch the status
      if (!initialFileUrl) {
        setCurrentStep('converting');
        setIsConverting(true);
        checkConversionStatus(initialConversionId);
      } else {
        // We have both ID and URL - show completed state
        setCurrentStep('complete');
        setConvertedFileUrl(initialFileUrl);
      }
    }
  }, [initialConversionId, initialFileUrl]);
  
  // Handle file selection
  const handleFileSelect = (selectedFile: File | null) => {
    // Reset state
    setFile(selectedFile);
    setUploadProgress(null);
    setIsUploading(false);
    setIsConverting(false);
    setConversionId(null);
    setConvertedFileUrl(null);
    setCurrentStep('select');
    clearError();
    
    // Cancel any ongoing operations
    cleanup();
    
    if (selectedFile) {
      try {
        // Validate file
        validateFileBeforeUpload(selectedFile, conversionType);
        
        // Show file details panel with conversion options
        setCurrentStep('configure');
      } catch (error) {
        // Show validation error
        setApiError(error.message);
        setFile(null);
      }
    }
  };
  
  // Check conversion status
  const checkConversionStatus = async (id: string) => {
    try {
      const response = await apiService.getConversionStatus(id);
      
      if (response?.data) {
        const status = response.data.status;
        setConversionStatus(status);
        
        // Update progress if available
        if (response.data.progress !== undefined) {
          setConversionProgress(response.data.progress);
        }
        
        // Handle different status conditions
        if (status === 'completed') {
          // Get download URL if conversion is complete
          handleConversionComplete(id);
        } else if (status === 'failed' || status === 'error') {
          setApiError(response.data.message || 'Conversion failed. Please try again.');
          setIsConverting(false);
          setCurrentStep('select');
        } else if (status === 'processing' || status === 'pending') {
          // Continue polling for updates if still in progress
          setTimeout(() => checkConversionStatus(id), 2000);
        }
      }
    } catch (error) {
      handleError(error, 'Error checking conversion status');
      
      // Continue polling despite errors, with some backoff
      setTimeout(() => checkConversionStatus(id), 5000);
    }
  };
  
  // Handle conversion complete
  const handleConversionComplete = async (id: string) => {
    try {
      const downloadResponse = await apiService.getDownloadToken(id);
      
      if (downloadResponse?.data) {
        // Check if payment is required
        if (downloadResponse.data.paymentRequired) {
          setIsPaymentRequired(true);
          setCurrentStep('complete');
          setIsConverting(false);
          return;
        }
        
        // Set download URL if available
        if (downloadResponse.data.downloadUrl) {
          setConvertedFileUrl(downloadResponse.data.downloadUrl);
          setCurrentStep('complete');
          setIsConverting(false);
          
          // Update URL to include conversion ID for bookmarking/sharing
          navigate(`/convert/${id}`, { replace: true });
        } else {
          throw new Error('Download URL not found in response');
        }
      }
    } catch (error) {
      handleError(error, 'Error getting download link');
      setIsConverting(false);
      setCurrentStep('select');
    }
  };
  
  // Handle conversion start
  const handleConvert = async () => {
    if (!file) {
      setApiError('Please select a file first.');
      return;
    }
    
    // Set up for upload
    setIsUploading(true);
    setUploadProgress(null);
    setCurrentStep('uploading');
    clearError();
    
    // Create cancel token
    cancelTokenRef.current = apiService.createCancelToken();
    
    try {
      // First check API health
      const healthStatus = await apiService.checkHealth();
      
      if (!healthStatus.isHealthy) {
        throw new Error('Conversion service is currently unavailable. Please try again later.');
      }
      
      // Do the upload
      await apiService.uploadFileForConversion({
        file,
        additionalData: {
          conversionType,
          ...conversionOptions
        },
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        onSuccess: (data) => {
          // Handle successful upload
          setIsUploading(false);
          setIsConverting(true);
          setCurrentStep('converting');
          
          if (data.conversionId) {
            setConversionId(data.conversionId);
            
            // Start checking status
            checkConversionStatus(data.conversionId);
          }
        },
        onError: (error) => {
          handleError(error, 'File upload failed');
          setIsUploading(false);
          setCurrentStep('configure');
        },
        cancelToken: cancelTokenRef.current.token
      });
    } catch (error) {
      handleError(error, 'Conversion failed');
      setIsUploading(false);
      setCurrentStep('configure');
    }
  };
  
  // Handle cancel upload
  const handleCancelUpload = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Upload canceled by user');
      cancelTokenRef.current = null;
    }
    
    setIsUploading(false);
    setCurrentStep('configure');
  };
  
  // Handle conversion options change
  const handleOptionsChange = (options: any) => {
    setConversionOptions({
      ...conversionOptions,
      ...options
    });
  };
  
  // Handle conversion type change
  const handleConversionTypeChange = (type: 'pdf-to-docx' | 'docx-to-pdf') => {
    setConversionType(type);
    setIsConversionTypeSelected(true);
    setFile(null);
  };
  
  // Handle restart conversion
  const handleRestartConversion = () => {
    setFile(null);
    setUploadProgress(null);
    setIsUploading(false);
    setIsConverting(false);
    setConversionId(null);
    setConvertedFileUrl(null);
    setConversionStatus(null);
    setConversionProgress(0);
    setIsPaymentRequired(false);
    setCurrentStep('select');
    clearError();
    
    // Clean up any ongoing operations
    cleanup();
    
    // Update URL to remove conversion ID
    navigate('/convert', { replace: true });
  };
  
  // Render appropriate content based on current step
  const renderContent = () => {
    // If payment is required
    if (isPaymentRequired && conversionId) {
      return (
        <PaymentRequiredDownload 
          conversionId={conversionId}
          onConversionRestart={handleRestartConversion}
        />
      );
    }
    
    // Based on current step
    switch (currentStep) {
      case 'select':
        return (
          <div className="space-y-6">
            {!isConversionTypeSelected ? (
              <div className="conversion-type-selection space-y-4">
                <h2 className="text-xl font-medium text-gray-800">Choose Conversion Type</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    className="flex-1 p-6 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
                    onClick={() => handleConversionTypeChange('pdf-to-docx')}
                  >
                    <h3 className="text-lg font-medium">PDF to Word (DOCX)</h3>
                    <p className="text-gray-600 mt-2">Convert PDF documents to editable Word format</p>
                  </button>
                  <button
                    className="flex-1 p-6 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
                    onClick={() => handleConversionTypeChange('docx-to-pdf')}
                  >
                    <h3 className="text-lg font-medium">Word (DOCX) to PDF</h3>
                    <p className="text-gray-600 mt-2">Convert Word documents to PDF format</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium text-gray-800">
                    {conversionType === 'pdf-to-docx' ? 'PDF to Word (DOCX)' : 'Word (DOCX) to PDF'}
                  </h2>
                  <button
                    className="text-sm text-primary-600 hover:text-primary-700"
                    onClick={() => setIsConversionTypeSelected(false)}
                  >
                    Change
                  </button>
                </div>
                <FileUpload
                  accept={acceptedFileTypes}
                  onFileSelect={handleFileSelect}
                />
              </div>
            )}
            
            {/* API Health Status */}
            <ServiceStatus />
          </div>
        );
        
      case 'configure':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-gray-800">Configure Conversion</h2>
            
            {file && (
              <FilePreview 
                file={file}
                onRemove={() => handleFileSelect(null)}
              />
            )}
            
            <ConversionOptions
              conversionType={conversionType}
              options={conversionOptions}
              onChange={handleOptionsChange}
            />
            
            <div className="flex justify-end space-x-4">
              <Button 
                variant="secondary"
                onClick={handleRestartConversion}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleConvert}
                disabled={!file}
              >
                Convert Now
              </Button>
            </div>
          </div>
        );
        
      case 'uploading':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-gray-800">Uploading File</h2>
            
            {file && (
              <FilePreview 
                file={file}
                disabled
              />
            )}
            
            {/* Upload Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress ? `${uploadProgress.percentage}%` : '0%'}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ 
                    width: uploadProgress ? `${uploadProgress.percentage}%` : '0%'
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {uploadProgress && (
                  <span>
                    {Math.round(uploadProgress.loaded / 1024 / 1024 * 100) / 100} MB of {Math.round(uploadProgress.total / 1024 / 1024 * 100) / 100} MB
                  </span>
                )}
              </div>
            </div>
            
            <Button 
              variant="secondary"
              onClick={handleCancelUpload}
            >
              Cancel Upload
            </Button>
          </div>
        );
        
      case 'converting':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-gray-800">Converting Your File</h2>
            
            {/* Conversion Progress */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
                <div className="text-center">
                  <p className="font-medium">{conversionStatus || 'Processing'}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    This may take a few minutes depending on file size and complexity
                  </p>
                </div>
                
                {conversionProgress > 0 && (
                  <div className="space-y-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all duration-300"
                        style={{ width: `${conversionProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-right text-gray-500">
                      {conversionProgress}%
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <p>You can safely close this window. We'll email you when the conversion is complete.</p>
            </div>
          </div>
        );
        
      case 'complete':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-gray-800">Conversion Complete</h2>
            
            {convertedFileUrl && (
              <div className="p-6 border border-gray-200 rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-center text-green-500">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-medium">Your file has been successfully converted</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Click the button below to download your file
                    </p>
                  </div>
                  
                  <div className="flex justify-center pt-2">
                    {isSafeUrl(convertedFileUrl) ? (
                      <a
                        href={convertedFileUrl}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download File
                      </a>
                    ) : (
                      <div className="text-red-500">Invalid download URL</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center">
              <Button 
                variant="secondary"
                onClick={handleRestartConversion}
              >
                Convert Another File
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="conversion-form bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Conversion Steps Progress */}
      <ConversionSteps currentStep={currentStep} />
      
      {/* Main content area */}
      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default ConversionForm;