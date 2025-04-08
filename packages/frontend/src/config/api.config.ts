// Konfiguracja API dla różnych środowisk

const isProd = process.env.NODE_ENV === 'production' || import.meta.env.PROD;

// Import the load balancer (will be used in production)
import { getNextServer } from '../utils/apiLoadBalancer';

// Bazowe URL do API
const getBaseUrl = () => {
  // In production, we can use either:
  // 1. Vercel's proxy (which will route through vercel.json rules)
  // 2. Direct connection to backend servers via load balancer
  if (isProd) {
    // Always use relative path for API to prevent mixed content issues
    return '/api';
  }
  // W środowisku deweloperskim łączymy się bezpośrednio z backendem
  // Always use HTTPS in production, HTTP only for local development
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

// Get WebSocket URL based on environment
const getWebSocketUrl = () => {
  // In production
  if (isProd) {
    // Always use relative WebSocket URL to prevent mixed content issues
    return '/socket.io';
  }
  // In development environment, connect directly to the backend WebSocket endpoint
  return import.meta.env.VITE_WS_URL || 'ws://localhost:5000/api/ws';
};

// Helper function to normalize URL paths
export const normalizeUrlPath = (url: string): string => {
  // Make sure URL starts with a slash
  const urlWithLeadingSlash = url.startsWith('/') ? url : `/${url}`;
  // Make sure URL ends with a slash for API consistency
  return urlWithLeadingSlash.endsWith('/') ? urlWithLeadingSlash : `${urlWithLeadingSlash}/`;
};

export const API_CONFIG = {
  baseUrl: getBaseUrl(),
  WS_URL: getWebSocketUrl(),
  timeout: 30000,  // 30 sekund timeout
  endpoints: {
    convert: '/conversions/upload/',
    status: '/conversions/',
    download: '/downloads/token/',
    thumbnails: '/thumbnails/',
    payments: '/payments/',
    health: '/health/',
    corsTest: '/cors-test/',        // Endpoint testowy
    debugHeaders: '/debug-headers/' // Endpoint diagnostyczny
  }
};

// Pomocnicza funkcja do logowania w trybie debug
export const logDebug = (message: string, data?: any) => {
  if (!import.meta.env.PROD) {
    console.log(`[PDFSpark API] ${message}`, data);
  }
};