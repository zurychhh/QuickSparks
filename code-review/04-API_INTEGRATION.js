/**
 * 04-API_INTEGRATION.js
 * 
 * This file contains the API integration implementation between frontend and backend.
 */

// Frontend API Service
// ===============
// packages/frontend/src/services/api.ts
const apiService = `
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import apiConfig from '../config/api.config';

/**
 * Main API service for handling HTTP requests to the backend
 */
class ApiService {
  private instance: AxiosInstance;
  
  constructor() {
    // Create axios instance with base configuration
    this.instance = axios.create({
      baseURL: apiConfig.baseUrl,
      timeout: 30000, // 30 seconds
      withCredentials: true, // Important for cookies and auth
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Request interceptor for adding auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle specific error cases
        if (error.response) {
          const { status } = error.response;
          
          // Handle authentication errors
          if (status === 401) {
            localStorage.removeItem('auth_token');
            // Redirect to login or show auth error
          }
          
          // Handle server errors
          if (status >= 500) {
            console.error('Server error:', error.response.data);
            // Show server error notification
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Make a GET request
   */
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }
  
  /**
   * Make a POST request
   */
  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }
  
  /**
   * Make a PUT request
   */
  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }
  
  /**
   * Make a DELETE request
   */
  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }
  
  /**
   * Upload a file with progress tracking
   */
  public uploadFile<T = any>(
    url: string, 
    file: File, 
    onProgress?: (percentage: number) => void,
    additionalData?: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    return this.instance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      }
    });
  }
}

// Create and export single instance
const apiService = new ApiService();
export default apiService;
`;

// Backend API Setup
// =============
// packages/conversion-service/src/index.ts
const backendApi = `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';
import routes from './routes';
import { setupWebSocketHandlers } from './controllers/websocketController';
import { connectToDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { setupFileCleanup } from './utils/fileCleanup';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// CORS configuration for API requests
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins
    const allowedOrigins = [
      // Allow frontend in various environments
      env.FRONTEND_URL,
      'http://localhost:5173',  // Vite dev server
      'https://pdfspark.vercel.app',
      // Allow API testing tools
      'https://www.postman.com',
      'https://insomnia.rest'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Security middleware
app.use(helmet());

// Request logging
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// WebSocket setup
const io = new Server(httpServer, {
  cors: corsOptions
});

// Setup WebSocket handlers
setupWebSocketHandlers(io);

// Connect to database
connectToDatabase()
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start the server
    const PORT = env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Set up scheduled file cleanup
    setupFileCleanup();
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

export { app, httpServer, io };
`;

// API Routes Setup
// =============
// packages/conversion-service/src/routes/index.ts
const apiRoutes = `
import { Router } from 'express';
import conversionRoutes from './conversion.routes';
import downloadRoutes from './download.routes';
import paymentRoutes from './payment.routes';
import thumbnailRoutes from './thumbnail.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mount sub-routes
router.use('/conversion', conversionRoutes);
router.use('/download', downloadRoutes);
router.use('/payment', paymentRoutes);
router.use('/thumbnails', thumbnailRoutes);
router.use('/health', healthRoutes);

export default router;
`;

// Frontend API Usage Example
// ======================
// Example of how the API is used in the frontend
const apiUsageExample = `
import { useState } from 'react';
import apiService from '../services/api';
import apiConfig from '../config/api.config';

function FileUploadComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversionId, setConversionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (!selectedFile) return;
    
    // Validate file size
    if (selectedFile.size > apiConfig.maxFileSize) {
      setError(`File size exceeds the maximum allowed size (${apiConfig.maxFileSize / (1024 * 1024)}MB)`);
      return;
    }
    
    // Validate file type
    const isPdf = apiConfig.supportedTypes.pdf.includes(selectedFile.type);
    const isDocx = apiConfig.supportedTypes.docx.includes(selectedFile.type);
    
    if (!isPdf && !isDocx) {
      setError('File type not supported. Please upload a PDF or DOCX file.');
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    try {
      setIsUploading(true);
      setProgress(0);
      
      // Get desired conversion type based on file type
      const isPdf = apiConfig.supportedTypes.pdf.includes(file.type);
      const conversionType = isPdf ? 'pdf-to-docx' : 'docx-to-pdf';
      
      // Upload file and track progress
      const response = await apiService.uploadFile(
        apiConfig.endpoints.conversion,
        file,
        (percentage) => setProgress(percentage),
        { conversionType }
      );
      
      // Store conversion ID for status tracking
      setConversionId(response.data.conversionId);
      
      // Connect to WebSocket for real-time updates
      // (Implemented in a separate component)
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      
      {error && <div className="error">{error}</div>}
      
      <button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      
      {isUploading && (
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
          <span>{progress}%</span>
        </div>
      )}
      
      {conversionId && (
        <div className="conversion-info">
          Conversion in progress. ID: {conversionId}
        </div>
      )}
    </div>
  );
}
`;

// WebSocket Integration
// ==================
// packages/frontend/src/services/websocket.ts
const websocketService = `
import { io, Socket } from 'socket.io-client';
import apiConfig from '../config/api.config';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  
  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.socket) return;
    
    // Extract base URL from API config (remove /api suffix)
    const baseUrl = apiConfig.baseUrl.replace(/\/api$/, '');
    
    this.socket = io(baseUrl, {
      transports: ['websocket'],
      withCredentials: true,
      auth: {
        token: localStorage.getItem('auth_token')
      }
    });
    
    // Setup default listeners
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log(`WebSocket disconnected: ${reason}`);
    });
    
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Set up reconnection logic
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (!this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
  }
  
  /**
   * Subscribe to conversion status updates
   */
  public subscribeToConversion(conversionId: string, callback: (data: any) => void): void {
    if (!this.socket) this.connect();
    
    // Join conversion room
    this.socket?.emit('join-conversion', { conversionId });
    
    // Listen for conversion updates
    const eventName = `conversion-status-${conversionId}`;
    this.addListener(eventName, callback);
    
    this.socket?.on(eventName, callback);
  }
  
  /**
   * Unsubscribe from conversion status updates
   */
  public unsubscribeFromConversion(conversionId: string): void {
    if (!this.socket) return;
    
    // Leave conversion room
    this.socket.emit('leave-conversion', { conversionId });
    
    // Remove listener
    const eventName = `conversion-status-${conversionId}`;
    this.removeAllListeners(eventName);
  }
  
  /**
   * Add event listener
   */
  private addListener(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
  }
  
  /**
   * Remove all listeners for an event
   */
  private removeAllListeners(event: string): void {
    if (!this.socket) return;
    
    // Remove socket listeners
    this.socket.off(event);
    
    // Remove internal listeners
    this.listeners.delete(event);
  }
}

// Create and export single instance
const websocketService = new WebSocketService();
export default websocketService;
`;