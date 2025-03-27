/**
 * 07-FRONTEND_KOMPONENTY_UI.js
 * 
 * This file contains frontend UI components.
 */

// FileUpload Component
// ================
// packages/frontend/src/components/ui/FileUpload.tsx
const fileUploadComponent = `
import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  acceptedFileTypes: string[];
  maxFileSize: number;
  selectedFile: File | null;
}

/**
 * File upload component with drag-and-drop functionality
 */
const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  acceptedFileTypes,
  maxFileSize,
  selectedFile
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate accepted file extensions for display
  const fileExtensions = acceptedFileTypes.map(type => {
    if (type === 'application/pdf') return 'PDF';
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (type === 'application/msword') return 'DOC';
    return type.split('/')[1].toUpperCase();
  });
  
  // File validation
  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      setError(\`Invalid file type. Accepted types: \${fileExtensions.join(', ')}\`);
      return false;
    }
    
    // Check file size
    if (file.size > maxFileSize) {
      setError(\`File is too large. Maximum size is \${maxFileSize / (1024 * 1024)}MB\`);
      return false;
    }
    
    setError('');
    return true;
  };
  
  // Handle file selection from input
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (validateFile(file)) {
      onFileSelected(file);
    }
  };
  
  // Handle file drop
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (validateFile(file)) {
      onFileSelected(file);
    }
  };
  
  // Handle drag events
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };
  
  // Open file dialog when clicking on drop zone
  const handleDropZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileChange}
      />
      
      {/* Drop zone */}
      <div
        className={\`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors \${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }\`}
        onClick={handleDropZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div>
            <div className="flex items-center justify-center mb-4">
              <svg 
                className="h-12 w-12 text-indigo-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button 
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                onFileSelected(selectedFile);
              }}
            >
              Select a different file
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center mb-4">
              <svg 
                className="h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">
              Drag & drop your file here, or click to select
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Accepted file types: {fileExtensions.join(', ')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Maximum file size: {maxFileSize / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
`;

// ConversionOptions Component
// =======================
// packages/frontend/src/components/ui/ConversionOptions.tsx
const conversionOptionsComponent = `
import React from 'react';

interface ConversionOptionsProps {
  conversionType: 'pdf-to-docx' | 'docx-to-pdf';
  options: {
    quality: string;
    preserveImages: boolean;
    preserveFormatting: boolean;
    [key: string]: any;
  };
  onChange: (options: any) => void;
}

/**
 * Component for selecting conversion options
 */
const ConversionOptions: React.FC<ConversionOptionsProps> = ({
  conversionType,
  options,
  onChange
}) => {
  const handleQualityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ quality: event.target.value });
  };
  
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    onChange({ [name]: checked });
  };
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Options</h3>
      
      <div className="space-y-4">
        {/* Quality selection */}
        <div>
          <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1">
            Output Quality
          </label>
          <select
            id="quality"
            name="quality"
            value={options.quality}
            onChange={handleQualityChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="low">Low (Faster conversion, smaller file size)</option>
            <option value="medium">Medium (Balanced quality and speed)</option>
            <option value="high">High (Best quality, larger file size)</option>
          </select>
        </div>
        
        {/* Preserve images option */}
        <div className="flex items-center">
          <input
            id="preserveImages"
            name="preserveImages"
            type="checkbox"
            checked={options.preserveImages}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="preserveImages" className="ml-2 block text-sm text-gray-700">
            Preserve images and graphics
          </label>
        </div>
        
        {/* Preserve formatting option */}
        <div className="flex items-center">
          <input
            id="preserveFormatting"
            name="preserveFormatting"
            type="checkbox"
            checked={options.preserveFormatting}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="preserveFormatting" className="ml-2 block text-sm text-gray-700">
            Preserve text formatting and layout
          </label>
        </div>
        
        {/* Conditional options based on conversion type */}
        {conversionType === 'pdf-to-docx' && (
          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">PDF to DOCX Options</h4>
            
            <div className="flex items-center">
              <input
                id="extractTables"
                name="extractTables"
                type="checkbox"
                checked={options.extractTables || false}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="extractTables" className="ml-2 block text-sm text-gray-700">
                Extract and convert tables
              </label>
            </div>
          </div>
        )}
        
        {conversionType === 'docx-to-pdf' && (
          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">DOCX to PDF Options</h4>
            
            <div className="flex items-center">
              <input
                id="optimizeForPrinting"
                name="optimizeForPrinting"
                type="checkbox"
                checked={options.optimizeForPrinting || false}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="optimizeForPrinting" className="ml-2 block text-sm text-gray-700">
                Optimize for printing
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversionOptions;
`;

