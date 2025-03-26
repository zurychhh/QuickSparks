import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  initializeAnalytics,
  trackPageView,
  trackEvent,
  trackConversion,
  trackException,
  identifyUser,
  trackPurchase,
} from '@utils/analytics';

// Hard-coded measurement ID that matches the one in index.html
const GA_MEASUREMENT_ID = 'G-5QXBPJFCLS';

/**
 * Hook for using analytics throughout the application
 */
export const useAnalytics = () => {
  const location = useLocation();

  // Initialize analytics once when the app loads
  useEffect(() => {
    try {
      if (GA_MEASUREMENT_ID) {
        initializeAnalytics(GA_MEASUREMENT_ID);
        console.log('Analytics initialized successfully');
      }
    } catch (error) {
      // Gracefully handle initialization errors
      console.warn('Failed to initialize analytics:', error);
    }
  }, []);

  // Track page views when the route changes
  useEffect(() => {
    try {
      trackPageView({
        path: location.pathname,
        title: document.title,
      });
    } catch (error) {
      // Silently handle tracking errors
      console.warn('Failed to track page view:', error);
    }
  }, [location.pathname]);

  // Wrap all tracking functions in try-catch to prevent errors from breaking the app
  const safeTrackEvent = (...args) => {
    try {
      return trackEvent(...args);
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  };

  const safeTrackConversion = (...args) => {
    try {
      return trackConversion(...args);
    } catch (error) {
      console.warn('Failed to track conversion:', error);
    }
  };

  const safeTrackException = (...args) => {
    try {
      return trackException(...args);
    } catch (error) {
      console.warn('Failed to track exception:', error);
    }
  };

  const safeIdentifyUser = (...args) => {
    try {
      return identifyUser(...args);
    } catch (error) {
      console.warn('Failed to identify user:', error);
    }
  };

  const safeTrackPurchase = (...args) => {
    try {
      return trackPurchase(...args);
    } catch (error) {
      console.warn('Failed to track purchase:', error);
    }
  };

  return {
    trackEvent: safeTrackEvent,
    trackConversion: safeTrackConversion,
    trackException: safeTrackException,
    identifyUser: safeIdentifyUser,
    trackPurchase: safeTrackPurchase,
  };
};

export default useAnalytics;