import mongoose, { Document, Schema } from 'mongoose';
import { ConversionType, ConversionStatus, ConversionQuality } from '../types/conversion';

/**
 * Conversion document interface
 */
export interface IConversion extends Document {
  userId: mongoose.Types.ObjectId | string;
  sourceFileId: mongoose.Types.ObjectId | string;
  resultFileId?: mongoose.Types.ObjectId | string;
  conversionType: ConversionType;
  quality: ConversionQuality;
  preserveFormatting: boolean;
  status: ConversionStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  processingStartedAt?: Date;
  processingEndedAt?: Date;
  error?: string;
  errorDetails?: Record<string, any>;
  pageCount?: number;
  conversionTime?: number;
  jobId?: string;
  paymentId?: mongoose.Types.ObjectId | string;
  isPaid?: boolean;
}

/**
 * Conversion schema definition
 */
const conversionSchema = new Schema<IConversion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      index: true,
    },
    sourceFileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      required: [true, 'Source file ID is required'],
    },
    resultFileId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
    },
    conversionType: {
      type: String,
      enum: ['pdf-to-docx', 'docx-to-pdf'],
      required: [true, 'Conversion type is required'],
    },
    quality: {
      type: String,
      enum: ['standard', 'high'],
      default: 'high',
    },
    preserveFormatting: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    completedAt: {
      type: Date,
    },
    processingStartedAt: {
      type: Date,
    },
    processingEndedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    errorDetails: {
      type: Schema.Types.Mixed, // Store any error details
    },
    pageCount: {
      type: Number,
    },
    conversionTime: {
      type: Number, // Conversion time in milliseconds
    },
    jobId: {
      type: String,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    }
  },
  {
    timestamps: true, // Automatically create createdAt and updatedAt fields
  }
);

/**
 * Indexes for optimized queries
 */
conversionSchema.index({ userId: 1, createdAt: -1 });
conversionSchema.index({ status: 1, createdAt: -1 });
conversionSchema.index({ jobId: 1 });

/**
 * Conversion model
 */
const Conversion = mongoose.model<IConversion>('Conversion', conversionSchema);

export default Conversion;