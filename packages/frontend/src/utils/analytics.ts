import { UserConfig } from '@sentry/react';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
}

interface PageView {
  path: string;
  title?: string;
}

interface UserProperties {
  userId?: string;
  traits?: Record<string, any>;
}

// Initialize GA4 (Google Analytics 4)
export const initializeAnalytics = (measurementId: string): void => {
  try {
    if (!measurementId) {
      console.warn('Google Analytics measurement ID is not provided');
      return;
    }

    // Check if GA is already initialized
    if (window.gtag) {
      console.log('Google Analytics already initialized');
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    // Initialize with current date
    gtag('js', new Date());
    
    // Configure the measurement ID
    gtag('config', measurementId, {
      send_page_view: false, // We'll track page views manually for SPA
    });

    // Add Google Analytics script dynamically with error handling
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    
    script.onerror = () => {
      console.warn('Failed to load Google Analytics script. This may be due to an ad blocker or network issue.');
    };
    
    // Add the script to the head
    document.head.appendChild(script);
    
    console.log('Google Analytics initialization started');
  } catch (error) {
    console.warn('Error during Google Analytics initialization:', error);
  }
};

// Track a page view in GA4
export const trackPageView = ({ path, title }: PageView): void => {
  try {
    if (typeof window.gtag !== 'function') {
      // console.warn('Google Analytics not initialized when trying to track page view');
      return;
    }

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
    
    // console.log(`Page view tracked: ${path}`);
  } catch (error) {
    console.warn('Error tracking page view:', error);
  }
};

// Track custom events in GA4
export const trackEvent = ({
  category,
  action,
  label,
  value,
  nonInteraction = false,
}: AnalyticsEvent): void => {
  try {
    if (typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      non_interaction: nonInteraction,
    });
  } catch (error) {
    console.warn('Error tracking event:', error);
  }
};

// Track conversion events
export const trackConversion = (conversionId: string, label?: string): void => {
  try {
    if (typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('event', 'conversion', {
      send_to: `${conversionId}/${label || ''}`,
    });
  } catch (error) {
    console.warn('Error tracking conversion:', error);
  }
};

// Track exception events
export const trackException = (description: string, fatal: boolean = false): void => {
  try {
    if (typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('event', 'exception', {
      description,
      fatal,
    });
  } catch (error) {
    console.warn('Error tracking exception:', error);
  }
};

// Identify user properties
export const identifyUser = ({ userId, traits }: UserProperties): void => {
  try {
    if (typeof window.gtag !== 'function') {
      return;
    }

    if (userId) {
      window.gtag('set', 'user_properties', {
        user_id: userId,
        ...traits,
      });
    }
  } catch (error) {
    console.warn('Error identifying user:', error);
  }
};

// Track e-commerce events
export const trackPurchase = (transaction: {
  id: string;
  value: number;
  currency: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}): void => {
  try {
    if (typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('event', 'purchase', {
      transaction_id: transaction.id,
      value: transaction.value,
      currency: transaction.currency,
      items: transaction.items,
    });
  } catch (error) {
    console.warn('Error tracking purchase:', error);
  }
};

// Define window gtag property
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}