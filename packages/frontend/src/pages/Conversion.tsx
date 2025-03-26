import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { captureException } from '../utils/sentry';
import {
  uploadFile,
  createCancelToken,
  getConversionStatus,
  getDownloadToken,
  UploadProgress as UploadProgressType,
} from '../services/api';
import { cn } from '../utils/classnames';
import { useFeedback } from '../context/FeedbackContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FileUpload from '../components/ui/FileUpload';
import FilePreview from '../components/ui/FilePreview';
import ConversionSteps, { ConversionStep } from '../components/ui/ConversionSteps';
import ConversionOptions from '../components/ui/ConversionOptions';
// Fallback for FileViewer if the actual component isn't available
const FileViewer = ({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName: string;
  mimeType?: string;
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 border-b p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900">File Preview</h3>
          <a
            href={fileUrl}
            className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center p-2 rounded-md"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download file"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>
      <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px] bg-white">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <svg
            className="w-8 h-8 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h4 className="text-base font-medium text-gray-900 mb-2 text-center">
          {fileName || 'Your file'}
        </h4>
        <p className="text-sm text-gray-500 mb-4 text-center px-2">
          Click the download button to save your converted file.
        </p>
        <a
          href={fileUrl}
          className="inline-flex items-center px-5 py-3 sm:px-4 sm:py-2 border border-transparent text-base sm:text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform hover:scale-105 transition-transform duration-200"
          download
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download File
        </a>
      </div>
    </div>
  );
};
import UploadProgress from '../components/ui/UploadProgress';
import PaymentRequiredDownload from '../components/ui/PaymentRequiredDownload';
// import { usePaymentStore } from '../store/subscriptionStore';

type ConversionType = 'pdf-to-docx' | 'docx-to-pdf';

interface ConversionOptionsType {
  conversionType: ConversionType;
  quality: 'standard' | 'high';
  preserveFormatting: boolean;
}

