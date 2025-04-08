import { ReportHandler } from 'web-vitals';
import * as Sentry from '@sentry/react';
import { trackEvent } from './analytics';

// Initialize performance monitoring
export function initWebVitals(): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Record First Input Delay
    import('web-vitals').then(({ onFID }) => {
      onFID(reportWebVital);
    });
    
    // Record Largest Contentful Paint
    import('web-vitals').then(({ onLCP }) => {
      onLCP(reportWebVital);
    });
    
    // Record Cumulative Layout Shift
    import('web-vitals').then(({ onCLS }) => {
      onCLS(reportWebVital);
    });
    
    // Record First Contentful Paint
    import('web-vitals').then(({ onFCP }) => {
      onFCP(reportWebVital);
    });
    
    // Record Time to First Byte
    import('web-vitals').then(({ onTTFB }) => {
      onTTFB(reportWebVital);
    });
  }
}

// Report Web Vitals to analytics and Sentry
function reportWebVital(metric: any): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
  
  // Send to Google Analytics
  trackEvent({
    category: 'Web Vitals',
    action: metric.name,
    value: Math.round(metric.value),
    label: metric.id,
    nonInteraction: true
  });
  
  // Send to Sentry
  Sentry.captureMessage(`${metric.name}: ${metric.value}`, {
    level: 'info',
    tags: {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_id: metric.id
    }
  });
}

// Convenience function to report all Web Vitals
export function reportWebVitals(onPerfEntry?: ReportHandler): void {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
}

export default initWebVitals;