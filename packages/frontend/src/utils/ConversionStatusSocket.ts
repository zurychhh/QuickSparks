import api from '../services/api';
import { captureException } from './sentry';
import { ConversionStatusPoller } from './conversionStatusPoller';
import { API_CONFIG } from '../config/api.config';

/**
 * ConversionStatus interface
 */
export interface ConversionStatus {
  conversionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error';
  progress?: number;
  message?: string;
  result?: {
    downloadUrl?: string;
    fileId?: string;
    fileName?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
  [key: string]: any;
}

/**
 * ConversionStatusSocket
 * 
 * A robust class for monitoring conversion status via WebSockets
 * with automatic fallback to polling when WebSockets fail.
 */
export class ConversionStatusSocket {
  private conversionId: string;
  private onStatusUpdate: (status: ConversionStatus) => void;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private poller: ConversionStatusPoller | null = null;
  private isUsingFallback = false;
  private isManuallyDisconnected = false;
  
  /**
   * Constructor
   * 
   * @param conversionId The ID of the conversion to monitor
   * @param onStatusUpdate Callback for status updates
   */
  constructor(conversionId: string, onStatusUpdate: (status: ConversionStatus) => void) {
    this.conversionId = conversionId;
    this.onStatusUpdate = onStatusUpdate;
  }
  
  /**
   * Connect to the WebSocket
   */
  connect(): void {
    // Reset flags
    this.isManuallyDisconnected = false;
    
    // Create WebSocket URL
    const socketUrl = this.getWebSocketUrl();
    console.log(`Connecting to WebSocket: ${socketUrl}`);
    
    try {
      this.socket = new WebSocket(socketUrl);
      
      // Connection opened
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        
        // Subscribe to conversion updates
        this.send({
          type: 'subscribe',
          data: { conversionId: this.conversionId }
        });
      };
      
      // Listen for messages
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'conversion:status' || data.type === 'conversion:complete') {
            this.onStatusUpdate(data.data);
            
            // If conversion is complete, disconnect
            if (data.type === 'conversion:complete' || 
                (data.data?.status && ['completed', 'failed', 'error'].includes(data.data.status))) {
              this.disconnect();
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          captureException(error);
        }
      };
      
      // Connection closed
      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        
        // Don't attempt to reconnect if manually disconnected
        if (!this.isManuallyDisconnected) {
          this.attemptReconnect();
        }
      };
      
      // Connection error
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        captureException(error);
        // Socket will also trigger onclose after an error
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      captureException(error);
      this.fallbackToPolling();
    }
  }
  
  /**
   * Send a message through the WebSocket
   */
  private send(message: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        captureException(error);
        return false;
      }
    }
    return false;
  }
  
  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.pow(2, this.reconnectAttempts - 1) * 1000;
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // Clear any existing timer
      if (this.reconnectTimer !== null) {
        window.clearTimeout(this.reconnectTimer);
      }
      
      // Set a new timer
      this.reconnectTimer = window.setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnect attempts reached. Falling back to polling.');
      this.fallbackToPolling();
    }
  }
  
  /**
   * Fall back to polling when WebSockets fail
   */
  private fallbackToPolling(): void {
    console.log('Switching to polling fallback for conversion status updates');
    
    // Set fallback flag
    this.isUsingFallback = true;
    
    // Clean up WebSocket
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
      this.socket = null;
    }
    
    // Initialize poller if not already
    if (!this.poller) {
      this.poller = new ConversionStatusPoller(
        this.conversionId,
        // onUpdate
        (data) => {
          this.onStatusUpdate(data);
        },
        // onError
        (error) => {
          console.error('Polling error:', error);
          captureException(error);
        },
        // onComplete
        (data) => {
          this.onStatusUpdate(data);
          this.disconnect();
        }
      );
      
      // Start polling
      this.poller.start();
    }
  }
  
  /**
   * Disconnect from the WebSocket and stop polling
   */
  disconnect(): void {
    // Set flag to prevent auto-reconnect
    this.isManuallyDisconnected = true;
    
    // Clear reconnect timer if any
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Close WebSocket if open
    if (this.socket) {
      // Unsubscribe from conversion updates if connected
      if (this.socket.readyState === WebSocket.OPEN) {
        this.send({
          type: 'unsubscribe',
          data: { conversionId: this.conversionId }
        });
        
        this.socket.close();
      }
      this.socket = null;
    }
    
    // Stop poller if active
    if (this.poller) {
      this.poller.stop();
      this.poller = null;
    }
    
    console.log(`Disconnected status monitoring for conversion: ${this.conversionId}`);
  }
  
  /**
   * Get the WebSocket URL
   */
  private getWebSocketUrl(): string {
    // Base WebSocket URL
    let url = API_CONFIG.WS_URL;
    
    // Format for our conversion monitoring
    return `${url}/conversions/${this.conversionId}`;
  }
}

export default ConversionStatusSocket;