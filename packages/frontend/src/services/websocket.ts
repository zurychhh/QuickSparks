import { useEffect, useState, useRef, useCallback } from 'react';
import { captureException } from '@utils/sentry';
import { API_CONFIG } from '../config/api.config';

// WebSocket connection status
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
}

// Custom hook for WebSocket connection
export function useWebSocket(url: string, authToken: string) {
  const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const messageListenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    // Normalize URL and add auth token
    let connectionUrl = url;
    
    // Extract WebSocket URL based on environment
    if (process.env.NODE_ENV === 'production' || import.meta.env.PROD) {
      // W produkcji użyj względnej ścieżki
      connectionUrl = window.location.origin + '/socket.io';
      console.log('Production WebSocket URL (relative):', connectionUrl);
    } else {
      // W rozwoju lub jeśli podano pełny URL, użyj go bezpośrednio
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        // Jeśli to nie jest pełny URL WebSocket, użyj domyślnego backendu
        connectionUrl = 'http://localhost:5000/socket.io';
        console.log('Development WebSocket URL:', connectionUrl);
      }
    }
    
    // Enhanced debugging for WebSocket URL construction
    console.log('Original WebSocket URL:', url);
    console.log('Normalized WebSocket URL:', connectionUrl);
    
    // Ensure URL has proper protocol
    if (!connectionUrl.startsWith('ws://') && !connectionUrl.startsWith('wss://')) {
      // Auto-detect protocol based on current page
      const isSecure = window.location.protocol === 'https:';
      connectionUrl = `${isSecure ? 'wss' : 'ws'}://${connectionUrl.replace(/^https?:///, '')}`;
      console.log('Protocol added to WebSocket URL:', connectionUrl);
    }
    
    // Remove trailing slash before adding query parameters
    connectionUrl = connectionUrl.endsWith('/') ? connectionUrl.slice(0, -1) : connectionUrl;
    console.log('Trailing slash removed from WebSocket URL:', connectionUrl);
    
    // Add auth token to URL
    connectionUrl = `${connectionUrl}?token=${encodeURIComponent(authToken)}`;
    console.log('Final WebSocket URL with token:', connectionUrl);
    
    try {
      setStatus(WebSocketStatus.CONNECTING);
      console.log('Connecting to WebSocket:', connectionUrl);
      socketRef.current = new WebSocket(connectionUrl);
      
      // Connection opened
      socketRef.current.onopen = () => {
        setStatus(WebSocketStatus.CONNECTED);
        setError(null);
        console.log(`WebSocket connected with ID: ${socketRef.current?.url}`);
      };
      
      // Connection closed
      socketRef.current.onclose = (event) => {
        setStatus(WebSocketStatus.DISCONNECTED);
        console.log(`WebSocket disconnected: ${event.reason || 'No reason provided'}`);
      };
      
      // Connection error
      socketRef.current.onerror = (event) => {
        setStatus(WebSocketStatus.ERROR);
        setError(new Error('WebSocket connection error'));
        console.error('WebSocket connection error:', event);
        captureException(new Error('WebSocket connection error'), { extra: { event } });
      };
      
      // Listen for messages
      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message.type);
          
          setLastMessage(message);
          setMessageHistory((prev) => [...prev, message]);
          
          // Notify listeners
          if (message.type && messageListenersRef.current.has(message.type)) {
            const listeners = messageListenersRef.current.get(message.type);
            listeners?.forEach((listener) => {
              try {
                listener(message.data);
              } catch (error) {
                captureException(error);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          captureException(error);
        }
      };
    } catch (error) {
      setStatus(WebSocketStatus.ERROR);
      setError(error instanceof Error ? error : new Error('Unknown WebSocket error'));
      console.error('Error initializing WebSocket:', error);
      captureException(error);
    }
  }, [url, authToken]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setStatus(WebSocketStatus.DISCONNECTED);
    }
  }, []);
  
  // Send a message
  const send = useCallback((message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);
  
  // Add a message listener
  const addMessageListener = useCallback((type: string, callback: (data: any) => void) => {
    if (!messageListenersRef.current.has(type)) {
      messageListenersRef.current.set(type, new Set());
    }
    
    messageListenersRef.current.get(type)?.add(callback);
    
    // Return unsubscribe function
    return () => {
      messageListenersRef.current.get(type)?.delete(callback);
      if (messageListenersRef.current.get(type)?.size === 0) {
        messageListenersRef.current.delete(type);
      }
    };
  }, []);
  
  // Clear message history
  const clearMessageHistory = useCallback(() => {
    setMessageHistory([]);
  }, []);
  
  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Reconnect on token change
  useEffect(() => {
    if (authToken) {
      disconnect();
      connect();
    }
  }, [authToken, disconnect, connect]);
  
  // Auto-reconnect logic
  useEffect(() => {
    if (status === WebSocketStatus.ERROR || status === WebSocketStatus.DISCONNECTED) {
      const reconnectTimer = setTimeout(() => {
        connect();
      }, 5000); // Reconnect after 5 seconds
      
      return () => {
        clearTimeout(reconnectTimer);
      };
    }
  }, [status, connect]);
  
  return {
    status,
    lastMessage,
    messageHistory,
    error,
    connect,
    disconnect,
    send,
    addMessageListener,
    clearMessageHistory
  };
}

export default {
  useWebSocket,
  WebSocketStatus
};