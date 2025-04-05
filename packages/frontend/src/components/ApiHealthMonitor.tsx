import React, { useEffect, useState } from 'react';
import { checkApiHealth } from '../services/api';
import { useFeedback } from '../context/FeedbackContext';

interface ApiHealthMonitorProps {
  onStatusChange?: (isHealthy: boolean) => void;
  checkInterval?: number; // in milliseconds
  showMessage?: boolean;
}

/**
 * Component that monitors API health status
 * Can be added to layouts or app root to provide ongoing health monitoring
 */
const ApiHealthMonitor: React.FC<ApiHealthMonitorProps> = ({
  onStatusChange,
  checkInterval = 60000, // Default check every minute
  showMessage = false,
}) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const feedbackContext = useFeedback();

  // Function to check API health
  const checkHealth = async () => {
    if (isLoading) return; // Prevent concurrent checks
    
    setIsLoading(true);
    
    try {
      const healthStatus = await checkApiHealth();
      setIsHealthy(healthStatus.isHealthy);
      setLastChecked(new Date());
      setErrorMessage(healthStatus.isHealthy ? null : healthStatus.message || null);
      
      // Call status change callback if provided
      if (onStatusChange) {
        onStatusChange(healthStatus.isHealthy);
      }
      
      // Show user feedback if requested and API is unhealthy
      if (showMessage && !healthStatus.isHealthy) {
        feedbackContext.showFeedback(
          'error',
          `API Connection Issue: ${healthStatus.message || 'Cannot connect to the service'}`, 
          8000
        );
      }
    } catch (error) {
      console.error('Error checking API health:', error);
      setIsHealthy(false);
      setLastChecked(new Date());
      setErrorMessage('Failed to check API health');
      
      if (onStatusChange) {
        onStatusChange(false);
      }
      
      if (showMessage) {
        feedbackContext.showFeedback(
          'error',
          'Cannot connect to the conversion service. Please try again later.',
          8000
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial health check
  useEffect(() => {
    checkHealth();
    
    // Set up interval for ongoing checks
    const intervalId = setInterval(checkHealth, checkInterval);
    
    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [checkInterval]);

  // This component doesn't render anything visible
  // It only monitors API health and triggers callbacks/feedback
  return null;
};

export default ApiHealthMonitor;