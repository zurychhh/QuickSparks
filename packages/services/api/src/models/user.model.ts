import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User subscription plan types
 */
export type UserPlan = 'free' | 'standard' | 'premium';

/**
 * User document interface
 */
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  plan: UserPlan;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User schema definition
 */
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in query results by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    plan: {
      type: String,
      enum: ['free', 'standard', 'premium'],
      default: 'free',
    },
    isEmailVerified: {
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
userSchema.index({ email: 1 }, { unique: true });

/**
 * Pre-save hook to hash password before saving
 */
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Method to compare candidate password with stored hash
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * User model
 */
const User = mongoose.model<IUser>('User', userSchema);

export default User;