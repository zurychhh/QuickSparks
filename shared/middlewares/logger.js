/**
 * Logging middleware for QuickSparks services
 * 
 * Provides consistent request logging across all services.
 */

/**
 * Creates an Express middleware for request logging
 * @param {Object} logger - Logger instance
 * @returns {Function} Express middleware
 */
function createRequestLogger(logger) {
  return (req, res, next) => {
    // Generate a unique request ID if not already present
    req.id = req.id || req.headers['x-request-id'] || generateRequestId();
    
    // Store the start time
    const startTime = Date.now();
    
    // Store original URL before any modifications
    const originalUrl = req.originalUrl || req.url;
    
    // Add logger to request for use in other middleware/routes
    req.logger = logger;
    
    // Log the request
    logger.info(`Incoming request`, {
      method: req.method,
      url: originalUrl,
      requestId: req.id,
      userAgent: req.get('user-agent'),
      ip: getClientIp(req),
    });
    
    // Function to log response after it's sent
    const logResponse = () => {
      // Calculate request duration
      const duration = Date.now() - startTime;
      
      // Get response status code
      const statusCode = res.statusCode;
      
      // Log at appropriate level based on status code
      const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
      
      logger[logLevel](`Response sent`, {
        method: req.method,
        url: originalUrl,
        statusCode,
        duration,
        requestId: req.id,
        contentLength: res.get('content-length'),
      });
    };
    
    // Listen for response finish event
    res.on('finish', logResponse);
    
    // Add response header with request ID for debugging
    res.setHeader('X-Request-ID', req.id);
    
    next();
  };
}

/**
 * Generates a unique request ID
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

/**
 * Gets the client IP address
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket?.remoteAddress;
}

module.exports = {
  createRequestLogger,
};