import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

/**
 * ServiceStatus component that displays the current health status of the API services
 * This component regularly checks service health and provides visual feedback
 */
const ServiceStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'operational' | 'degraded' | 'error'>('checking');
  const [services, setServices] = useState<Record<string, string>>({});
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const checkServices = async () => {
    setStatus('checking');
    try {
      const healthData = await apiService.checkHealth();
      
      if (healthData.status) {
        setStatus(healthData.status as any);
      } else {
        setStatus(healthData.isHealthy ? 'operational' : 'error');
      }
      
      if (healthData.services) {
        setServices(healthData.services);
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking service status:', error);
      setStatus('error');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Initial check
    checkServices();
    
    // Set up interval to check every 5 minutes
    const interval = setInterval(checkServices, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);

  // Get status color based on current status
  const getStatusColor = () => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'checking':
      default:
        return 'bg-gray-300';
    }
  };

  // Get the message to display
  const getStatusMessage = () => {
    switch (status) {
      case 'operational':
        return 'All services operational';
      case 'degraded':
        return 'Some services degraded';
      case 'error':
        return 'Service status unavailable';
      case 'checking':
      default:
        return 'Checking service status...';
    }
  };

  return (
    <div className={`service-status border rounded-md overflow-hidden ${status === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="p-3 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${getStatusColor()}`}></div>
          <span className="text-sm font-medium">{getStatusMessage()}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {lastChecked && (
            <span className="text-xs text-gray-500">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              checkServices();
            }}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
            aria-label="Refresh status"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button 
            className="text-gray-500 focus:outline-none"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            <svg className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 text-sm">
          <div className="space-y-2">
            {Object.keys(services).length > 0 ? (
              <>
                <h4 className="font-medium text-xs uppercase tracking-wider text-gray-500">Services</h4>
                <ul className="space-y-1">
                  {Object.entries(services).map(([name, serviceStatus]) => (
                    <li key={name} className="flex items-center justify-between">
                      <span>{name}</span>
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs
                        ${serviceStatus === 'up' ? 'bg-green-100 text-green-800' : 
                          serviceStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}
                      `}>
                        {serviceStatus}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-gray-600 text-sm">No detailed service information available.</p>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              If you're experiencing issues, please try again later or contact support.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceStatus;