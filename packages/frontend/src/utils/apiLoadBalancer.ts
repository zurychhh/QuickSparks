/**
 * Load balancer utility for API requests
 * 
 * This utility rotates between multiple backend servers for API requests
 * to distribute load and provide fallback in case of server failure.
 */

// Define the real server endpoints
const API_SERVERS = [
  'http://18.156.158.53:5000/api',
  'http://18.156.42.200:5000/api',
  'http://52.59.103.54:5000/api'
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
 * Gets the next available healthy server in round-robin fashion
 * @returns URL of the next server endpoint
 */
export const getNextServer = (): string => {
  const healthyServers = API_SERVERS.filter(server => serverStatus[server]);
  
  // If no healthy servers, return the first one (better than nothing)
  if (healthyServers.length === 0) {
    return API_SERVERS[0];
  }
  
  // Rotate between healthy servers
  currentServerIndex = (currentServerIndex + 1) % healthyServers.length;
  return healthyServers[currentServerIndex];
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
 * Check health of all servers
 * @returns Promise resolving when all servers have been checked
 */
export const checkAllServers = async (): Promise<void> => {
  await Promise.all(API_SERVERS.map(async (server) => {
    try {
      const response = await fetch(`${server}/health`, {
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
      markServerUnhealthy(server);
    }
  }));
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