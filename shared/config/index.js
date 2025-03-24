/**
 * Configuration loader for QuickSparks services
 * 
 * Loads configuration from default.js and merges with environment-specific overrides
 * and environment variables.
 */

const defaultConfig = require('./default');

/**
 * Recursively merges two objects
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (typeof result[key] !== 'object') {
        result[key] = {};
      }
      result[key] = deepMerge(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Loads service-specific configuration
 * @param {string} serviceName - Name of the service (e.g. 'pdf', 'image')
 * @returns {Object} Configuration object
 */
function loadConfig(serviceName = '') {
  // Start with default config
  let config = { ...defaultConfig };

  // Set service name for logging
  if (serviceName) {
    config.logger.serviceName = `quicksparks-${serviceName}`;
  }

  // Try to load environment-specific config
  const nodeEnv = process.env.NODE_ENV || 'development';
  try {
    // Using dynamic require for environment-specific config
    const envConfig = require(`./${nodeEnv}`);
    config = deepMerge(config, envConfig);
  } catch (err) {
    // No environment config found, using defaults
  }

  // Try to load service-specific config if specified
  if (serviceName) {
    try {
      // Using dynamic require for service-specific config
      const serviceConfig = require(`./${serviceName}`);
      config = deepMerge(config, serviceConfig);
    } catch (err) {
      // No service-specific config found, using defaults
    }
  }

  return config;
}

module.exports = {
  loadConfig,
  defaultConfig,
};