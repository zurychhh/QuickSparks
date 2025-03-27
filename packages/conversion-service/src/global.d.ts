// Global TypeScript declarations for the project

// Import our model interfaces
import { IFile, IFileDocument } from './models/file.model';
import { IConversion, IConversionDocument } from './models/conversion.model';
import { IPayment, IPaymentDocument } from './models/payment.model';
import { Types } from 'mongoose';

// Declare global types
declare global {
  // Type aliases for commonly used document types
  type FileDoc = IFileDocument;
  type ConversionDoc = IConversionDocument;
  type PaymentDoc = IPaymentDocument;
  
  // Helper type to improve type checking for Mongoose queries
  type WithId<T> = T & { _id: Types.ObjectId | string };
  
  // Type helpers
  interface IObjectWithTypeAndId {
    _id: Types.ObjectId | string;
    id?: string;
    [key: string]: any;
  }
  
  // Augment Mongoose classes to suppress TypeScript errors
  namespace mongoose {
    interface Document {
      [key: string]: any;
    }
  }
  
  // Enhance Node's ProcessEnv
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      MONGODB_URI: string;
      REDIS_URI: string;
      [key: string]: string | undefined;
    }
  }
}