import { EventEmitter } from 'events';
import logger from '../utils/logger';

// Create a global event emitter
const eventEmitter = new EventEmitter();

// Increase the maximum number of listeners
eventEmitter.setMaxListeners(100);

// Event types
export enum NotificationEventType {
  CONVERSION_STATUS_CHANGED = 'conversion:status_changed',
  CONVERSION_COMPLETED = 'conversion:completed',
  CONVERSION_FAILED = 'conversion:failed',
  CONVERSION_STARTED = 'conversion:started',
  FILE_UPLOAD_COMPLETED = 'file:upload_completed',
  FILE_DELETED = 'file:deleted',
  PAYMENT_STATUS_CHANGED = 'payment:status_changed',
  PAYMENT_COMPLETED = 'payment:completed',
  PAYMENT_FAILED = 'payment:failed',
  PAYMENT_INITIATED = 'payment:initiated',
  ERROR = 'error',
}

// Notification data interface
export interface NotificationData {
  userId: string;
  resourceId?: string;
  resourceType?: 'conversion' | 'file' | 'payment';
  status?: string;
  message?: string;
  details?: any;
  timestamp: Date;
}

/**
 * Send a notification
 */
export function sendNotification(
  eventType: NotificationEventType,
  data: Omit<NotificationData, 'timestamp'>
): void {
  try {
    const notification: NotificationData = {
      ...data,
      timestamp: new Date()
    };
    
    // Log notification
    logger.debug(`Sending notification: ${eventType}`, notification);
    
    // Emit event
    eventEmitter.emit(eventType, notification);
    
    // Also emit to user-specific channel
    eventEmitter.emit(`user:${data.userId}:${eventType}`, notification);
  } catch (error) {
    logger.error(`Error sending notification: ${eventType}`, error);
  }
}

/**
 * Listen for notifications
 */
export function listenForNotifications(
  eventType: NotificationEventType,
  callback: (data: NotificationData) => void
): () => void {
  // Add listener
  eventEmitter.on(eventType, callback);
  
  // Return function to remove listener
  return () => {
    eventEmitter.off(eventType, callback);
  };
}

/**
 * Listen for user-specific notifications
 */
export function listenForUserNotifications(
  userId: string,
  eventType: NotificationEventType,
  callback: (data: NotificationData) => void
): () => void {
  const userEventType = `user:${userId}:${eventType}`;
  
  // Add listener
  eventEmitter.on(userEventType, callback);
  
  // Return function to remove listener
  return () => {
    eventEmitter.off(userEventType, callback);
  };
}

/**
 * Send a conversion status notification
 */
export function sendConversionStatusNotification(
  userId: string,
  conversionId: string,
  status: string,
  details?: any
): void {
  const eventType = 
    status === 'completed' ? NotificationEventType.CONVERSION_COMPLETED :
    status === 'failed' ? NotificationEventType.CONVERSION_FAILED :
    status === 'processing' ? NotificationEventType.CONVERSION_STARTED :
    NotificationEventType.CONVERSION_STATUS_CHANGED;
  
  sendNotification(eventType, {
    userId,
    resourceId: conversionId,
    resourceType: 'conversion',
    status,
    message: `Conversion ${status}`,
    details
  });
}

/**
 * Send a payment status notification
 */
export function sendPaymentStatusNotification(
  userId: string,
  conversionId: string,
  status: string,
  details?: any
): void {
  const eventType = 
    status === 'completed' ? NotificationEventType.PAYMENT_COMPLETED :
    status === 'failed' ? NotificationEventType.PAYMENT_FAILED :
    status === 'pending' ? NotificationEventType.PAYMENT_INITIATED :
    NotificationEventType.PAYMENT_STATUS_CHANGED;
  
  sendNotification(eventType, {
    userId,
    resourceId: conversionId,
    resourceType: 'payment',
    status,
    message: `Payment ${status}`,
    details
  });
}

export default {
  sendNotification,
  listenForNotifications,
  listenForUserNotifications,
  sendConversionStatusNotification,
  sendPaymentStatusNotification,
  NotificationEventType
};