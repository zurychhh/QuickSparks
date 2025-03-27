// Konfiguracja API dla różnych środowisk

const isProd = process.env.NODE_ENV === 'production' || import.meta.env.PROD;

// Bazowe URL do API
const getBaseUrl = () => {
  // W produkcji używamy względnej ścieżki, która będzie obsługiwana przez proxy Vercel
  if (isProd) {
    return '/api';
  }
  // W środowisku deweloperskim łączymy się bezpośrednio z backendem
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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