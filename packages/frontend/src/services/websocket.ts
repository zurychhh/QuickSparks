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

// Helper function to extract base URL for WebSocket connection
export function getWebSocketBaseUrl(): string {
  try {
    // Extract base URL from API config (remove /api suffix)
    const baseUrl = API_CONFIG.baseUrl.replace(/\/api$/, '');
    console.log("WebSocket base URL extraction:", {
      originalApiUrl: API_CONFIG.baseUrl,
      extractedBaseUrl: baseUrl
    });
    
    // For relative URLs, use window.location.origin
    if (baseUrl.startsWith('/')) {
      const socketUrl = window.location.origin;
      console.log("Using window.location.origin for WebSocket:", socketUrl);
      return socketUrl;
    }
    
    return baseUrl;
  } catch (error) {
    console.error("Error extracting WebSocket base URL:", error);
    // Fallback to current origin if something fails
    return window.location.origin;
  }
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
      console.log("WebSocket already connected, skipping connection");
      return;
    }
    
    try {
      console.log("Attempting to connect to WebSocket:", url);
      
      // Add auth token to URL
      const connectionUrl = `${url}?token=${encodeURIComponent(authToken)}`;
      
      setStatus(WebSocketStatus.CONNECTING);
      console.log("WebSocket connecting to:", connectionUrl);
      
      socketRef.current = new WebSocket(connectionUrl);
      
      // Connection opened
      socketRef.current.onopen = () => {
        console.log("WebSocket connection established successfully");
        setStatus(WebSocketStatus.CONNECTED);
        setError(null);
      };
      
      // Connection closed
      socketRef.current.onclose = (event) => {
        console.log("WebSocket connection closed:", event.reason || "No reason provided");
        setStatus(WebSocketStatus.DISCONNECTED);
      };
      
      // Connection error
      socketRef.current.onerror = (event) => {
        console.error("WebSocket connection error:", event);
        setStatus(WebSocketStatus.ERROR);
        setError(new Error('WebSocket connection error'));
        captureException(new Error('WebSocket connection error'), { extra: { event } });
      };
      
      // Listen for messages
      socketRef.current.onmessage = (event) => {
        try {
          console.log("WebSocket message received:", event.data);
          
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log("Parsed WebSocket message:", message);
          
          setLastMessage(message);
          setMessageHistory((prev) => [...prev, message]);
          
          // Notify listeners
          if (message.type && messageListenersRef.current.has(message.type)) {
            const listeners = messageListenersRef.current.get(message.type);
            console.log(`Notifying ${listeners?.size || 0} listeners for message type: ${message.type}`);
            
            listeners?.forEach((listener) => {
              try {
                listener(message.data);
              } catch (error) {
                console.error("Error in WebSocket message listener:", error);
                captureException(error);
              }
            });
          } else {
            console.log(`No listeners registered for message type: ${message.type || 'undefined'}`);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
          captureException(error);
        }
      };
    } catch (error) {
      setStatus(WebSocketStatus.ERROR);
      setError(error instanceof Error ? error : new Error('Unknown WebSocket error'));
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