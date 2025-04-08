import React, { useEffect, useState } from 'react';
import { WebSocketStatus as WSStatus } from '../../services/websocket';

interface WebSocketStatusProps {
  status: WSStatus;
  reconnectAttempt?: number;
  maxReconnectAttempts?: number;
  onReconnect?: () => void;
  className?: string;
  showStatus?: boolean;
}

/**
 * Component to display WebSocket connection status and allow manual reconnection
 */
const WebSocketStatusIndicator: React.FC<WebSocketStatusProps> = ({
  status,
  reconnectAttempt = 0,
  maxReconnectAttempts = 0,
  onReconnect,
  className,
  showStatus = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show the status indicator when there's a non-connected state that persists
  useEffect(() => {
    // If status is not CONNECTED and not CONNECTING, show after a delay
    if (status !== WSStatus.CONNECTED && status !== WSStatus.CONNECTING) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000); // Show after 2 seconds of disconnection to avoid flicker during normal reconnects
      
      return () => clearTimeout(timer);
    } else if (status === WSStatus.CONNECTED) {
      // When connected, hide the indicator after a brief display of "Connected"
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [status]);
  
  // Don't render anything when hidden
  if (!isVisible || !showStatus) {
    return null;
  }
  
  // Get status information based on current state
  const getStatusInfo = () => {
    switch (status) {
      case WSStatus.CONNECTED:
        return {
          icon: (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          ),
          text: 'Connected',
          colorClass: 'text-green-700 bg-green-100 border-green-500',
          showReconnect: false
        };
      case WSStatus.CONNECTING:
        return {
          icon: (
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          ),
          text: 'Connecting...',
          colorClass: 'text-blue-700 bg-blue-100 border-blue-500',
          showReconnect: false
        };
      case WSStatus.RECONNECTING:
        return {
          icon: (
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          ),
          text: `Reconnecting (${reconnectAttempt}/${maxReconnectAttempts})...`,
          colorClass: 'text-blue-700 bg-blue-100 border-blue-500',
          showReconnect: true
        };
      case WSStatus.DISCONNECTED:
        return {
          icon: (
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          ),
          text: 'Disconnected',
          colorClass: 'text-yellow-700 bg-yellow-100 border-yellow-500',
          showReconnect: true
        };
      case WSStatus.ERROR:
        return {
          icon: (
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          ),
          text: 'Connection error',
          colorClass: 'text-red-700 bg-red-100 border-red-500',
          showReconnect: true
        };
      default:
        return {
          icon: (
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          ),
          text: 'Unknown status',
          colorClass: 'text-gray-700 bg-gray-100 border-gray-500',
          showReconnect: true
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <div 
      className={`fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm shadow-md ${statusInfo.colorClass} ${className}`}
    >
      {statusInfo.icon}
      <span>{statusInfo.text}</span>
      {statusInfo.showReconnect && onReconnect && (
        <button 
          onClick={onReconnect}
          className="ml-2 underline font-medium hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded-sm"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};

export default WebSocketStatusIndicator;