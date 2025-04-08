import React, { useEffect, useState } from 'react';
import { useWebSocketContext } from '../../context/WebSocketContext';

interface ConversionStatusProps {
  conversionId: string;
  onStatusChange?: (status: string, data: any) => void;
}

/**
 * Component that subscribes to WebSocket updates for conversion status
 */
const ConversionStatus: React.FC<ConversionStatusProps> = ({
  conversionId,
  onStatusChange
}) => {
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { addMessageListener, send, status: wsStatus } = useWebSocketContext();
  
  useEffect(() => {
    // Register for conversion status updates
    const unsubscribe = addMessageListener('conversion_status', (data) => {
      if (data.conversionId === conversionId) {
        setStatus(data.status);
        setProgress(data.progress || 0);
        
        if (data.error) {
          setError(data.error);
        }
        
        if (onStatusChange) {
          onStatusChange(data.status, data);
        }
      }
    });
    
    // Register for specific event types
    const unsubscribeCompleted = addMessageListener('conversion_completed', (data) => {
      if (data.conversionId === conversionId) {
        setStatus('completed');
        setProgress(100);
        
        if (onStatusChange) {
          onStatusChange('completed', data);
        }
      }
    });
    
    const unsubscribeFailed = addMessageListener('conversion_failed', (data) => {
      if (data.conversionId === conversionId) {
        setStatus('failed');
        setError(data.error || 'Conversion failed');
        
        if (onStatusChange) {
          onStatusChange('failed', data);
        }
      }
    });
    
    // Request initial status when WebSocket is connected
    if (wsStatus === 'connected') {
      send({
        type: 'get_conversion_status',
        data: { conversionId }
      });
    }
    
    // Clean up subscriptions on unmount
    return () => {
      unsubscribe();
      unsubscribeCompleted();
      unsubscribeFailed();
    };
  }, [conversionId, addMessageListener, send, onStatusChange, wsStatus]);
  
  return (
    <div className="conversion-status">
      <div className="flex items-center mb-2">
        <div className="font-medium text-gray-700 mr-2">Status:</div>
        <div className="status-badge">
          {status === 'pending' && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              Pending
            </span>
          )}
          {status === 'processing' && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
              Processing
            </span>
          )}
          {status === 'completed' && (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Completed
            </span>
          )}
          {status === 'failed' && (
            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
              Failed
            </span>
          )}
        </div>
      </div>
      
      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {error && (
        <div className="text-red-600 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default ConversionStatus;