const ConversionPage: React.FC = (): React.ReactElement => {
  const { conversionId } = useParams<{ conversionId?: string }>();
  const feedbackContext = useFeedback(); // Move useFeedback hook to component level
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<ConversionType>('pdf-to-docx');
  const [conversionOptions, setConversionOptions] = useState<ConversionOptionsType>({
    conversionType: 'pdf-to-docx',
    quality: 'high',
    preserveFormatting: true,
  });
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'success' | 'error'
  >('idle');
  const [currentConversionId, setCurrentConversionId] = useState<string | null>(
    conversionId || null,
  );
  const [currentStep, setCurrentStep] = useState<ConversionStep>('select');
  const cancelTokenRef = useRef(createCancelToken());
  // const { fetchPaymentStatus } = usePaymentStore();

  // Reset cancel token on unmount
  useEffect(() => {
    return () => {
      cancelTokenRef.current.cancel('Component unmounted');
    };
  }, []);

  // Update current step based on the conversion state
  useEffect(() => {
    if (!selectedFile) {
      setCurrentStep('select');
    } else if (uploadStatus === 'uploading') {
      setCurrentStep('upload');
    } else if (uploadStatus === 'processing') {
      setCurrentStep('convert');
    } else if (uploadStatus === 'success') {
      setCurrentStep('download');
    }
  }, [selectedFile, uploadStatus]);

  // Load existing conversion if ID is provided in URL
  useEffect(() => {
    if (conversionId) {
      // Fetch conversion status
      const fetchConversion = async () => {
        try {
          setIsConverting(true);
          setUploadStatus('processing');
          setCurrentStep('convert');

          const statusResponse = await getConversionStatus(conversionId);
          const status = statusResponse.data.status;

          if (status === 'completed') {
            // Get download token (this will be protected by payment verification on backend)
            try {
              const tokenResponse = await getDownloadToken(statusResponse.data.resultFile.id);
              const downloadUrl = tokenResponse.data.downloadUrl;
              setConvertedFileUrl(downloadUrl);
              setUploadStatus('success');
              setCurrentStep('download');
            } catch (err) {
              // If we get a 402 Payment Required error, we don't show it as an error
              // The payment component will handle this case
              if (
                err &&
                typeof err === 'object' &&
                'response' in err &&
                err.response &&
                typeof err.response === 'object' &&
                'status' in err.response &&
                err.response.status === 402
              ) {
                setUploadStatus('success');
                setCurrentStep('download');
              } else {
                throw err;
              }
            }
          } else if (status === 'failed') {
            setError(`Conversion failed: ${statusResponse.data.error || 'Unknown error'}`);
            setUploadStatus('error');
          } else {
            // It's still processing, set up polling
            // Similar to handleConvert logic
            const pollInterval = setInterval(async () => {
              try {
                const updatedResponse = await getConversionStatus(conversionId);
                const updatedStatus = updatedResponse.data.status;

                if (updatedStatus === 'completed') {
                  clearInterval(pollInterval);
                  setUploadStatus('success');
                  setCurrentStep('download');

                  // Get download token (may require payment)
                  try {
                    const tokenResponse = await getDownloadToken(
                      updatedResponse.data.resultFile.id,
                    );
                    const downloadUrl = tokenResponse.data.downloadUrl;
                    setConvertedFileUrl(downloadUrl);
                  } catch (e) {
                    // If payment required, we don't show an error
                    if (
                      e &&
                      typeof e === 'object' &&
                      'response' in e &&
                      e.response &&
                      typeof e.response === 'object' &&
                      'status' in e.response &&
                      e.response.status !== 402
                    ) {
                      throw e;
                    }
                  }
                } else if (updatedStatus === 'failed') {
                  clearInterval(pollInterval);
                  setError(`Conversion failed: ${updatedResponse.data.error || 'Unknown error'}`);
                  setUploadStatus('error');
                }
              } catch (err) {
                console.error('Status check error:', err);
                clearInterval(pollInterval);
                setError('Failed to check conversion status. Please try again.');
                setUploadStatus('error');
              }
            }, 2000);

            // Create a cleanup function that will be called on unmount
            const cleanup = () => {
              console.log('Cleaning up polling interval');
              clearInterval(pollInterval);
              // Don't call any hooks here
            };

            // Return the cleanup function to React
            return cleanup;
          }
        } catch (err) {
          console.error('Error fetching conversion:', err);
          captureException(err);
          setError('Failed to load conversion. Please try again.');
          setUploadStatus('error');
        } finally {
          setIsConverting(false);
        }
      };

      fetchConversion();
    }
  }, [conversionId]);

  // Determine accepted file types based on conversion type
  const getAcceptedFileTypes = (): string[] => {
    if (conversionType === 'pdf-to-docx') {
      return ['application/pdf'];
    } else {
      return [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
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
    setCurrentStep('select');
  };

  // Handle option changes
  const handleOptionChange = (name: string, value: string | boolean): void => {
    setConversionOptions(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file removal
  const handleRemoveFile = (): void => {
    // Use feedbackContext from component level
    setSelectedFile(null);
    setError(null);
    setConvertedFileUrl(null);
    setCurrentStep('select');
    setUploadStatus('idle');
    setUploadProgress(null);

    // Show feedback for file removal
    feedbackContext.showFeedback('info', 'File removed. Select a new file to convert.', 3000);
  };

  // Handle conversion
  const handleConvert = async (): Promise<void> => {
    if (!selectedFile) return;

    // Get the feedback context
    const feedbackContext = useFeedback();

    setIsConverting(true);
    setError(null);
    setUploadStatus('uploading');
    setUploadProgress(null);
    setCurrentStep('upload');

    // Show conversion start feedback
    feedbackContext.showFeedback('info', 'Starting conversion process...', 2000);

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
        onProgress: progress => {
          setUploadProgress(progress);

          // Show progress feedback at key milestones
          if (progress.percentage === 25) {
            feedbackContext.showFeedback('info', 'Uploading file (25%)...', 1500);
          } else if (progress.percentage === 50) {
            feedbackContext.showFeedback('info', 'Uploading file (50%)...', 1500);
          } else if (progress.percentage === 75) {
            feedbackContext.showFeedback('info', 'Uploading file (75%)...', 1500);
          }

          // Mark as processing after upload is complete
          if (progress.percentage === 100) {
            setUploadStatus('processing');
            setCurrentStep('convert');

            // Show processing feedback
            feedbackContext.showFeedback(
              'loading',
              'Processing your document...',
              0,
              true, // Keep visible until processing completes
            );
          }
        },
        onSuccess: async response => {
          // Get conversion ID from response
          const conversionId = response.data?.data?.conversionId;

          if (conversionId) {
            // Save the conversion ID for later use
            setCurrentConversionId(conversionId);

            // Start polling for conversion status
            const pollInterval = setInterval(async () => {
              try {
                const statusResponse = await getConversionStatus(conversionId);
                const status = statusResponse.data.status;

                if (status === 'completed') {
                  clearInterval(pollInterval);

                  // Hide the loading feedback
                  feedbackContext.hideFeedback();

                  // Get download token - this may fail with 402 if payment is required
                  try {
                    const tokenResponse = await getDownloadToken(statusResponse.data.resultFile.id);
                    const downloadUrl = tokenResponse.data.downloadUrl;

                    setConvertedFileUrl(downloadUrl);
                    setUploadStatus('success');
                    setIsConverting(false);
                    setCurrentStep('download');

                    // Show success feedback
                    feedbackContext.showFeedback(
                      'success',
                      'Conversion completed successfully!',
                      5000,
                    );
                  } catch (err) {
                    // Handle payment required case
                    if (
                      err &&
                      typeof err === 'object' &&
                      'response' in err &&
                      err.response &&
                      typeof err.response === 'object' &&
                      'status' in err.response &&
                      err.response.status === 402
                    ) {
                      setUploadStatus('success');
                      setIsConverting(false);
                      setCurrentStep('download');

                      // Show payment required feedback
                      feedbackContext.showFeedback(
                        'info',
                        'Your file is ready for download after payment',
                        5000,
                      );
                    } else {
                      throw err;
                    }
                  }
                } else if (status === 'failed') {
                  clearInterval(pollInterval);
                  const errorMsg = `Conversion failed: ${statusResponse.data.error || 'Unknown error'}`;
                  setError(errorMsg);
                  setUploadStatus('error');
                  setIsConverting(false);

                  // Hide the loading feedback and show error
                  feedbackContext.hideFeedback();
                  feedbackContext.showFeedback('error', errorMsg, 5000);
                }
                // Keep polling if status is 'pending' or 'processing'
              } catch (err) {
                console.error('Status check error:', err);
                clearInterval(pollInterval);
                const errorMsg = 'Failed to check conversion status. Please try again.';
                setError(errorMsg);
                setUploadStatus('error');
                setIsConverting(false);

                // Hide the loading feedback and show error
                feedbackContext.hideFeedback();
                feedbackContext.showFeedback('error', errorMsg, 5000);
              }
            }, 2000); // Poll every 2 seconds

            // Store interval ID for cleanup
            const currentIntervalId = pollInterval;
            
            // Create a cleanup function to handle unmounting
            const cleanupInterval = () => {
              if (currentIntervalId) {
                clearInterval(currentIntervalId);
                feedbackContext.hideFeedback();
              }
            };
            
            // Add the cleanup function to component unmount
            useEffect(() => {
              return cleanupInterval;
            }, []);
          } else {
            const errorMsg = 'Invalid server response. Please try again.';
            setError(errorMsg);
            setUploadStatus('error');
            setIsConverting(false);

            // Hide the loading feedback and show error
            feedbackContext.hideFeedback();
            feedbackContext.showFeedback('error', errorMsg, 5000);
          }
        },
        onError: err => {
          console.error('Conversion error:', err);
          captureException(err);
          const errorMsg = 'An error occurred during conversion. Please try again.';
          setError(errorMsg);
          setUploadStatus('error');
          setIsConverting(false);

          // Hide the loading feedback and show error
          feedbackContext.hideFeedback();
          feedbackContext.showFeedback('error', errorMsg, 5000);
        },
      });
    } catch (err) {
      console.error('Conversion error:', err);
      captureException(err);
      const errorMsg = 'An error occurred during conversion. Please try again.';
      setError(errorMsg);
      setUploadStatus('error');
      setIsConverting(false);

      // Hide the loading feedback and show error
      feedbackContext.hideFeedback();
      feedbackContext.showFeedback('error', errorMsg, 5000);
    }
  };

  // Handle download
  const handleDownload = (): void => {
    if (!convertedFileUrl) return;

    const feedbackContext = useFeedback();

    // Show download started feedback
    feedbackContext.showFeedback(
      'success',
      'Download started! Your file will open in a new tab.',
      4000,
    );

    // For API URLs with tokens, navigate to the URL
    // This will trigger the browser download dialog
    window.open(convertedFileUrl, '_blank');
  };

  // Check if payment is required and download is ready
  const isDownloadReady = (): boolean => {
    return uploadStatus === 'success' && !isConverting;
  };

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 sm:text-4xl">
              Convert Your Document
            </h1>
            <p className="mt-3 text-base md:text-lg text-gray-500 max-w-2xl mx-auto">
              Get high-quality document conversion with our state-of-the-art technology.
            </p>
          </div>

          {/* Steps indicator */}
          <ConversionSteps currentStep={currentStep} className="mb-6 md:mb-8" />

          <Card className="overflow-hidden shadow-md">
            <div className="p-4 md:p-6 lg:p-8">
              {/* Conversion Type Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="conversion-type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Document Conversion Type
                  </label>
                  {conversionType === 'pdf-to-docx' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      PDF → DOCX
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      DOCX → PDF
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    id="conversion-type"
                    value={conversionType}
                    onChange={handleConversionTypeChange}
                    className={cn(
                      'block w-full pl-3 pr-10 py-3 text-base border focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm rounded-lg transition-colors',
                      isConverting
                        ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                        : 'border-gray-300 hover:border-gray-400',
                    )}
                    disabled={isConverting}
                  >
                    <option value="pdf-to-docx">Convert PDF to Word Document (DOCX)</option>
                    <option value="docx-to-pdf">Convert Word Document (DOCX) to PDF</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 text-primary-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {conversionType === 'pdf-to-docx'
                    ? 'Transform your PDF into an editable Word document with our high-precision converter.'
                    : 'Create professional PDF documents from your Word files with perfect formatting.'}
                </p>
              </div>

              {/* File Upload Area (when no file selected) */}
              {!selectedFile ? (
                <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6">
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Upload Your File</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {conversionType === 'pdf-to-docx'
                        ? 'Select a PDF file to convert to an editable Word document'
                        : 'Select a Word document to convert to PDF format'}
                    </p>
                  </div>

                  <FileUpload
                    onFileAccepted={handleFileAccepted}
                    onFileRejected={handleFileRejected}
                    acceptedFileTypes={getAcceptedFileTypes()}
                    maxSize={10 * 1024 * 1024} // 10MB
                    label=""
                    dropzoneText={
                      conversionType === 'pdf-to-docx'
                        ? 'Upload your PDF file'
                        : 'Upload your Word document'
                    }
                    className="mb-0"
                    highlightActive={true}
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-start">
                      {/* File Preview Section */}
                      <div className="mb-6 sm:mb-4 sm:w-full md:w-1/3 md:pr-4">
                        <FilePreview
                          file={selectedFile}
                          onRemove={handleRemoveFile}
                          onConvert={handleConvert} // Add the missing prop
                          isConverting={isConverting}
                          className="mb-0"
                          showConvertButton={false}
                        />
                      </div>

                      {/* Conversion Options Section */}
                      <div className="sm:w-full md:w-2/3 md:pl-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3 md:mb-4">
                          Conversion Settings
                        </h3>
                        <ConversionOptions
                          conversionType={conversionOptions.conversionType}
                          quality={conversionOptions.quality}
                          preserveFormatting={conversionOptions.preserveFormatting}
                          onOptionChange={handleOptionChange}
                          disabled={isConverting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress indicator when converting */}
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

                  {/* Error message display */}
                  {error && (
                    <div className="mb-6 rounded-md bg-error-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-error-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-error-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conversion success and download section */}
                  {convertedFileUrl && (
                    <div className="mb-6">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <svg
                                className="h-6 w-6 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-medium text-green-800">
                              Conversion Successful!
                            </h3>
                            <p className="text-sm text-green-700 mt-1">
                              Your file has been successfully converted and is ready for download.
                            </p>
                          </div>
                          {currentConversionId ? (
                            <PaymentRequiredDownload
                              conversionId={currentConversionId}
                              onDownload={handleDownload}
                              disableButton={!convertedFileUrl}
                            />
                          ) : (
                            <Button
                              variant="primary"
                              size="md"
                              onClick={handleDownload}
                              disabled={!convertedFileUrl}
                              className="flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Download
                            </Button>
                          )}
                        </div>
                      </div>

                      <FileViewer
                        fileUrl={convertedFileUrl}
                        fileName={selectedFile?.name || 'Your Converted File'}
                      />

                      {/* Payment section if needed */}
                      {currentConversionId && !convertedFileUrl && isDownloadReady() && (
                        <div className="mt-6 p-6 border rounded-lg bg-white shadow-sm">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Ready to Download
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Your conversion is complete and ready for download after payment.
                          </p>
                          <PaymentRequiredDownload
                            conversionId={currentConversionId}
                            onDownload={handleDownload}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Convert button section */}
                  {!convertedFileUrl && (
                    <div className="flex flex-col md:flex-row justify-center space-y-3 md:space-y-0 md:space-x-3">
                      <Button
                        onClick={handleConvert}
                        variant="primary"
                        size="lg"
                        isLoading={isConverting}
                        disabled={!selectedFile || isConverting}
                        fullWidth
                        className="flex items-center justify-center min-h-[48px] text-base sm:text-sm px-6 py-4 sm:px-5 sm:py-3"
                        animate={true}
                      >
                        {isConverting ? (
                          <>
                            {uploadStatus === 'processing' ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span className="hidden sm:inline">Processing Document...</span>
                                <span className="sm:hidden">Processing...</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span className="hidden sm:inline">Uploading File...</span>
                                <span className="sm:hidden">Uploading...</span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Convert Now
                          </>
                        )}
                      </Button>

                      {isConverting && (
                        <Button
                          variant="outline"
                          size="lg"
                          className="md:w-auto text-base sm:text-sm px-6 py-4 sm:px-5 sm:py-3"
                          onClick={() => {
                            cancelTokenRef.current.cancel('Cancelled by user');
                            setIsConverting(false);
                            setUploadStatus('idle');

                            // Show feedback for cancellation
                            const feedbackContext = useFeedback();
                            feedbackContext.showFeedback('info', 'Conversion cancelled', 2000);
                          }}
                          animate={true}
                        >
                          <svg
                            className="w-5 h-5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Secure conversion • Files are protected with encryption
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  By using our service you agree to our{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </Card>

          {/* Additional conversion options */}
          <div className="mt-8 sm:mt-10 md:mt-12">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 px-1">
              Need to convert something else?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-5 hover:bg-gray-50 transition-all cursor-pointer hover:shadow-md active:scale-98 duration-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                      Image Conversion
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Convert images between JPG, PNG, WebP and more formats.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 sm:p-5 hover:bg-gray-50 transition-all cursor-pointer hover:shadow-md active:scale-98 duration-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-green-100 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                      QR Code Generator
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Create QR codes for URLs, text, contact information, or WiFi.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 sm:p-5 hover:bg-gray-50 transition-all cursor-pointer hover:shadow-md active:scale-98 duration-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                      PDF Tools
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Merge, split, compress, and unlock PDF files easily.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionPage;
