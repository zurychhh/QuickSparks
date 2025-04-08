import React, { useState, useEffect } from 'react';
import { getServerStatuses } from '../../utils/apiLoadBalancer';
import api from '../../services/api';

/**
 * Component to monitor and display API health status
 */
const ApiHealthMonitor: React.FC = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [statusDetail, setStatusDetail] = useState<string>('Checking...');
  const [expanded, setExpanded] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<{[key: string]: boolean}>({});

  // Check API status
  const checkApiStatus = async () => {
    try {
      const healthResponse = await api.checkApiHealth();
      setIsHealthy(healthResponse.isHealthy);
      
      if (healthResponse.isHealthy) {
        setStatusDetail('API services operational');
      } else {
        setStatusDetail(healthResponse.message || 'API services unavailable');
      }
      
      // Get server statuses
      const servers = getServerStatuses();
      setServerStatus(servers);
    } catch (error) {
      setIsHealthy(false);
      setStatusDetail('Failed to connect to API');
    }
  };

  // Check on load
  useEffect(() => {
    checkApiStatus();
    
    // Set up interval to check every 60 seconds
    const intervalId = setInterval(checkApiStatus, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Indicator styling
  const indicatorClass = isHealthy === null 
    ? 'bg-gray-400' // Initial state
    : isHealthy 
      ? 'bg-green-500' // Healthy
      : 'bg-red-500';  // Unhealthy

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-md p-3 text-sm">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${indicatorClass}`}></div>
          <span className="font-medium">{statusDetail}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              checkApiStatus();
            }}
            className="text-xs text-primary-600 hover:text-primary-700 p-1 rounded hover:bg-gray-100"
          >
            Refresh
          </button>
          
          <svg 
            className={`h-5 w-5 text-gray-400 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">Service Diagnostics</h4>
          
          {/* Show relative backend API path */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-1">API Endpoint</p>
            <code className="block text-xs bg-gray-100 p-1 rounded">/api</code>
          </div>
          
          {Object.keys(serverStatus).length > 0 ? (
            <div className="text-xs space-y-1">
              <p className="text-gray-600 mb-1">Load Balancer Status:</p>
              {Object.entries(serverStatus).map(([server, status]) => {
                // Format server URL for display (hiding IP)
                const displayUrl = server.includes('localhost') ? 
                  server : 
                  'Remote API Server';
                
                return (
                  <div key={server} className="flex justify-between">
                    <span>{displayUrl}</span>
                    <span 
                      className={`px-1.5 py-0.5 rounded-full ${
                        status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {status ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No detailed server status available.</p>
          )}
          
          <div className="mt-3 pt-2 text-xs text-gray-500 border-t border-gray-100">
            <p>Using proxy mode for API requests.</p>
            {!isHealthy && (
              <p className="mt-1 text-amber-600">
                Backend services may be unavailable. File conversion functionality could be limited.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiHealthMonitor;