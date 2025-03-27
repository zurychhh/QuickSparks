import React from 'react';
import { cn } from '@utils/classnames';
import Button from './Button';

export interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  onConvert: () => void;
  isConverting?: boolean;
  className?: string;
  showConvertButton?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  onConvert,
  isConverting = false,
  className,
  showConvertButton = true,
}) => {
  const fileType = file.type;
  const isPdf = fileType === 'application/pdf';
  const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  // Format file size
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Get file extension
  const getFileExtension = (filename: string): string => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  };

  // Get icon based on file type
  const getFileIcon = (): React.ReactNode => {
    if (isPdf) {
      return (
        <svg className="h-8 w-8 text-error-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (isDocx) {
      return (
        <svg className="h-8 w-8 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  // Get conversion target format text
  const getConversionText = (): string => {
    if (isPdf) {
      return 'Convert to DOCX';
    } else if (isDocx) {
      return 'Convert to PDF';
    } else {
      return 'Convert File';
    }
  };

  return (
    <div className={cn('border rounded-lg p-4 shadow-sm bg-white', className)}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        
        <div className="ml-4 flex-1">
          <h3 className="text-base font-medium text-gray-900 truncate max-w-xs">{file.name}</h3>
          <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-gray-500">
            <p>{formatFileSize(file.size)}</p>
            <p>{getFileExtension(file.name).toUpperCase()}</p>
            <p>Added: {formatTimestamp(file.lastModified)}</p>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className={showConvertButton ? "mr-2" : ""}
            disabled={isConverting}
          >
            Remove
          </Button>
          
          {showConvertButton && (
            <Button
              variant={isPdf || isDocx ? 'primary' : 'secondary'}
              size="sm"
              onClick={onConvert}
              isLoading={isConverting}
              disabled={isConverting}
            >
              {getConversionText()}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;