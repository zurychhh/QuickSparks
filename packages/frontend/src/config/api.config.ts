// Konfiguracja API dla różnych środowisk

// Używamy różnych bazowych adresów URL w zależności od środowiska
const getBaseUrl = () => {
  // W środowisku produkcyjnym używamy relatywnego URL - proxy Vercel zajmie się resztą
  if (process.env.NODE_ENV === 'production' || import.meta.env.PROD) {
    return '/api';
  }

  // W środowisku deweloperskim używamy localhost lub podanego adresu
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

export const API_CONFIG = {
  baseUrl: getBaseUrl(),
  timeout: 30000,  // 30 sekund timeout
  endpoints: {
    conversion: '/conversion', 
    status: '/conversions',
    download: '/download',
    thumbnails: '/thumbnails',
    payments: '/payment',
    auth: '/auth'
  }
};

// Pomocnicza funkcja do logowania w trybie debug
export const logDebug = (message: string, data?: any) => {
  if (!import.meta.env.PROD) {
    console.log(`[PDFSpark API] ${message}`, data);
  }
};

/**
 * Normalizes URLs to ensure they always have the correct format
 * 
 * @param url The URL to normalize
 * @returns Normalized URL with proper base path
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Log the URL before processing
  logDebug(`Normalizing URL: ${url}`);

  // If it's already a full URL, return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    logDebug(`URL is already absolute, keeping as is: ${url}`);
    return url;
  }

  // Handle URLs with API path
  if (url.startsWith('/api/')) {
    const baseUrl = API_CONFIG.baseUrl;
    
    // If baseUrl already ends with /api, we don't want to duplicate it
    if (baseUrl.endsWith('/api')) {
      const normalized = `${baseUrl}${url.substring(4)}`;
      logDebug(`Normalized API URL: ${normalized}`);
      return normalized;
    }
    
    const normalized = `${baseUrl}${url.substring(4)}`;
    logDebug(`Normalized API URL: ${normalized}`);
    return normalized;
  }

  // Handle other absolute paths
  if (url.startsWith('/')) {
    const normalized = `${window.location.origin}${url}`;
    logDebug(`Normalized absolute path: ${normalized}`);
    return normalized;
  }

  // Handle relative paths by appending to API baseUrl
  const normalized = `${API_CONFIG.baseUrl}/${url}`;
  logDebug(`Normalized relative path: ${normalized}`);
  return normalized;
};