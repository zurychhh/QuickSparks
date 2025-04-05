import DOMPurify from 'dompurify';

/**
 * Utility function for consistent sanitization of user-provided content
 * @param content - The content to sanitize
 * @param options - Optional configuration for sanitization
 * @returns Sanitized content string
 */
export const sanitize = (content: string | null | undefined, options?: {
  allowedTags?: string[];
  allowedAttrs?: string[];
}): string => {
  if (!content) return '';
  
  const config = {
    ALLOWED_TAGS: options?.allowedTags || ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: options?.allowedAttrs || [],
  };
  
  return DOMPurify.sanitize(content, config);
};

/**
 * Validates if a URL is safe (from trusted domains)
 * @param url - The URL to validate
 * @returns Boolean indicating if URL is safe
 */
export const isSafeUrl = (url: string): boolean => {
  // Skip validation if URL is relative
  if (url.startsWith('/')) return true;
  
  try {
    const urlObj = new URL(url);
    
    // Read trusted domains from environment if available
    const envTrustedDomains = import.meta.env.VITE_TRUSTED_DOMAINS 
      ? import.meta.env.VITE_TRUSTED_DOMAINS.split(',').map((d: string) => d.trim())
      : [];
    
    // Default trusted domains with environment domains
    const trustedDomains = [
      // Add your own domains or subdomains
      'pdfspark.app',
      'pdfspark-conversion-service.onrender.com',
      'pdfspark-api.onrender.com',
      'assets.pdfspark.app',
      // Current domain from window.location for same-origin URLs
      window.location.hostname,
      // Add localhost for development
      'localhost',
      // Add environment-configured domains
      ...envTrustedDomains
    ];
    
    // Protocol check - only allow https (except for localhost/development)
    const isSecureProtocol = urlObj.protocol === 'https:' || 
      (urlObj.protocol === 'http:' && 
        (urlObj.hostname === 'localhost' || urlObj.hostname.startsWith('127.0.0.1')));
    
    if (!isSecureProtocol) {
      console.warn(`Unsafe protocol in URL: ${url}`);
      return false;
    }
    
    // Domain check - must be in trusted domains
    const isTrustedDomain = trustedDomains.some(domain => 
      urlObj.hostname === domain || 
      urlObj.hostname.endsWith(`.${domain}`)
    );
    
    if (!isTrustedDomain) {
      console.warn(`Untrusted domain in URL: ${url}`);
    }
    
    return isTrustedDomain;
  } catch (e) {
    console.error(`Invalid URL format: ${url}`, e);
    return false;
  }
};