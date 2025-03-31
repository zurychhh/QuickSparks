/**
 * Remote Logger
 * 
 * This utility allows logging browser console and network errors to a remote endpoint
 * for debugging production issues without direct access to user browsers.
 */

import { captureException } from './sentry';

// Configure the logging endpoint (could be adjusted based on environment)
const LOGGING_ENDPOINT = 'https://pdfspark-conversion-service.onrender.com/api/debug/logs';

// Set to true to enable remote logging
let isRemoteLoggingEnabled = true;

// Log buffer to reduce API calls
const logBuffer: any[] = [];
let sendTimeout: number | null = null;
const BUFFER_TIMEOUT = 3000; // Send logs every 3 seconds when buffer has items

// Interface for log entries
interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  timestamp: string;
  source: string;
  url: string;
  userAgent: string;
  sessionId?: string;
}

// Generate a session ID
const generateSessionId = (): string => {
  return 'pdfspark-' + Math.random().toString(36).substring(2, 15) + 
    Math.random().toString(36).substring(2, 15);
};

// Get or create a session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('pdfspark_debug_session');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('pdfspark_debug_session', sessionId);
  }
  return sessionId;
};

// Create a basic log entry with common fields
const createLogEntry = (
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: any,
  source = 'app'
): LogEntry => {
  return {
    level,
    message,
    data: data ? sanitizeData(data) : undefined,
    timestamp: new Date().toISOString(),
    source,
    url: window.location.href,
    userAgent: navigator.userAgent,
    sessionId: getSessionId()
  };
};

// Sanitize potentially sensitive data
const sanitizeData = (data: any): any => {
  // Return null for undefined/null data
  if (data === undefined || data === null) {
    return null;
  }

  // Handle Error objects
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack
    };
  }

  // Handle basic scalar values
  if (typeof data !== 'object') {
    return data;
  }

  try {
    // Deep clone the object to avoid modifying the original
    const cloned = JSON.parse(JSON.stringify(data));
    
    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'auth', 'authorization', 'key', 'secret'];
    
    const sanitizeObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        
        // Mask sensitive fields
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '[REDACTED]';
        } 
        // Recursively sanitize nested objects
        else if (obj[key] && typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    };
    
    sanitizeObject(cloned);
    return cloned;
  } catch (e) {
    // If sanitization fails, return a simplified version
    return { 
      sanitized: true, 
      errorMessage: 'Data cannot be safely serialized',
      dataType: typeof data
    };
  }
};

// Send logs to remote endpoint
const sendLogs = async (logs: LogEntry[]): Promise<void> => {
  if (!isRemoteLoggingEnabled || logs.length === 0) return;
  
  try {
    await fetch(LOGGING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logs,
        // Add a timestamp to avoid cache issues
        timestamp: Date.now()
      }),
      // Use keepalive to ensure logs are sent even if navigating away
      keepalive: true
    });
    console.log(`Remote logging: Sent ${logs.length} logs to server`);
  } catch (error) {
    // Don't use remote logger here to avoid infinite loops
    console.error('Remote logger failed to send logs:', error);
    captureException(error);
  }
};

// Flush the log buffer
const flushLogs = (): void => {
  if (logBuffer.length === 0) return;
  
  const logsToSend = [...logBuffer];
  logBuffer.length = 0;
  
  sendLogs(logsToSend).catch(console.error);
  
  if (sendTimeout) {
    window.clearTimeout(sendTimeout);
    sendTimeout = null;
  }
};

// Schedule the buffer to be sent
const scheduleSend = (): void => {
  if (sendTimeout) return;
  
  sendTimeout = window.setTimeout(() => {
    flushLogs();
    sendTimeout = null;
  }, BUFFER_TIMEOUT);
};

// Add a log to the buffer
const addToBuffer = (entry: LogEntry): void => {
  logBuffer.push(entry);
  scheduleSend();
  
  // Immediately send if it's an error or if buffer is getting large
  if (entry.level === 'error' || logBuffer.length >= 10) {
    flushLogs();
  }
};

