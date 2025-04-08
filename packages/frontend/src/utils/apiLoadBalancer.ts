/**
 * Load balancer utility for API requests
 * 
 * This utility rotates between multiple backend servers for API requests
 * to distribute load and provide fallback in case of server failure.
 */

// Define the real server endpoints - always use relative path in production
// to prevent mixed content issues when page is served over HTTPS
const API_SERVERS = [
  '/api' // Use Vercel proxy in production to avoid mixed content warnings
];

// Health status of each server
const serverStatus: { [key: string]: boolean } = {};

// Initialize all servers as healthy
API_SERVERS.forEach(server => {
  serverStatus[server] = true;
});

// Current server index for round-robin rotation
let currentServerIndex = 0;

/**
 * Gets the API endpoint path (always use proxy in production)
 * @returns URL of the API endpoint
 */
export const getNextServer = (): string => {
  // In production, always use relative path to avoid mixed content issues
  return '/api';
};

/**
 * Mark a server as unhealthy
 * @param serverUrl URL of the unhealthy server
 */
export const markServerUnhealthy = (serverUrl: string): void => {
  if (serverUrl in serverStatus) {
    serverStatus[serverUrl] = false;
    console.warn(`API server marked unhealthy: ${serverUrl}`);
  }
};

/**
 * Mark a server as healthy
 * @param serverUrl URL of the healthy server
 */
export const markServerHealthy = (serverUrl: string): void => {
  if (serverUrl in serverStatus) {
    serverStatus[serverUrl] = true;
    console.log(`API server restored: ${serverUrl}`);
  }
};

/**
 * Check health of API server using relative path to prevent mixed content issues
 * @returns Promise resolving when server has been checked
 */
export const checkAllServers = async (): Promise<void> => {
  // Use the API proxy endpoint for health checks
  try {
    const server = API_SERVERS[0]; // We only have one server in production
    const healthEndpoint = `${server}/health`;
    
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Short timeout to quickly identify unresponsive servers
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      markServerHealthy(server);
    } else {
      markServerUnhealthy(server);
    }
  } catch (error) {
    // Mark server as unhealthy
    markServerUnhealthy(API_SERVERS[0]);
    console.error('Health check failed:', error);
  }
};

/**
 * Get all server statuses
 * @returns Object with server URLs as keys and boolean health status as values
 */
export const getServerStatuses = (): { [key: string]: boolean } => {
  return { ...serverStatus };
};

// Perform initial health check
checkAllServers().catch(console.error);

// Schedule periodic health checks (every 30 seconds)
setInterval(() => {
  checkAllServers().catch(console.error);
}, 30000);

export default {
  getNextServer,
  markServerUnhealthy,
  markServerHealthy,
  checkAllServers,
  getServerStatuses
};