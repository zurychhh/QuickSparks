import React from 'react';
import { cn } from '@utils/classnames';

export interface UploadProgressProps {
  progress: number;
  fileName?: string;
  fileSize?: number;
  className?: string;
  status?: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName,
  fileSize,
  className,
  status = 'uploading',
  error,
}) => {
  // Format file size
  const formatFileSize = (sizeInBytes?: number): string => {
    if (!sizeInBytes) return '';
    
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Status text and color
  const getStatusInfo = (): { text: string; color: string } => {
    switch (status) {
      case 'idle':
        return { text: 'Ready to upload', color: 'text-gray-500' };
      case 'uploading':
        return { text: 'Uploading...', color: 'text-primary-500' };
      case 'processing':
        return { text: 'Processing...', color: 'text-primary-500' };
      case 'success':
        return { text: 'Upload complete', color: 'text-green-500' };
      case 'error':
        return { text: error || 'Upload failed', color: 'text-error-500' };
      default:
        return { text: 'Unknown status', color: 'text-gray-500' };
    }
  };

  const { text, color } = getStatusInfo();

  return (
    <div className={cn('w-full', className)}>
      {fileName && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 truncate max-w-[70%]">{fileName}</span>
          <span className="text-xs text-gray-500">{formatFileSize(fileSize)}</span>
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
        <div
          className={cn(
            'h-2.5 rounded-full transition-all duration-300',
            status === 'error' ? 'bg-error-500' : 'bg-primary-500'
          )}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className={cn('text-xs font-medium', color)}>{text}</span>
        <span className="text-xs text-gray-500">{progress}%</span>
      </div>
    </div>
  );
};

export default UploadProgress;