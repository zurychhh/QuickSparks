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
    convert: '/conversions/upload',
    status: '/conversions',
    download: '/downloads/token',
    thumbnails: '/thumbnails',
    payments: '/payments'
  }
};

// Pomocnicza funkcja do logowania w trybie debug
export const logDebug = (message: string, data?: any) => {
  if (!import.meta.env.PROD) {
    console.log(`[PDFSpark API] ${message}`, data);
  }
};