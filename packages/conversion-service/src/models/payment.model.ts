import mongoose, { Schema, Document } from 'mongoose';
import { PaymentStatus, PaymentProvider } from '../types/conversion';

export interface IPayment extends Document {
  conversionId: mongoose.Types.ObjectId;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  paymentId: string;
  transactionId?: string;
  paymentUrl?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
  providerData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    conversionId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversion',
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      default: 'PLN'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: ['paybylink', 'stripe', 'paypal'],
      default: 'paybylink',
      required: true
    },
    paymentId: {
      type: String,
      required: true,
      unique: true
    },
    transactionId: {
      type: String,
      sparse: true,
      index: true
    },
    paymentUrl: {
      type: String
    },
    successUrl: {
      type: String,
      required: true
    },
    cancelUrl: {
      type: String,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    providerData: {
      type: Schema.Types.Mixed
    },
    completedAt: {
      type: Date
    }
  },
  { 
    timestamps: true 
  }
);

// Create indices for faster queries
PaymentSchema.index({ conversionId: 1, status: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ paymentId: 1 }, { unique: true });

export default mongoose.model<IPayment>('Payment', PaymentSchema);