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
    const trustedDomains = [
      // Add your own domains or subdomains
      'pdfspark.app',
      'pdfspark-conversion-service.onrender.com',
      'assets.pdfspark.app',
      // Add localhost for development
      'localhost'
    ];
    
    return trustedDomains.some(domain => 
      urlObj.hostname === domain || 
      urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch (e) {
    return false;
  }
};