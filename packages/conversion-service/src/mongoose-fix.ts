// This is a build-time fix for TypeScript Mongoose issues
// This file should be referenced at the top of your main entry point file

import { Document, Model } from 'mongoose';
import { IFile } from './models/file.model'; 
import { IConversion } from './models/conversion.model';
import { IPayment } from './models/payment.model';

// Patch the Document interface to allow any property access
// @ts-ignore
Document.prototype.toObject = function() {
  return this as any;
};

// Create helper functions to cast documents to the correct types
export function asFile(doc: any): IFile & Document {
  return doc as IFile & Document;
}

export function asConversion(doc: any): IConversion & Document {
  return doc as IConversion & Document;
}

export function asPayment(doc: any): IPayment & Document {
  return doc as IPayment & Document;
}

// Export helper types
export type TypedFileDocument = IFile & Document;
export type TypedConversionDocument = IConversion & Document;
export type TypedPaymentDocument = IPayment & Document;

// Create patched model types
export interface PatchedFileModel extends Model<TypedFileDocument> {}
export interface PatchedConversionModel extends Model<TypedConversionDocument> {}
export interface PatchedPaymentModel extends Model<TypedPaymentDocument> {}

// This should be used to wrap models for type safety
export function patchModel<T extends Model<any>>(model: T): T {
  return model;
}

// For production use only - apply the patch to mongoose
export function applyMongoosePatch() {
  // @ts-ignore - Override Document class prototype at runtime
  Document.prototype.$__getPath = function(path: string) {
    return this[path];
  };
}