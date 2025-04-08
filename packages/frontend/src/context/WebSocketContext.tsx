import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useWebSocket, WebSocketStatus, WebSocketMessage } from '../services/websocket';
import WebSocketStatusIndicator from '../components/ui/WebSocketStatus';
import { useAuth } from './AuthContext';
import { API_CONFIG } from '../config/api.config';

// WebSocket context type definition
interface WebSocketContextType {
  status: WebSocketStatus;
  lastMessage: WebSocketMessage | null;
  messageHistory: WebSocketMessage[];
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  send: (message: any) => boolean;
  addMessageListener: (type: string, callback: (data: any) => void) => () => void;
  clearMessageHistory: () => void;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  showStatusIndicator?: boolean;
}

/**
 * Provider component for WebSocket functionality
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children,
  showStatusIndicator = true 
}) => {
  // Get authentication token from auth context
  const { token } = useAuth();
  
  // Initialize WebSocket connection
  const webSocketService = useWebSocket(
    API_CONFIG.WS_URL,
    token || ''
  );
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => webSocketService, [webSocketService]);
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
      {showStatusIndicator && (
        <WebSocketStatusIndicator
          status={webSocketService.status}
          reconnectAttempt={webSocketService.reconnectAttempt}
          maxReconnectAttempts={webSocketService.maxReconnectAttempts}
          onReconnect={webSocketService.reconnect}
          showStatus={!!token} // Only show when authenticated
        />
      )}
    </WebSocketContext.Provider>
  );
};

/**
 * Custom hook to use WebSocket functionality
 */
export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
};

export default WebSocketContext;