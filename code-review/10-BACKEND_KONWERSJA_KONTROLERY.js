/**
 * 10-BACKEND_KONWERSJA_KONTROLERY.js
 * 
 * This file contains backend conversion controllers and routes.
 */

// Conversion Routes
// =============
// packages/conversion-service/src/routes/conversion.routes.ts
const conversionRoutes = `
import { Router } from 'express';
import { uploadMiddleware } from '../middleware/fileUpload';
import conversionController from '../controllers/conversionController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/conversion
 * Upload a file and start conversion
 */
router.post(
  '/',
  optionalAuth, // Auth is optional to allow anonymous conversions
  uploadMiddleware.single('file'),
  conversionController.startConversion
);

/**
 * GET /api/conversion/:id
 * Get conversion status
 */
router.get(
  '/:id',
  optionalAuth,
  conversionController.getConversionStatus
);

/**
 * DELETE /api/conversion/:id
 * Cancel conversion
 */
router.delete(
  '/:id',
  optionalAuth,
  conversionController.cancelConversion
);

export default router;
`;

// Websocket Controller
// ================
// packages/conversion-service/src/controllers/websocketController.ts
const websocketController = `
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/**
 * Controller for handling WebSocket connections and events
 */
export class WebSocketController {
  private io: Server;
  
  /**
   * Initialize WebSocket event handlers
   */
  public setupEventHandlers(socket: AuthenticatedSocket) {
    // Handle joining a conversion room
    socket.on('join-conversion', (data: { conversionId: string }) => {
      if (!data.conversionId) return;
      
      const roomName = \`conversion-\${data.conversionId}\`;
      socket.join(roomName);
      
      logger.info(\`Client \${socket.id} joined room \${roomName}\`);
    });
    
    // Handle leaving a conversion room
    socket.on('leave-conversion', (data: { conversionId: string }) => {
      if (!data.conversionId) return;
      
      const roomName = \`conversion-\${data.conversionId}\`;
      socket.leave(roomName);
      
      logger.info(\`Client \${socket.id} left room \${roomName}\`);
    });
    
    // Clean up on disconnect
    socket.on('disconnect', () => {
      logger.info(\`Client \${socket.id} disconnected\`);
    });
  }
  
  /**
   * Authenticate WebSocket connection
   */
  private authenticateConnection(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow anonymous connections
      return next();
    }
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
      
      // Attach user ID to socket
      socket.userId = decoded.id;
      
      next();
    } catch (error) {
      // Invalid token, but still allow connection as anonymous
      logger.warn(\`Invalid auth token for socket \${socket.id}\`);
      next();
    }
  }
}

/**
 * Set up WebSocket handlers on the server
 */
export function setupWebSocketHandlers(io: Server) {
  const controller = new WebSocketController();
  
  // Set up middleware for authentication
  io.use((socket: AuthenticatedSocket, next) => {
    controller.authenticateConnection(socket, next);
  });
  
  // Handle new connections
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(\`New WebSocket connection: \${socket.id}\`);
    
    // Set up event handlers for this socket
    controller.setupEventHandlers(socket);
  });
  
  return io;
}

/**
 * Send conversion progress update to clients
 */
export function notifyConversionProgress(io: Server, conversionId: string, progress: number) {
  const roomName = \`conversion-\${conversionId}\`;
  io.to(roomName).emit(\`conversion-status-\${conversionId}\`, {
    status: 'processing',
    progress,
  });
}

/**
 * Send conversion completion notification to clients
 */
export function notifyConversionComplete(
  io: Server,
  conversionId: string,
  fileName: string,
  thumbnailUrl: string,
  fileUrl: string,
  paymentRequired: boolean
) {
  const roomName = \`conversion-\${conversionId}\`;
  io.to(roomName).emit(\`conversion-status-\${conversionId}\`, {
    status: 'completed',
    progress: 100,
    fileName,
    thumbnailUrl,
    fileUrl,
    paymentRequired,
  });
}

/**
 * Send conversion error notification to clients
 */
export function notifyConversionError(io: Server, conversionId: string, error: string) {
  const roomName = \`conversion-\${conversionId}\`;
  io.to(roomName).emit(\`conversion-status-\${conversionId}\`, {
    status: 'error',
    message: error,
  });
}
`;

