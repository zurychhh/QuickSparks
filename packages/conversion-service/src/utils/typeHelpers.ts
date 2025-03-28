import { Types } from 'mongoose';
import { IFileDocument } from '../models/file.model';
import { IConversionDocument } from '../models/conversion.model';
import { IPaymentDocument } from '../models/payment.model';

/**
 * Type guard functions to help TypeScript recognize document types
 */

/**
 * Check if an object is a File document
 */
export function isFileDocument(obj: any): obj is IFileDocument {
  return obj && 
    obj._id && 
    typeof obj.filename === 'string' && 
    typeof obj.originalFilename === 'string';
}

/**
 * Check if an object is a Conversion document
 */
export function isConversionDocument(obj: any): obj is IConversionDocument {
  return obj && 
    obj._id && 
    obj.sourceFileId && 
    typeof obj.conversionType === 'string';
}

/**
 * Check if an object is a Payment document
 */
export function isPaymentDocument(obj: any): obj is IPaymentDocument {
  return obj && 
    obj._id && 
    obj.conversionId && 
    typeof obj.status === 'string';
}

/**
 * Convert string ID to ObjectId
 */
export function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  if (typeof id === 'string') {
    return new Types.ObjectId(id);
  }
  return id;
}

/**
 * Convert ObjectId to string
 */
export function toStringId(id: string | Types.ObjectId | undefined): string | undefined {
  if (!id) return undefined;
  return id.toString();
}

/**
 * Safely access document properties with TypeScript type safety
 */
export function safeDoc<T extends Record<string, any>>(doc: any, defaultValue: T): T {
  if (!doc) return defaultValue;
  
  // Create a proxy to convert ObjectId to string when accessed
  return new Proxy(doc.toObject ? doc.toObject() : doc, {
    get: (target, prop) => {
      const value = target[prop as string];
      
      // Convert ObjectId to string when accessed
      if (value instanceof Types.ObjectId) {
        return value.toString();
      }
      
      return value;
    }
  }) as T;
}

export default {
  isFileDocument,
  isConversionDocument,
  isPaymentDocument,
  toObjectId,
  toStringId,
  safeDoc
};