// UploadProgress Component
// ===================
// packages/frontend/src/components/ui/UploadProgress.tsx
const uploadProgressComponent = `
import React from 'react';

interface UploadProgressProps {
  uploadProgress: number;
  conversionProgress: number;
}

/**
 * Component for displaying file upload and conversion progress
 */
const UploadProgress: React.FC<UploadProgressProps> = ({
  uploadProgress,
  conversionProgress
}) => {
  // Determine current step
  const isUploading = uploadProgress < 100;
  const isConverting = uploadProgress === 100 && conversionProgress < 100;
  const isCompleted = uploadProgress === 100 && conversionProgress === 100;
  
  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        {isUploading 
          ? 'Uploading your file...' 
          : isConverting 
            ? 'Converting your document...' 
            : 'Conversion complete!'}
      </h3>
      
      {/* Upload progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">
            Upload
          </span>
          <span className="text-sm font-medium text-gray-700">
            {uploadProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: \`\${uploadProgress}%\` }}
          ></div>
        </div>
      </div>
      
      {/* Conversion progress (only show when upload is complete) */}
      {!isUploading && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">
              Conversion
            </span>
            <span className="text-sm font-medium text-gray-700">
              {conversionProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full" 
              style={{ width: \`\${conversionProgress}%\` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Status message */}
      <p className="text-sm text-gray-500 text-center">
        {isUploading 
          ? 'Uploading your file to our secure servers...' 
          : isConverting 
            ? 'Processing your document. This may take a few moments...' 
            : 'Finalizing your document...'}
      </p>
    </div>
  );
};

export default UploadProgress;
`;

// FilePreview Component
// =================
// packages/frontend/src/components/ui/FilePreview.tsx
const filePreviewComponent = `
import React from 'react';

interface FilePreviewProps {
  thumbnailUrl: string;
  filename: string;
  conversionType: 'pdf-to-docx' | 'docx-to-pdf';
}

/**
 * Component for displaying file thumbnail and conversion details
 */
const FilePreview: React.FC<FilePreviewProps> = ({
  thumbnailUrl,
  filename,
  conversionType
}) => {
  // Clean filename and append appropriate extension for converted file
  const cleanFilename = filename.replace(/\\.[^/.]+$/, ''); // Remove extension
  const convertedExtension = conversionType === 'pdf-to-docx' ? 'docx' : 'pdf';
  const convertedFilename = \`\${cleanFilename}.\${convertedExtension}\`;
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Your file has been converted successfully!
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Your document has been converted from 
          {conversionType === 'pdf-to-docx' ? ' PDF to DOCX' : ' DOCX to PDF'}.
        </p>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 w-full max-w-xs">
        {/* Thumbnail preview */}
        <div className="mb-4 aspect-w-4 aspect-h-5 overflow-hidden rounded border border-gray-300">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt="Document preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg 
                className="h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
          )}
        </div>
        
        {/* File details */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 truncate" title={convertedFilename}>
            {convertedFilename}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Click the download button below to save your file
          </p>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
`;

// PaymentRequiredDownload Component
// ============================
// packages/frontend/src/components/ui/PaymentRequiredDownload.tsx
const paymentRequiredDownloadComponent = `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import apiConfig from '../../config/api.config';

interface PaymentRequiredDownloadProps {
  conversionId: string;
  onPaymentComplete: (downloadUrl: string) => void;
  isAuthenticated: boolean;
}

/**
 * Component for handling premium downloads that require payment
 */
const PaymentRequiredDownload: React.FC<PaymentRequiredDownloadProps> = ({
  conversionId,
  onPaymentComplete,
  isAuthenticated
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  
  // Handle redirect to checkout page
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      // Redirect to login page with return URL
      navigate(\`/login?redirect=/conversion&conversion_id=\${conversionId}\`);
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Create checkout session
      const response = await apiService.post(
        \`\${apiConfig.endpoints.payment}/create-checkout\`,
        {
          conversionId,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }
      );
      
      // Redirect to Stripe checkout
      window.location.href = response.data.checkoutUrl;
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create checkout session');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="mt-8 w-full max-w-md mx-auto bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-6">
        <svg 
          className="h-12 w-12 text-indigo-500 mx-auto" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m0 0V9m0 6h6m-6 0H6" 
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-800 mt-2">
          Premium Conversion
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          This file requires a one-time payment to download
        </p>
      </div>
      
      {/* Feature list */}
      <ul className="space-y-2 mb-6">
        <li className="flex items-center">
          <svg 
            className="h-5 w-5 text-green-500 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          <span className="text-sm text-gray-700">High-quality conversion</span>
        </li>
        <li className="flex items-center">
          <svg 
            className="h-5 w-5 text-green-500 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          <span className="text-sm text-gray-700">Perfect formatting preservation</span>
        </li>
        <li className="flex items-center">
          <svg 
            className="h-5 w-5 text-green-500 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          <span className="text-sm text-gray-700">No watermarks</span>
        </li>
        <li className="flex items-center">
          <svg 
            className="h-5 w-5 text-green-500 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          <span className="text-sm text-gray-700">30-day access to your converted file</span>
        </li>
      </ul>
      
      {/* Price and checkout button */}
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900 mb-4">$2.99</p>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : isAuthenticated ? 'Pay & Download' : 'Login to Continue'}
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          Secure payment processed by Stripe. By proceeding, you agree to our 
          <a href="/terms" className="text-indigo-600 hover:text-indigo-800 ml-1">
            Terms of Service
          </a>.
        </p>
      </div>
    </div>
  );
};

export default PaymentRequiredDownload;
`;