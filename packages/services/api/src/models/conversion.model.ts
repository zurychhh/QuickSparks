import mongoose, { Document, Schema } from 'mongoose';

/**
 * Conversion type enum
 */
export type ConversionType = 'pdf-to-docx' | 'docx-to-pdf';

/**
 * Conversion status enum
 */
export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Conversion document interface
 */
export interface IConversion extends Document {
  userId: mongoose.Types.ObjectId;
  sourceFileId: mongoose.Types.ObjectId;
  resultFileId?: mongoose.Types.ObjectId;
  conversionType: ConversionType;
  status: ConversionStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Conversion schema definition
 */
const conversionSchema = new Schema<IConversion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
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
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
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

/**
 * Conversion model
 */
const Conversion = mongoose.model<IConversion>('Conversion', conversionSchema);

export default Conversion;