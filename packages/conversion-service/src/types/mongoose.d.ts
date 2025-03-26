import { Document, Model } from 'mongoose';
import { IFile, IFileDocument } from '../models/file.model';
import { IConversion, IConversionDocument } from '../models/conversion.model';
import { IPayment, IPaymentDocument } from '../models/payment.model';

/**
 * This declaration file enhances Mongoose types for better type safety
 * across the application by adding custom document types to global scope.
 */
declare global {
  // Type aliases for commonly used document types
  type FileDoc = IFileDocument;
  type ConversionDoc = IConversionDocument;
  type PaymentDoc = IPaymentDocument;
  
  // Helper type to improve type checking for Mongoose queries
  type WithId<T> = T & { _id: string };
  
  // Type-guard functions to help TypeScript recognize document types
  function isFileDocument(doc: any): doc is FileDoc;
  function isConversionDocument(doc: any): doc is ConversionDoc;
  function isPaymentDocument(doc: any): doc is PaymentDoc;
}

// Extend Mongoose's own type definitions
declare module 'mongoose' {
  // Enhance Document interface to support our custom properties
  interface Document {
    // We need these basic properties for all documents
    _id: any;
    id?: string;
    __v: number;
  }
  
  // Add our document types to Mongoose namespace
  interface FileDocument extends Document, IFile {}
  interface ConversionDocument extends Document, IConversion {}
  interface PaymentDocument extends Document, IPayment {}
  
  // Extend Model interface
  interface FileModel extends Model<FileDocument> {
    findByUserId(userId: string): Promise<FileDocument[]>;
  }
  
  interface ConversionModel extends Model<ConversionDocument> {
    findByJobId(jobId: string): Promise<ConversionDocument>;
  }
  
  interface PaymentModel extends Model<PaymentDocument> {
    findByConversionId(conversionId: string): Promise<PaymentDocument>;
    findByTransactionId(transactionId: string): Promise<PaymentDocument>;
  }
}