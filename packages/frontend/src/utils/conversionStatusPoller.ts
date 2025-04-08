import api from '../services/api';
import { captureException } from './sentry';

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
 * ConversionStatusPoller
 * 
 * A robust class for polling conversion status with exponential backoff.
 * This is used as a fallback when WebSockets fail or are not available.
 */
export class ConversionStatusPoller {
  private conversionId: string;
  private intervalId: number | null = null;
  private retryCount = 0;
  private maxRetries = 100; // High number for long-running conversions
  private initialInterval = 2000; // 2 seconds
  private onUpdate: (data: ConversionStatus) => void;
  private onError: (error: any) => void;
  private onComplete: (data: ConversionStatus) => void;
  private lastStatus: string | null = null;
  private consecutiveErrors = 0;
  private maxConsecutiveErrors = 5; // After 5 consecutive errors, stop polling
  
  /**
   * Constructor
   */
  constructor(
    conversionId: string,
    onUpdate: (data: ConversionStatus) => void,
    onError: (error: any) => void,
    onComplete: (data: ConversionStatus) => void
  ) {
    this.conversionId = conversionId;
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.onComplete = onComplete;
  }
  
  /**
   * Start polling
   */
  start(): void {
    if (this.intervalId !== null) {
      this.stop(); // Clear existing interval if any
    }
    
    console.log(`Starting status polling for conversion: ${this.conversionId}`);
    
    // Do an immediate check
    this.checkStatus();
    
    // Then set up the interval for subsequent checks
    this.retryCount = 0;
    this.scheduleNextCheck();
  }
  
  /**
   * Stop polling
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
      console.log(`Stopped status polling for conversion: ${this.conversionId}`);
    }
  }
  
  /**
   * Schedule the next status check with exponential backoff
   */
  private scheduleNextCheck(): void {
    if (this.retryCount >= this.maxRetries) {
      console.warn(`Max retries (${this.maxRetries}) reached for conversion: ${this.conversionId}`);
      this.stop();
      return;
    }
    
    // Calculate the next interval using exponential backoff
    // Formula: base * 2^n, capped at 30 seconds
    const nextInterval = Math.min(
      this.initialInterval * Math.pow(2, this.retryCount),
      30000 // Maximum 30 seconds
    );
    
    console.log(`Scheduling next status check in ${Math.round(nextInterval / 1000)}s for conversion: ${this.conversionId}`);
    
    this.intervalId = window.setTimeout(() => {
      this.checkStatus();
    }, nextInterval);
    
    this.retryCount++;
  }
  
  /**
   * Check the current status
   */
  private async checkStatus(): Promise<void> {
    try {
      const response = await api.getConversionStatus(this.conversionId);
      this.consecutiveErrors = 0; // Reset error counter on success
      
      if (response && response.data) {
        const data = response.data as ConversionStatus;
        
        // Update only if status has changed
        if (this.lastStatus !== data.status) {
          console.log(`Status changed for ${this.conversionId}: ${this.lastStatus} -> ${data.status}`);
          this.lastStatus = data.status;
          this.onUpdate(data);
        }
        
        // Check if conversion is complete
        if (['completed', 'failed', 'error'].includes(data.status)) {
          console.log(`Conversion ${this.conversionId} has reached final status: ${data.status}`);
          this.stop();
          this.onComplete(data);
          return;
        }
        
        // Continue polling for in-progress statuses
        this.scheduleNextCheck();
      } else {
        console.warn(`No data in status response for conversion: ${this.conversionId}`);
        this.scheduleNextCheck();
      }
    } catch (error) {
      this.consecutiveErrors++;
      console.error(`Error checking status (attempt ${this.consecutiveErrors}):`, error);
      
      // Call error handler
      this.onError(error);
      
      // Stop polling if too many consecutive errors
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error(`Too many consecutive errors (${this.consecutiveErrors}), stopping poller for ${this.conversionId}`);
        this.stop();
        return;
      }
      
      // Otherwise continue polling
      this.scheduleNextCheck();
    }
  }
}

export default ConversionStatusPoller;