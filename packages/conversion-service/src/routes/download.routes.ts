import express from 'express';
import downloadController from '../controllers/downloadController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Generate download token (requires authentication)
router.get(
  '/token/:fileId',
  authMiddleware,
  downloadController.generateDownloadToken
);

// Download file with token (no authentication required, token is the auth)
router.get(
  '/file/:token',
  downloadController.downloadFileWithToken
);

export default router;