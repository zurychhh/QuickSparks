import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@utils/classnames';
import Button from './Button';

export interface FileUploadProps {
  onFileAccepted: (file: File) => void;
  onFileRejected?: (errors: Array<{ code: string; message: string }>) => void;
  acceptedFileTypes?: string[];
  maxSize?: number;
  className?: string;
  label?: string;
  dropzoneText?: string;
  errorText?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_LABEL = 'Upload File';
const DEFAULT_DROPZONE_TEXT = 'Drag & drop a file here, or click to browse';
const DEFAULT_ERROR_TEXT = 'File upload error';

const FileUpload: React.FC<FileUploadProps> = ({
  onFileAccepted,
  onFileRejected,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  className,
  label = DEFAULT_LABEL,
  dropzoneText = DEFAULT_DROPZONE_TEXT,
  errorText = DEFAULT_ERROR_TEXT,
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setUploadError(null);

      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }

      if (fileRejections.length > 0) {
        const errors = fileRejections[0].errors;
        
        // Determine error type for user-friendly message
        let errorMessage = errorText;
        
        if (errors.some(e => e.code === 'file-too-large')) {
          errorMessage = `File is too large. Maximum size: ${maxSize / (1024 * 1024)}MB`;
        } else if (errors.some(e => e.code === 'file-invalid-type')) {
          errorMessage = `Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`;
        }

        setUploadError(errorMessage);
        
        if (onFileRejected) {
          onFileRejected(errors);
        }
      }
    },
    [onFileAccepted, onFileRejected, errorText, maxSize, acceptedFileTypes]
  );

  const { getRootProps, getInputProps, isDragReject, open } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center min-h-[200px]',
          isDragActive && !isDragReject && 'border-primary-500 bg-primary-50',
          isDragReject && 'border-error-500 bg-error-50',
          uploadError ? 'border-error-500' : 'border-gray-300 hover:border-primary-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="text-center">
          <svg
            className={cn(
              'mx-auto h-12 w-12 mb-3',
              isDragReject || uploadError ? 'text-error-500' : 'text-gray-400'
            )}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          
          <p className="text-base text-gray-600">{dropzoneText}</p>
          
          <p className="mt-2 text-sm text-gray-500">
            {`${acceptedFileTypes.join(', ')} up to ${maxSize / (1024 * 1024)}MB`}
          </p>
        </div>
        
        {uploadError && (
          <p className="mt-2 text-sm text-error-600 font-medium">{uploadError}</p>
        )}
      </div>
      
      <div className="mt-3 flex justify-center">
        <Button
          type="button"
          variant="primary"
          onClick={open}
        >
          Browse Files
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;