import { useEffect, useState, useRef, useCallback } from 'react';
import { captureException } from '@utils/sentry';
import { ConversionStatusPoller } from './api';

// WebSocket connection status
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  FALLBACK = 'fallback' // New status for when using fallback polling
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
}

// Reconnection configuration
const RECONNECT_CONFIG = {
  INITIAL_DELAY: 1000, // Start with 1 second delay
  MAX_DELAY: 30000, // Maximum backoff of 30 seconds
  BACKOFF_FACTOR: 1.5, // Exponential factor
  MAX_ATTEMPTS: 10, // Maximum number of reconnection attempts
  RESET_TIMEOUT: 60000, // Reset retry count after 1 minute of stability
};

// Custom hook for WebSocket connection
export function useWebSocket(url: string, authToken: string) {
  const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const messageListenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetAttemptsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBackoffDelayRef = useRef<number>(RECONNECT_CONFIG.INITIAL_DELAY);
  const manualDisconnectRef = useRef<boolean>(false);
  const fallbackPollerRef = useRef<ConversionStatusPoller | null>(null);
  const monitoredConversionIdRef = useRef<string | null>(null);
  
  // Calculate exponential backoff delay
  const getBackoffDelay = useCallback(() => {
    const attemptCount = reconnectAttemptRef.current;
    const delay = Math.min(
      RECONNECT_CONFIG.INITIAL_DELAY * Math.pow(RECONNECT_CONFIG.BACKOFF_FACTOR, attemptCount),
      RECONNECT_CONFIG.MAX_DELAY
    );
    lastBackoffDelayRef.current = delay;
    return delay;
  }, []);
  
  // Reset reconnection attempts after stable connection
  const resetReconnectionAttempts = useCallback(() => {
    // Clear any existing reset timer
    if (resetAttemptsTimerRef.current) {
      clearTimeout(resetAttemptsTimerRef.current);
      resetAttemptsTimerRef.current = null;
    }
    
    // Set a new timer to reset attempts after stable connection period
    resetAttemptsTimerRef.current = setTimeout(() => {
      reconnectAttemptRef.current = 0;
      lastBackoffDelayRef.current = RECONNECT_CONFIG.INITIAL_DELAY;
      console.log('WebSocket connection stable, reset reconnection attempts counter');
    }, RECONNECT_CONFIG.RESET_TIMEOUT);
  }, []);

  // Normalize URL and add auth token
  const getNormalizedUrl = useCallback((baseUrl: string, token: string) => {
    let connectionUrl = baseUrl;
    
    // Extract WebSocket URL based on environment
    if (process.env.NODE_ENV === 'production' || (import.meta.env as any).PROD) {
      // Use relative path in production
      connectionUrl = window.location.origin + '/socket.io';
      console.log('Production WebSocket URL (relative):', connectionUrl);
    } else {
      // In development or if full URL is provided, use it directly
      if (!baseUrl.startsWith('ws://') && !baseUrl.startsWith('wss://')) {
        // If not a full WebSocket URL, use default backend
        connectionUrl = 'http://localhost:5000/socket.io';
        console.log('Development WebSocket URL:', connectionUrl);
      }
    }
    
    // Enhanced debugging for WebSocket URL construction
    console.log('Original WebSocket URL:', baseUrl);
    console.log('Normalized WebSocket URL:', connectionUrl);
    
    // Ensure URL has proper protocol
    if (!connectionUrl.startsWith('ws://') && !connectionUrl.startsWith('wss://')) {
      // Auto-detect protocol based on current page
      const isSecure = window.location.protocol === 'https:';
      connectionUrl = `${isSecure ? 'wss' : 'ws'}://${connectionUrl.replace(/^https?:\/\//, '')}`;
      console.log('Protocol added to WebSocket URL:', connectionUrl);
    }
    
    // Remove trailing slash before adding query parameters
    connectionUrl = connectionUrl.endsWith('/') ? connectionUrl.slice(0, -1) : connectionUrl;
    console.log('Trailing slash removed from WebSocket URL:', connectionUrl);
    
    // Add auth token to URL
    connectionUrl = `${connectionUrl}?token=${encodeURIComponent(token)}`;
    console.log('Final WebSocket URL with token:', connectionUrl);
    
    return connectionUrl;
  }, []);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    // Clear any pending reconnect timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    // Return early if already connected
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    // Reset manual disconnect flag when attempting to connect
    manualDisconnectRef.current = false;
    
    // Get properly formatted URL
    const connectionUrl = getNormalizedUrl(url, authToken);
    
    try {
      setStatus(WebSocketStatus.CONNECTING);
      console.log('Connecting to WebSocket:', connectionUrl);
      socketRef.current = new WebSocket(connectionUrl);
      
      // Connection opened
      socketRef.current.onopen = () => {
        setStatus(WebSocketStatus.CONNECTED);
        setError(null);
        console.log(`WebSocket connected with ID: ${socketRef.current?.url}`);
        
        // Reset reconnection attempts after successful connection
        resetReconnectionAttempts();
      };
      
      // Connection closed
      socketRef.current.onclose = (event) => {
        setStatus(WebSocketStatus.DISCONNECTED);
        console.log(`WebSocket disconnected: ${event.reason || 'No reason provided'}`);
        
        // Only attempt reconnect if this wasn't a manual disconnect
        if (!manualDisconnectRef.current) {
          // Schedule reconnection with exponential backoff
          scheduleReconnect();
        }
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
      
      // Schedule reconnect on initialization error
      if (!manualDisconnectRef.current) {
        scheduleReconnect();
      }
    }
  }, [url, authToken, getNormalizedUrl, resetReconnectionAttempts]);
  
  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    // Only reconnect if we haven't exceeded max attempts
    if (reconnectAttemptRef.current < RECONNECT_CONFIG.MAX_ATTEMPTS) {
      reconnectAttemptRef.current += 1;
      const delay = getBackoffDelay();
      
      console.log(`Scheduling reconnection attempt ${reconnectAttemptRef.current}/${RECONNECT_CONFIG.MAX_ATTEMPTS} in ${delay}ms`);
      setStatus(WebSocketStatus.RECONNECTING);
      
      // Clear any existing reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      // Set new reconnect timer
      reconnectTimerRef.current = setTimeout(() => {
        console.log(`Attempting reconnection #${reconnectAttemptRef.current}`);
        connect();
      }, delay);
    } else {
      console.log(`Maximum reconnection attempts (${RECONNECT_CONFIG.MAX_ATTEMPTS}) reached, giving up`);
      setStatus(WebSocketStatus.ERROR);
      setError(new Error('Maximum reconnection attempts reached'));
      captureException(new Error('Maximum WebSocket reconnection attempts reached'));
      
      // If we're monitoring a conversion, switch to fallback polling
      if (monitoredConversionIdRef.current) {
        console.log(`Switching to fallback polling for conversion: ${monitoredConversionIdRef.current}`);
        startFallbackPolling(monitoredConversionIdRef.current);
      }
    }
  }, [connect, getBackoffDelay]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Set manual disconnect flag to prevent auto-reconnect
    manualDisconnectRef.current = true;
    
    // Clear any pending timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (resetAttemptsTimerRef.current) {
      clearTimeout(resetAttemptsTimerRef.current);
      resetAttemptsTimerRef.current = null;
    }
    
    // Close socket if it exists
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setStatus(WebSocketStatus.DISCONNECTED);
    }
  }, []);
  
  // Manual reconnect - resets counters and immediately tries to connect
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptRef.current = 0;
    lastBackoffDelayRef.current = RECONNECT_CONFIG.INITIAL_DELAY;
    connect();
  }, [disconnect, connect]);
  
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
      reconnectAttemptRef.current = 0;
      lastBackoffDelayRef.current = RECONNECT_CONFIG.INITIAL_DELAY;
      connect();
    }
  }, [authToken, disconnect, connect]);
  
  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      if (resetAttemptsTimerRef.current) {
        clearTimeout(resetAttemptsTimerRef.current);
        resetAttemptsTimerRef.current = null;
      }
    };
  }, []);
  
  // Start fallback polling for a conversion
  const startFallbackPolling = useCallback((conversionId: string) => {
    // Stop any existing poller
    if (fallbackPollerRef.current) {
      fallbackPollerRef.current.stop();
      fallbackPollerRef.current = null;
    }
    
    console.log(`Creating fallback poller for conversion: ${conversionId}`);
    setStatus(WebSocketStatus.FALLBACK);
    
    // Create and start a new poller
    fallbackPollerRef.current = new ConversionStatusPoller(
      conversionId,
      // onUpdate - notify all status update listeners
      (data) => {
        const message: WebSocketMessage = {
          type: 'conversion:status',
          data: {
            conversionId,
            status: data.status,
            progress: data.progress || 0,
            ...data
          }
        };
        
        console.log(`Fallback poller received status update: ${data.status}`);
        
        // Update internal state
        setLastMessage(message);
        setMessageHistory((prev) => [...prev, message]);
        
        // Notify status listeners
        const listeners = messageListenersRef.current.get('conversion:status');
        listeners?.forEach((listener) => {
          try {
            listener(message.data);
          } catch (error) {
            captureException(error);
          }
        });
      },
      // onError - log but keep polling
      (error) => {
        console.error('Fallback poller error:', error);
        captureException(error);
      },
      // onComplete - stop monitoring and notify
      (data) => {
        console.log(`Conversion completed with status: ${data.status}`);
        
        // Create completion message
        const message: WebSocketMessage = {
          type: 'conversion:complete',
          data: {
            conversionId,
            status: data.status,
            ...data
          }
        };
        
        // Update internal state
        setLastMessage(message);
        setMessageHistory((prev) => [...prev, message]);
        
        // Notify completion listeners
        const listeners = messageListenersRef.current.get('conversion:complete');
        listeners?.forEach((listener) => {
          try {
            listener(message.data);
          } catch (error) {
            captureException(error);
          }
        });
        
        // Clear monitored conversion
        monitoredConversionIdRef.current = null;
      }
    );
    
    // Start polling
    fallbackPollerRef.current.start();
  }, []);
  
  // Stop the fallback poller
  const stopFallbackPolling = useCallback(() => {
    if (fallbackPollerRef.current) {
      console.log('Stopping fallback poller');
      fallbackPollerRef.current.stop();
      fallbackPollerRef.current = null;
      
      // If WebSocket was in FALLBACK status and we're stopping the poller,
      // set to DISCONNECTED unless Socket is actually connected
      if (status === WebSocketStatus.FALLBACK) {
        setStatus(
          socketRef.current?.readyState === WebSocket.OPEN 
            ? WebSocketStatus.CONNECTED 
            : WebSocketStatus.DISCONNECTED
        );
      }
    }
    
    // Clear monitored conversion
    monitoredConversionIdRef.current = null;
  }, [status]);
  
  // Monitor a specific conversion - automatically falls back to polling if WebSocket fails
  const monitorConversion = useCallback((conversionId: string) => {
    console.log(`Setting up monitoring for conversion: ${conversionId}`);
    monitoredConversionIdRef.current = conversionId;
    
    // If WebSocket is in ERROR state, immediately use fallback polling
    if (status === WebSocketStatus.ERROR) {
      console.log('WebSocket in ERROR state, using fallback polling immediately');
      startFallbackPolling(conversionId);
      return;
    }
    
    // If WebSocket is not connected, try connecting first
    if (status !== WebSocketStatus.CONNECTED && status !== WebSocketStatus.CONNECTING) {
      console.log('WebSocket not connected, trying to connect before monitoring');
      connect();
    }
    
    // Send subscription message if socket is open
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      send({
        type: 'subscribe',
        data: { conversionId }
      });
      console.log(`Subscribed to conversion updates for: ${conversionId}`);
    } else {
      console.log('Socket not ready for subscription, will use fallback polling');
      startFallbackPolling(conversionId);
    }
  }, [status, connect, send, startFallbackPolling]);
  
  // Stop monitoring a conversion
  const stopMonitoringConversion = useCallback(() => {
    const conversionId = monitoredConversionIdRef.current;
    
    if (conversionId) {
      console.log(`Stopping monitoring for conversion: ${conversionId}`);
      
      // Unsubscribe from WebSocket updates if connected
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        send({
          type: 'unsubscribe',
          data: { conversionId }
        });
        console.log(`Unsubscribed from conversion updates for: ${conversionId}`);
      }
      
      // Stop any fallback polling
      stopFallbackPolling();
      
      // Clear the monitored conversion ID
      monitoredConversionIdRef.current = null;
    }
  }, [send, stopFallbackPolling]);
  
  return {
    status,
    lastMessage,
    messageHistory,
    error,
    connect,
    disconnect,
    reconnect,
    send,
    addMessageListener,
    clearMessageHistory,
    reconnectAttempt: reconnectAttemptRef.current,
    maxReconnectAttempts: RECONNECT_CONFIG.MAX_ATTEMPTS,
    // New methods for conversion monitoring
    monitorConversion,
    stopMonitoringConversion,
    startFallbackPolling,
    stopFallbackPolling,
    isFallbackMode: status === WebSocketStatus.FALLBACK,
    currentConversionId: monitoredConversionIdRef.current
  };
}

export default {
  useWebSocket,
  WebSocketStatus
};