import mongoose, { Document, Schema } from 'mongoose';

/**
 * Subscription statuses from Stripe
 */
export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'past_due'
  | 'paused' 
  | 'trialing' 
  | 'unpaid';

/**
 * User tiers
 */
export type UserTier = 
  | 'free' 
  | 'basic' 
  | 'premium' 
  | 'enterprise';

/**
 * Subscription document interface
 */
export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId | string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  tier: UserTier;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Subscription schema
 */
const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: [true, 'Stripe customer ID is required'],
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: [true, 'Stripe subscription ID is required'],
      unique: true,
      index: true,
    },
    stripePriceId: {
      type: String,
      required: [true, 'Stripe price ID is required'],
    },
    status: {
      type: String,
      enum: [
        'active', 
        'canceled', 
        'incomplete', 
        'incomplete_expired', 
        'past_due', 
        'paused', 
        'trialing', 
        'unpaid'
      ],
      required: [true, 'Subscription status is required'],
      index: true,
    },
    tier: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      required: [true, 'Subscription tier is required'],
      default: 'free',
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      required: [true, 'Current period start is required'],
    },
    currentPeriodEnd: {
      type: Date,
      required: [true, 'Current period end is required'],
      index: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
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
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ stripeCustomerId: 1, status: 1 });

/**
 * Subscription model
 */
const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription;