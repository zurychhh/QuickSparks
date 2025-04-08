import { captureException } from '@utils/sentry';
import remoteLogger from '../utils/remoteLogger';

interface WebSocketMessage {
  type: string;
  data: any;
}

/**
 * WebSocket proxy service for status updates
 * Uses the Vercel proxy to avoid mixed content issues
 */
export class WebSocketProxyService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimerId: number | null = null;
  private listeners = new Map<string, Set<(data: any) => void>>();
  private conversionId: string | null = null;
  
  // Get the WS URL using the proxy
  private getWebSocketUrl(): string {
    // Use relative path for WebSocket to go through Vercel proxy
    const baseUrl = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${baseUrl}/ws`;
  }
  
  // Connect to WebSocket
  connect(conversionId: string): void {
    // Store conversion ID
    this.conversionId = conversionId;
    
    // Check if already connected
    if (this.isConnected) {
      this.subscribe(conversionId);
      return;
    }
    
    try {
      const url = this.getWebSocketUrl();
      console.log(`Connecting to WebSocket at ${url} for conversion ${conversionId}`);
      remoteLogger.info(`Connecting to WebSocket for conversion`, { url, conversionId });
      
      this.socket = new WebSocket(url);
      
      // Connection opened
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        remoteLogger.info('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to conversion updates
        this.subscribe(conversionId);
      };
      
      // Connection closed
      this.socket.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        remoteLogger.info('WebSocket closed', { code: event.code, reason: event.reason });
        this.isConnected = false;
        
        // Notify connection listeners
        this.notifyListeners('connection', {
          status: 'disconnected',
          code: event.code,
          reason: event.reason
        });
        
        // Attempt reconnect if this wasn't a manual disconnect
        this.attemptReconnect();
      };
      
      // Connection error
      this.socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        remoteLogger.error('WebSocket error', { event });
        captureException(new Error('WebSocket connection error'));
        
        // Notify error listeners
        this.notifyListeners('error', { message: 'WebSocket connection error' });
      };
      
      // Listen for messages
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message.type);
          remoteLogger.info('WebSocket message received', { type: message.type });
          
          // Notify listeners
          this.notifyListeners(message.type, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          remoteLogger.error('Error parsing WebSocket message', { error, data: event.data });
          captureException(error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      remoteLogger.error('Error creating WebSocket', { error });
      captureException(error);
      
      // Schedule reconnect on initialization error
      this.attemptReconnect();
    }
  }
  
  // Send a subscription message
  private subscribe(conversionId: string): void {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }
    
    // Send subscription message
    this.send({
      type: 'subscribe',
      data: { conversionId }
    });
    
    console.log(`Subscribed to conversion updates for ${conversionId}`);
    remoteLogger.info(`Subscribed to conversion updates`, { conversionId });
  }
  
  // Attempt to reconnect with exponential backoff
  private attemptReconnect(): void {
    // Clear any existing timer
    if (this.reconnectTimerId !== null) {
      window.clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Calculate delay using exponential backoff
      // Formula: 2^n * 1000 ms (1s, 2s, 4s, 8s, 16s)
      const delay = Math.pow(2, this.reconnectAttempts - 1) * 1000;
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      remoteLogger.info(`Attempting WebSocket reconnect`, { delay, attempt: this.reconnectAttempts, max: this.maxReconnectAttempts });
      
      // Set reconnect timer
      this.reconnectTimerId = window.setTimeout(() => {
        if (this.conversionId) {
          this.connect(this.conversionId);
        }
      }, delay);
    } else {
      console.error('Maximum reconnection attempts reached');
      remoteLogger.error('Maximum WebSocket reconnection attempts reached');
      
      // Notify listeners of permanent failure
      this.notifyListeners('connection', {
        status: 'failed',
        message: 'Maximum reconnection attempts reached'
      });
    }
  }
  
  // Send a message to the server
  send(message: any): boolean {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageStr);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      captureException(error);
      return false;
    }
  }
  
  // Add a listener for a specific event type
  addListener(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)?.add(callback);
    
    // Return function to remove the listener
    return () => {
      this.listeners.get(eventType)?.delete(callback);
      if (this.listeners.get(eventType)?.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }
  
  // Notify all listeners of a specific event type
  private notifyListeners(eventType: string, data: any): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)?.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} listener:`, error);
          captureException(error);
        }
      });
    }
  }
  
  // Monitor a conversion for status updates
  monitorConversion(conversionId: string, onStatusUpdate: (status: any) => void): () => void {
    // Connect if not already connected
    if (!this.isConnected) {
      this.connect(conversionId);
    } else if (this.conversionId !== conversionId) {
      // If monitoring a different conversion, reconnect with new ID
      this.disconnect();
      this.connect(conversionId);
    }
    
    // Set up status listeners
    const unsubscribeStatus = this.addListener('conversion:status', onStatusUpdate);
    const unsubscribeComplete = this.addListener('conversion:complete', onStatusUpdate);
    const unsubscribeError = this.addListener('conversion:error', (data) => {
      onStatusUpdate({
        ...data,
        status: 'error'
      });
    });
    
    // Return function to unsubscribe from all events
    return () => {
      unsubscribeStatus();
      unsubscribeComplete();
      unsubscribeError();
    };
  }
  
  // Disconnect from WebSocket
  disconnect(): void {
    if (this.socket) {
      if (this.isConnected) {
        // Send unsubscribe message if we have a conversion ID
        if (this.conversionId) {
          this.send({
            type: 'unsubscribe',
            data: { conversionId: this.conversionId }
          });
        }
        
        this.socket.close();
      }
      
      this.socket = null;
      this.isConnected = false;
      this.conversionId = null;
    }
    
    // Clear any reconnect timer
    if (this.reconnectTimerId !== null) {
      window.clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
    
    console.log('WebSocket disconnected');
  }
}

// Create singleton instance
const webSocketProxyService = new WebSocketProxyService();

export default webSocketProxyService;