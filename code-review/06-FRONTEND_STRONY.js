/**
 * 06-FRONTEND_STRONY.js
 * 
 * This file contains frontend page components.
 */

// Conversion Page Component
// =====================
// packages/frontend/src/pages/Conversion.tsx
const conversionPage = `
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import FileUpload from '../components/ui/FileUpload';
import ConversionOptions from '../components/ui/ConversionOptions';
import ConversionSteps from '../components/ui/ConversionSteps';
import UploadProgress from '../components/ui/UploadProgress';
import FilePreview from '../components/ui/FilePreview';
import PaymentRequiredDownload from '../components/ui/PaymentRequiredDownload';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAnalytics';
import apiService from '../services/api';
import apiConfig from '../config/api.config';
import websocketService from '../services/websocket';

// Conversion step enum
enum ConversionStep {
  UPLOAD = 'upload',
  CONVERTING = 'converting',
  PREVIEW = 'preview',
  DOWNLOAD = 'download',
}

/**
 * Conversion page component for file conversion functionality
 */
const ConversionPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [conversionId, setConversionId] = useState<string>('');
  const [conversionType, setConversionType] = useState<'pdf-to-docx' | 'docx-to-pdf'>('pdf-to-docx');
  const [currentStep, setCurrentStep] = useState<ConversionStep>(ConversionStep.UPLOAD);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [conversionOptions, setConversionOptions] = useState({
    quality: 'high',
    preserveImages: true,
    preserveFormatting: true,
  });
  const [error, setError] = useState<string>('');
  const [paymentRequired, setPaymentRequired] = useState<boolean>(false);
  
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const analytics = useAnalytics();
  
  // Effect to subscribe to websocket updates
  useEffect(() => {
    if (!conversionId) return;
    
    // Connect to WebSocket for real-time updates
    websocketService.subscribeToConversion(conversionId, (data) => {
      // Update conversion progress
      if (data.progress) {
        setConversionProgress(data.progress);
      }
      
      // Handle conversion completion
      if (data.status === 'completed') {
        setCurrentStep(ConversionStep.PREVIEW);
        setThumbnailUrl(data.thumbnailUrl);
        setConvertedFileUrl(data.fileUrl);
        setPaymentRequired(data.paymentRequired || false);
        
        // Track conversion completion
        analytics.trackEvent('conversion_completed', {
          conversionType,
          fileSize: file?.size,
          options: conversionOptions,
        });
      }
      
      // Handle conversion error
      if (data.status === 'error') {
        setError(data.message || 'An error occurred during conversion');
        setCurrentStep(ConversionStep.UPLOAD);
        
        // Track conversion error
        analytics.trackEvent('conversion_error', {
          conversionType,
          error: data.message,
        });
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      websocketService.unsubscribeFromConversion(conversionId);
    };
  }, [conversionId, conversionType, file, analytics, conversionOptions]);
  
  // Handle file selection
  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    
    // Auto-detect conversion type based on file extension
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      setConversionType('pdf-to-docx');
    } else if (['docx', 'doc'].includes(extension || '')) {
      setConversionType('docx-to-pdf');
    }
    
    // Track file selection event
    analytics.trackEvent('file_selected', {
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
    });
  };
  
  // Handle conversion options change
  const handleOptionsChange = (options: any) => {
    setConversionOptions({
      ...conversionOptions,
      ...options,
    });
  };
  
  // Start conversion process
  const handleStartConversion = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    try {
      setCurrentStep(ConversionStep.CONVERTING);
      setUploadProgress(0);
      setConversionProgress(0);
      setError('');
      
      // Track conversion start event
      analytics.trackEvent('conversion_started', {
        conversionType,
        fileSize: file.size,
        options: conversionOptions,
      });
      
      // Upload file and start conversion
      const response = await apiService.uploadFile(
        apiConfig.endpoints.conversion,
        file,
        (percentage) => setUploadProgress(percentage),
        {
          conversionType,
          ...conversionOptions,
        }
      );
      
      // Store conversion ID for status tracking
      setConversionId(response.data.conversionId);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during upload');
      setCurrentStep(ConversionStep.UPLOAD);
      
      // Track error event
      analytics.trackEvent('upload_error', {
        error: err.response?.data?.message || 'Unknown error',
      });
    }
  };
  
  // Handle payment completion
  const handlePaymentComplete = (downloadUrl: string) => {
    setConvertedFileUrl(downloadUrl);
    setPaymentRequired(false);
    setCurrentStep(ConversionStep.DOWNLOAD);
    
    // Track payment completion
    analytics.trackEvent('payment_completed', {
      conversionId,
      conversionType,
    });
  };
  
  // Handle back button
  const handleBack = () => {
    if (currentStep === ConversionStep.CONVERTING) {
      setCurrentStep(ConversionStep.UPLOAD);
    } else if (currentStep === ConversionStep.PREVIEW || currentStep === ConversionStep.DOWNLOAD) {
      // Reset state for a new conversion
      setFile(null);
      setConversionId('');
      setConvertedFileUrl('');
      setThumbnailUrl('');
      setCurrentStep(ConversionStep.UPLOAD);
      setUploadProgress(0);
      setConversionProgress(0);
    }
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">
          Convert Your Documents
        </h1>
        
        {/* Conversion steps indicator */}
        <ConversionSteps 
          currentStep={currentStep} 
          isPaymentRequired={paymentRequired}
        />
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {/* Step content */}
        <div className="mt-8">
          {/* Upload step */}
          {currentStep === ConversionStep.UPLOAD && (
            <div>
              <FileUpload 
                onFileSelected={handleFileSelected} 
                acceptedFileTypes={
                  conversionType === 'pdf-to-docx' 
                    ? apiConfig.supportedTypes.pdf 
                    : apiConfig.supportedTypes.docx
                }
                maxFileSize={apiConfig.maxFileSize}
                selectedFile={file}
              />
              
              {file && (
                <>
                  <div className="mt-8">
                    <ConversionOptions 
                      conversionType={conversionType}
                      onChange={handleOptionsChange}
                      options={conversionOptions}
                    />
                  </div>
                  
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleStartConversion}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    >
                      Start Conversion
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Converting step */}
          {currentStep === ConversionStep.CONVERTING && (
            <div className="text-center">
              <UploadProgress 
                uploadProgress={uploadProgress}
                conversionProgress={conversionProgress}
              />
              
              <div className="mt-8">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Preview step */}
          {currentStep === ConversionStep.PREVIEW && (
            <div>
              <FilePreview 
                thumbnailUrl={thumbnailUrl} 
                filename={file?.name || ''}
                conversionType={conversionType}
              />
              
              {paymentRequired ? (
                <PaymentRequiredDownload
                  conversionId={conversionId}
                  onPaymentComplete={handlePaymentComplete}
                  isAuthenticated={isAuthenticated}
                />
              ) : (
                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-opacity-50"
                  >
                    Convert Another File
                  </button>
                  
                  <a
                    href={convertedFileUrl}
                    download
                    className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    onClick={() => {
                      setCurrentStep(ConversionStep.DOWNLOAD);
                      analytics.trackEvent('file_downloaded', {
                        conversionId,
                        conversionType,
                      });
                    }}
                  >
                    Download Converted File
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ConversionPage;
`;