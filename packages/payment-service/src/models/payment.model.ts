import mongoose, { Document, Schema } from 'mongoose';

/**
 * Payment status types
 */
export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded';

/**
 * Payment document interface
 */
export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId | string;
  stripeCustomerId?: string;
  stripePaymentIntentId: string;
  stripeSessionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  conversionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment schema
 */
const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      index: true,
    },
    stripeCustomerId: {
      type: String,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, 'Stripe Payment Intent ID is required'],
      unique: true,
      index: true,
    },
    stripeSessionId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      required: [true, 'Payment status is required'],
      default: 'pending',
      index: true,
    },
    conversionId: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true, // Automatically create createdAt and updatedAt
  }
);

/**
 * Indexes
 */
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

/**
 * Payment model
 */
const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;