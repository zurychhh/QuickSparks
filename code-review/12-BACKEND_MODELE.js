/**
 * 12-BACKEND_MODELE.js
 * 
 * This file contains backend data models.
 */

// Conversion Model
// =============
// packages/conversion-service/src/models/conversion.model.ts
const conversionModel = `
import mongoose, { Document, Schema } from 'mongoose';

// Conversion options interface
interface ConversionOptions {
  quality: string;
  preserveImages: boolean;
  preserveFormatting: boolean;
  [key: string]: any;
}

// Conversion document interface
export interface Conversion extends Document {
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  conversionType: 'pdf-to-docx' | 'docx-to-pdf';
  options: ConversionOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  outputFilePath?: string;
  outputFileName?: string;
  error?: string;
  downloadCount: number;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Conversion schema
const ConversionSchema = new Schema<Conversion>({
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  filePath: { type: String, required: true },
  conversionType: { 
    type: String, 
    required: true,
    enum: ['pdf-to-docx', 'docx-to-pdf']
  },
  options: {
    quality: { type: String, default: 'high' },
    preserveImages: { type: Boolean, default: true },
    preserveFormatting: { type: Boolean, default: true }
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: { type: Number, default: 0 },
  outputFilePath: { type: String },
  outputFileName: { type: String },
  error: { type: String },
  downloadCount: { type: Number, default: 0 },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Create model
export const ConversionModel = mongoose.model<Conversion>('Conversion', ConversionSchema);
`;

// File Model
// ========
// packages/conversion-service/src/models/file.model.ts
const fileModel = `
import mongoose, { Document, Schema } from 'mongoose';

// File document interface
export interface File extends Document {
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  userId?: string;
  conversionId?: string;
  isInput: boolean;
  isOutput: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// File schema
const FileSchema = new Schema<File>({
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  conversionId: { type: Schema.Types.ObjectId, ref: 'Conversion' },
  isInput: { type: Boolean, default: false },
  isOutput: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

// Add index for expiration cleanup
FileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create model
export const FileModel = mongoose.model<File>('File', FileSchema);
`;

// Payment Model
// ==========
// packages/conversion-service/src/models/payment.model.ts
const paymentModel = `
import mongoose, { Document, Schema } from 'mongoose';

// Payment document interface
export interface Payment extends Document {
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  conversionId: string;
  userId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'expired';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Payment schema
const PaymentSchema = new Schema<Payment>({
  stripeSessionId: { type: String, required: true, unique: true },
  stripePaymentIntentId: { type: String },
  conversionId: { type: Schema.Types.ObjectId, ref: 'Conversion', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded', 'expired'],
    default: 'pending'
  },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Create model
export const PaymentModel = mongoose.model<Payment>('Payment', PaymentSchema);
`;

// Database Connection Configuration
// ============================
// packages/conversion-service/src/config/database.ts
const databaseConfig = `
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Connect to MongoDB database
 */
export async function connectToDatabase(): Promise<mongoose.Connection> {
  try {
    // Configure mongoose
    mongoose.set('strictQuery', true);
    
    // Connect to database
    await mongoose.connect(env.MONGODB_URI);
    
    logger.info('Connected to MongoDB');
    
    const db = mongoose.connection;
    
    // Handle errors after initial connection
    db.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    // Log on disconnect
    db.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    // Log on reconnect
    db.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return db;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}
`;