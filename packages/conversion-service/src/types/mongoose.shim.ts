// This file is specifically designed to ensure backward compatibility
// with code that assumes all document properties are available
// This is effectively a shim to avoid having to update all controllers and services

import mongoose from 'mongoose';
import { IFile, IFileDocument } from '../models/file.model';
import { IConversion, IConversionDocument } from '../models/conversion.model';
import { IPayment, IPaymentDocument } from '../models/payment.model';

// Replace the native Document prototype with our own implementation
// This is a hack, but it allows us to avoid updating all controllers and services
Object.defineProperty(mongoose.Document.prototype, 'toObject', {
  value: function(this: any) {
    // Get the original toObject result
    const original = mongoose.Document.prototype.toObject.call(this);
    
    // Add all properties from the document instance to the object
    for (const key in this) {
      if (this.hasOwnProperty(key) && !original.hasOwnProperty(key) && key !== '_doc') {
        original[key] = this[key];
      }
    }
    
    return original;
  },
  configurable: true,
  writable: true
});

// Create type guard functions
export function isFileDocument(doc: any): doc is IFileDocument {
  return doc && 
    doc._id && 
    doc.userId && 
    typeof doc.filename === 'string';
}

export function isConversionDocument(doc: any): doc is IConversionDocument {
  return doc && 
    doc._id && 
    doc.userId && 
    doc.sourceFileId;
}

export function isPaymentDocument(doc: any): doc is IPaymentDocument {
  return doc && 
    doc._id && 
    doc.userId && 
    doc.conversionId;
}

// Create safe type conversion functions
export function asFileDocument(doc: any): IFileDocument {
  return doc as IFileDocument;
}

export function asConversionDocument(doc: any): IConversionDocument {
  return doc as IConversionDocument;
}

export function asPaymentDocument(doc: any): IPaymentDocument {
  return doc as IPaymentDocument;
}

// Export utilities
export default {
  isFileDocument,
  isConversionDocument,
  isPaymentDocument,
  asFileDocument,
  asConversionDocument,
  asPaymentDocument
};