/**
 * Logging utility for QuickSparks services
 * 
 * Provides a consistent logging interface across all services.
 */

/**
 * Creates a logger with the specified configuration
 * @param {Object} config - Logger configuration
 * @param {string} config.level - Log level (debug, info, warn, error)
 * @param {string} config.format - Log format (json, pretty)
 * @param {string} config.serviceName - Name of the service
 * @returns {Object} Logger instance
 */
function createLogger(config) {
  // Default configuration
  const {
    level = 'info',
    format = 'pretty',
    serviceName = 'quicksparks',
  } = config;

  // Validate log level
  const validLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLevels.includes(level)) {
    console.warn(`Invalid log level: ${level}, defaulting to 'info'`);
  }

  // Level to numeric value mapping
  const levelValue = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  // Determine if a message should be logged based on level
  const shouldLog = (messageLevel) => {
    return levelValue[messageLevel] >= levelValue[validLevels.includes(level) ? level : 'info'];
  };

  // Get current ISO timestamp
  const getTimestamp = () => new Date().toISOString();

  // Format message based on format setting
  const formatMessage = (messageLevel, message, meta = {}) => {
    const timestamp = getTimestamp();
    
    // Add service name and timestamp to metadata
    const fullMeta = {
      ...meta,
      service: serviceName,
      timestamp,
    };
    
    if (format === 'json') {
      return JSON.stringify({
        level: messageLevel,
        message,
        ...fullMeta,
      });
    } else {
      // Pretty format with colors
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
        reset: '\x1b[0m',  // Reset
      };
      
      const coloredLevel = `${colors[messageLevel]}${messageLevel.toUpperCase()}${colors.reset}`;
      const metaStr = Object.keys(meta).length > 0 
        ? `\n${JSON.stringify(meta, null, 2)}`
        : '';
      
      return `${timestamp} [${coloredLevel}] [${serviceName}]: ${message}${metaStr}`;
    }
  };

  // Create logger methods
  return {
    debug: (message, meta = {}) => {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message, meta));
      }
    },
    
    info: (message, meta = {}) => {
      if (shouldLog('info')) {
        console.info(formatMessage('info', message, meta));
      }
    },
    
    warn: (message, meta = {}) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message, meta));
      }
    },
    
    error: (message, meta = {}) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message, meta));
      }
    },
    
    // Helper method to create a child logger with additional context
    child: (additionalMeta = {}) => {
      return createLogger({
        ...config,
        childContext: additionalMeta,
      });
    },
  };
}

module.exports = {
  createLogger,
};