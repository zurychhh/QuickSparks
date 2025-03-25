import mongoose, { Document, Schema } from 'mongoose';

/**
 * File document interface
 */
export interface IFile extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;       // System-generated filename
  originalFilename: string; // Original filename from user
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
  expiresAt: Date;
  isPublic: boolean;
}

/**
 * File schema definition
 */
const fileSchema = new Schema<IFile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: { expires: 0 }, // TTL index to automatically remove expired documents
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically create createdAt and updatedAt fields
  }
);

/**
 * Indexes for optimized queries
 */
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ filename: 1 }, { unique: true });

/**
 * File model
 */
const File = mongoose.model<IFile>('File', fileSchema);

export default File;