// Remote logger API
const remoteLogger = {
  // Log levels
  info: (message: string, data?: any): void => {
    addToBuffer(createLogEntry('info', message, data));
  },
  
  warn: (message: string, data?: any): void => {
    addToBuffer(createLogEntry('warn', message, data));
  },
  
  error: (message: string, data?: any): void => {
    addToBuffer(createLogEntry('error', message, data));
  },
  
  debug: (message: string, data?: any): void => {
    addToBuffer(createLogEntry('debug', message, data));
  },
  
  // Log with custom source
  custom: (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any, source?: string): void => {
    addToBuffer(createLogEntry(level, message, data, source));
  },
  
  // Log network errors
  network: (url: string, method: string, status: number, message: string, data?: any): void => {
    addToBuffer(createLogEntry('error', `Network ${method} ${url} failed (${status}): ${message}`, data, 'network'));
  },
  
  // Control remote logging
  enable: (): void => {
    isRemoteLoggingEnabled = true;
    console.log('Remote logging enabled');
  },
  
  disable: (): void => {
    isRemoteLoggingEnabled = false;
    console.log('Remote logging disabled');
  },
  
  isEnabled: (): boolean => {
    return isRemoteLoggingEnabled;
  },
  
  // Immediately send all buffered logs
  flush: flushLogs
};

// Set up console interceptors
if (typeof window !== 'undefined') {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  // Override console.error to capture errors
  console.error = function(...args: any[]) {
    // Call original method
    originalConsole.error.apply(console, args);
    
    // Log to remote if enabled
    if (isRemoteLoggingEnabled) {
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : 
        arg instanceof Error ? arg.message : 
        JSON.stringify(sanitizeData(arg))
      ).join(' ');
      
      remoteLogger.custom('error', message, args.length > 1 ? args.slice(1) : args[0], 'console');
    }
  };
  
  // Override console.warn to capture warnings
  console.warn = function(...args: any[]) {
    // Call original method
    originalConsole.warn.apply(console, args);
    
    // Log to remote if enabled
    if (isRemoteLoggingEnabled) {
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : 
        JSON.stringify(sanitizeData(arg))
      ).join(' ');
      
      remoteLogger.custom('warn', message, args.length > 1 ? args.slice(1) : args[0], 'console');
    }
  };
  
  // Set up error event listeners
  window.addEventListener('error', (event) => {
    remoteLogger.custom('error', `Uncaught error: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }, 'window');
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    remoteLogger.custom('error', `Unhandled promise rejection`, {
      reason: event.reason
    }, 'promise');
  });
  
  // Intercept fetch API
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const startTime = Date.now();
    const method = init?.method || 'GET';
    const url = typeof input === 'string' ? input : input.url;
    
    try {
      const response = await originalFetch.apply(window, [input, init]);
      
      // Log failed requests
      if (!response.ok) {
        remoteLogger.network(url, method, response.status, response.statusText, {
          duration: Date.now() - startTime,
          headers: init?.headers
        });
      }
      
      return response;
    } catch (error) {
      remoteLogger.network(url, method, 0, error.message, {
        duration: Date.now() - startTime,
        headers: init?.headers,
        error
      });
      throw error;
    }
  };
  
  // Intercept XMLHttpRequest
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    // @ts-ignore
    this._remoteLoggerData = {
      method,
      url: url.toString(),
      startTime: Date.now()
    };
    return originalXhrOpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    // @ts-ignore
    const logData = this._remoteLoggerData;
    
    if (logData) {
      this.addEventListener('load', function() {
        // @ts-ignore
        if (this.status >= 400) {
          remoteLogger.network(
            // @ts-ignore
            logData.url, 
            // @ts-ignore
            logData.method,
            // @ts-ignore
            this.status,
            // @ts-ignore
            `XHR failed with status: ${this.status}`,
            {
              // @ts-ignore
              duration: Date.now() - logData.startTime,
              // @ts-ignore
              responseText: this.responseText?.substring(0, 1000), // Truncate long responses
            }
          );
        }
      });
      
      this.addEventListener('error', function() {
        remoteLogger.network(
          // @ts-ignore
          logData.url,
          // @ts-ignore
          logData.method,
          0,
          'XHR network error',
          {
            // @ts-ignore
            duration: Date.now() - logData.startTime
          }
        );
      });
      
      this.addEventListener('timeout', function() {
        remoteLogger.network(
          // @ts-ignore
          logData.url,
          // @ts-ignore
          logData.method,
          0,
          'XHR timeout',
          {
            // @ts-ignore
            duration: Date.now() - logData.startTime
          }
        );
      });
    }
    
    return originalXhrSend.apply(this, args);
  };
  
  // Send logs before page unload
  window.addEventListener('beforeunload', () => {
    flushLogs();
  });
}

export default remoteLogger;