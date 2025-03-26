import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import url from 'url';
import notificationService, { NotificationEventType, NotificationData } from '../services/notificationService';
import logger from '../utils/logger';

// Store active connections
const connections = new Map<string, WebSocket>();

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  
  // Handle upgrade requests
  server.on('upgrade', (request, socket, head) => {
    try {
      // Parse URL and query parameters
      const pathname = url.parse(request.url || '').pathname;
      
      // Only handle WebSocket connections to the /ws endpoint
      if (pathname === '/api/ws') {
        // Extract token from query parameters
        const queryParams = new URLSearchParams(url.parse(request.url || '').query || '');
        const token = queryParams.get('token');
        
        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        // Verify token
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
          const userId = typeof decoded === 'object' ? (decoded as any).id : null;
          
          if (!userId) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }
          
          // Accept the WebSocket connection
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request, userId);
          });
        } catch (err) {
          logger.error('WebSocket authentication error', err);
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
        }
      } else {
        // Not a WebSocket request to our endpoint
        socket.destroy();
      }
    } catch (error) {
      logger.error('Error handling WebSocket upgrade', error);
      socket.destroy();
    }
  });
  
  // Handle connections
  wss.on('connection', (ws: WebSocket, request: http.IncomingMessage, userId: string) => {
    logger.info(`WebSocket connection established for user ${userId}`);
    
    // Store connection
    connections.set(userId, ws);
    
    // Subscribe to user's notifications
    const unsubscribe = notificationService.listenForUserNotifications(
      userId,
      NotificationEventType.CONVERSION_STATUS_CHANGED,
      (notification: NotificationData) => {
        sendToUser(userId, {
          type: 'conversion_status',
          data: notification
        });
      }
    );
    
    // Also subscribe to more specific events
    const eventTypes = [
      NotificationEventType.CONVERSION_COMPLETED,
      NotificationEventType.CONVERSION_FAILED,
      NotificationEventType.CONVERSION_STARTED,
      NotificationEventType.FILE_UPLOAD_COMPLETED,
      NotificationEventType.FILE_DELETED
    ];
    
    const cleanupFunctions = eventTypes.map(eventType => 
      notificationService.listenForUserNotifications(
        userId,
        eventType,
        (notification: NotificationData) => {
          sendToUser(userId, {
            type: eventType.split(':')[1], // Extract the specific part after the colon
            data: notification
          });
        }
      )
    );
    
    // Handle disconnection
    ws.on('close', () => {
      logger.info(`WebSocket connection closed for user ${userId}`);
      
      // Remove connection
      connections.delete(userId);
      
      // Unsubscribe from notifications
      unsubscribe();
      cleanupFunctions.forEach(cleanup => cleanup());
    });
    
    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for user ${userId}`, error);
    });
    
    // Send welcome message
    sendToUser(userId, {
      type: 'connected',
      data: {
        message: 'Connected to conversion service',
        timestamp: new Date()
      }
    });
  });
  
  return wss;
}

/**
 * Send message to specific user
 */
export function sendToUser(userId: string, message: any): boolean {
  try {
    const ws = connections.get(userId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Error sending WebSocket message to user ${userId}`, error);
    return false;
  }
}

/**
 * Send message to all connected clients
 */
export function broadcast(message: any): void {
  connections.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Error broadcasting to user ${userId}`, error);
      }
    }
  });
}

/**
 * Get count of connected users
 */
export function getConnectedUserCount(): number {
  return connections.size;
}

export default {
  initializeWebSocketServer,
  sendToUser,
  broadcast,
  getConnectedUserCount
};