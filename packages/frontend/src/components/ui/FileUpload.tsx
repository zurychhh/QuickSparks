import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../utils/classnames';
import Button from './Button';
import { useFeedback } from '../../context/FeedbackContext';

export interface FileUploadProps {
  onFileAccepted: (file: File) => void;
  onFileRejected?: (errors: Array<{ code: string; message: string }>) => void;
  acceptedFileTypes?: string[];
  maxSize?: number;
  className?: string;
  label?: string;
  dropzoneText?: string;
  errorText?: string;
  showFileTypeInfo?: boolean;
  highlightActive?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_LABEL = 'Upload File';
const DEFAULT_DROPZONE_TEXT = 'Drag & drop a file here, or click to browse';
const DEFAULT_ERROR_TEXT = 'File upload error';

// Helper function to get file extension from name
const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

// Helper function to check if file extension is valid
const isValidFileExtension = (fileName: string, acceptedTypes: string[]): boolean => {
  const extension = getFileExtension(fileName);
  
  // Map MIME types to extensions
  const mimeToExtension: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/msword': ['doc'],
  };
  
  // Get all valid extensions for the accepted MIME types
  const validExtensions = acceptedTypes.flatMap(type => mimeToExtension[type] || []);
  
  return validExtensions.includes(extension);
};

// Helper function to get friendly file type names
const getFriendlyFileType = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/msword': 'DOC',
  };

  return typeMap[mimeType] || mimeType;
};

const FileUpload: React.FC<FileUploadProps> = ({
  onFileAccepted,
  onFileRejected,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  className,
  label = DEFAULT_LABEL,
  dropzoneText = DEFAULT_DROPZONE_TEXT,
  errorText = DEFAULT_ERROR_TEXT,
  showFileTypeInfo = true,
  highlightActive = true,
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDropSuccess, setIsDropSuccess] = useState(false);
  const { showFeedback } = useFeedback();

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setUploadError(null);

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        
        // Double-check file extension matches MIME type
        if (!isValidFileExtension(file.name, acceptedFileTypes)) {
          const friendlyTypes = acceptedFileTypes.map(type => getFriendlyFileType(type)).join(', ');
          const errorMessage = `Invalid file extension. We only accept ${friendlyTypes} files.`;
          
          setUploadError(errorMessage);
          showFeedback('error', errorMessage, 5000);
          
          if (onFileRejected) {
            onFileRejected([{ code: 'file-invalid-extension', message: errorMessage }]);
          }
          return;
        }
        
        // Show animation effect
        setIsDropSuccess(true);

        // Display success feedback
        showFeedback('success', `File "${file.name}" selected successfully`, 3000);

        onFileAccepted(file);
      }

      if (fileRejections.length > 0) {
        const errors = fileRejections[0].errors;

        // Determine error type for user-friendly message
        let errorMessage = errorText;

        if (errors.some((e: any) => e.code === 'file-too-large')) {
          errorMessage = `File is too large. Maximum size: ${maxSize / (1024 * 1024)}MB`;
        } else if (errors.some((e: any) => e.code === 'file-invalid-type')) {
          const friendlyTypes = acceptedFileTypes.map(type => getFriendlyFileType(type)).join(', ');
          errorMessage = `Invalid file type. We only accept ${friendlyTypes} files.`;
        }

        setUploadError(errorMessage);

        // Show error feedback animation
        showFeedback('error', errorMessage, 5000);

        if (onFileRejected) {
          onFileRejected(errors);
        }
      }
    },
    [onFileAccepted, onFileRejected, errorText, maxSize, acceptedFileTypes, showFeedback],
  );

  // Reset success state after animation
  useEffect(() => {
    if (isDropSuccess) {
      const timer = setTimeout(() => {
        setIsDropSuccess(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDropSuccess]);

  const { getRootProps, getInputProps, isDragReject, open } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const friendlyFileTypes = acceptedFileTypes.map(type => getFriendlyFileType(type)).join(' or ');

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {showFileTypeInfo && (
            <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
              {`Accept: ${friendlyFileTypes} • Max: ${maxSize / (1024 * 1024)}MB`}
            </span>
          )}
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px]',
          isDragActive && !isDragReject && highlightActive
            ? 'border-primary-500 bg-primary-50 scale-[1.03] shadow-md'
            : '',
          isDragReject ? 'border-error-500 bg-error-50 shake-animation' : '',
          isDropSuccess ? 'border-green-500 bg-green-50 scale-[1.02]' : '',
          uploadError
            ? 'border-error-500'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm hover:shadow',
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            'text-center transition-all duration-300',
            isDropSuccess ? 'scale-105' : '',
          )}
        >
          <div
            className={cn(
              'mx-auto mb-3 flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300',
              isDragActive && !isDragReject
                ? 'bg-primary-100 scale-110 shadow-inner'
                : 'bg-gray-100',
              isDragReject ? 'bg-error-100 scale-110' : '',
              isDropSuccess ? 'bg-green-100 scale-110' : '',
            )}
          >
            <svg
              className={cn(
                'h-8 w-8 transition-all duration-300',
                isDragReject || uploadError
                  ? 'text-error-500'
                  : isDragActive && !isDragReject
                    ? 'text-primary-500 scale-110'
                    : isDropSuccess
                      ? 'text-green-500 scale-110'
                      : 'text-gray-500',
                isDropSuccess ? 'animate-bounce' : '',
              )}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isDropSuccess ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              )}
            </svg>
          </div>

          <p
            className={cn(
              'text-base font-medium transition-all duration-300',
              isDragActive && !isDragReject
                ? 'text-primary-700'
                : isDragReject
                  ? 'text-error-700'
                  : isDropSuccess
                    ? 'text-green-700'
                    : 'text-gray-700',
            )}
          >
            {isDropSuccess ? 'File selected successfully!' : dropzoneText}
          </p>

          {showFileTypeInfo && !isDropSuccess && (
            <p
              className={cn(
                'mt-2 text-sm transition-all duration-300',
                isDragActive && !isDragReject
                  ? 'text-primary-600'
                  : isDragReject
                    ? 'text-error-600'
                    : 'text-gray-500',
              )}
            >
              {`Drop your ${friendlyFileTypes} file here, or`}
            </p>
          )}
        </div>

        {uploadError && (
          <div className="mt-3 flex items-center text-error-600 rounded-md bg-error-50 px-3 py-2 animate-pulse">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium">{uploadError}</p>
          </div>
        )}

        <Button
          type="button"
          variant="primary"
          className={cn(
            'mt-4 transition-all duration-300',
            isDropSuccess ? 'bg-green-600 hover:bg-green-700' : '',
          )}
          onClick={open}
          size="md"
          animate={true}
        >
          {isDropSuccess ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              File Selected
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Select File
            </>
          )}
        </Button>
      </div>

      {showFileTypeInfo && (
        <p className="mt-1 text-xs text-center text-gray-500">
          Secure upload • Your files are protected with encryption
        </p>
      )}

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }
        .shake-animation {
          animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
};

export default FileUpload;