// Thumbnail Controller
// ===============
// packages/conversion-service/src/controllers/thumbnailController.ts
const thumbnailController = `
import { Request, Response, NextFunction } from 'express';
import { ThumbnailService } from '../services/thumbnailService';
import { ConversionService } from '../services/conversionService';
import { validateSecureLink } from '../utils/secureLinks';
import { logger } from '../utils/logger';

/**
 * Controller for handling document thumbnail generation and retrieval
 */
export class ThumbnailController {
  private thumbnailService: ThumbnailService;
  private conversionService: ConversionService;
  
  constructor() {
    this.thumbnailService = new ThumbnailService();
    this.conversionService = new ConversionService();
  }
  
  /**
   * Generate and return a thumbnail for a document
   */
  public getThumbnail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Get conversion
      const conversion = await this.conversionService.getConversionById(id);
      
      if (!conversion) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Determine source file path (input or output)
      const isCompleted = conversion.status === 'completed';
      const filePath = isCompleted && conversion.outputFilePath 
        ? conversion.outputFilePath 
        : conversion.filePath;
      
      // Get file type
      const isPdf = filePath.toLowerCase().endsWith('.pdf');
      const isDocx = filePath.toLowerCase().endsWith('.docx') || filePath.toLowerCase().endsWith('.doc');
      
      if (!isPdf && !isDocx) {
        return res.status(400).json({ message: 'Unsupported file type for thumbnail' });
      }
      
      // Generate thumbnail
      const thumbnailPath = await this.thumbnailService.generateThumbnail(
        filePath,
        isPdf ? 'pdf' : 'docx'
      );
      
      // Send thumbnail as response
      res.sendFile(thumbnailPath, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });
      
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      next(error);
    }
  };
  
  /**
   * Get a thumbnail for a document via secure link
   */
  public getThumbnailByToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      
      // Validate token
      const validationResult = validateSecureLink(token);
      
      if (!validationResult.valid) {
        return res.status(400).json({ message: 'Invalid or expired thumbnail link' });
      }
      
      const { id: conversionId } = validationResult;
      
      // Get conversion
      const conversion = await this.conversionService.getConversionById(conversionId);
      
      if (!conversion) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Determine source file path (input or output)
      const isCompleted = conversion.status === 'completed';
      const filePath = isCompleted && conversion.outputFilePath 
        ? conversion.outputFilePath 
        : conversion.filePath;
      
      // Get file type
      const isPdf = filePath.toLowerCase().endsWith('.pdf');
      const isDocx = filePath.toLowerCase().endsWith('.docx') || filePath.toLowerCase().endsWith('.doc');
      
      if (!isPdf && !isDocx) {
        return res.status(400).json({ message: 'Unsupported file type for thumbnail' });
      }
      
      // Generate thumbnail
      const thumbnailPath = await this.thumbnailService.generateThumbnail(
        filePath,
        isPdf ? 'pdf' : 'docx'
      );
      
      // Send thumbnail as response
      res.sendFile(thumbnailPath, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });
      
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      next(error);
    }
  };
}

export default new ThumbnailController();
`;

// Download Routes
// ===========
// packages/conversion-service/src/routes/download.routes.ts
const downloadRoutes = `
import { Router } from 'express';
import downloadController from '../controllers/downloadController';
import thumbnailController from '../controllers/thumbnailController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/download/:token
 * Download converted file using secure token
 */
router.get(
  '/:token',
  optionalAuth,
  downloadController.downloadFile
);

/**
 * GET /api/download/status/:token
 * Check if a download is available
 */
router.get(
  '/status/:token',
  optionalAuth,
  downloadController.checkDownload
);

/**
 * GET /api/download/thumbnail/:id
 * Get thumbnail for a conversion
 */
router.get(
  '/thumbnail/:id',
  optionalAuth,
  thumbnailController.getThumbnail
);

/**
 * GET /api/download/thumbnail/secure/:token
 * Get thumbnail via secure token
 */
router.get(
  '/thumbnail/secure/:token',
  thumbnailController.getThumbnailByToken
);

export default router;
`;