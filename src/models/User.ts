import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
}

export interface IUser extends Document {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  dateOfBirth?: Date;
  city?: string;
  profilePhoto?: string;
  aboutMe?: string;
  role: UserRole;
  status: UserStatus;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  fcmToken?: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  walletBalance: number;
  lifetimeEarnings: number;
  totalContestsPlayed: number;
  totalContestsWon: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    mobile: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    dateOfBirth: { type: Date },
    city: { type: String, trim: true },
    profilePhoto: { type: String },
    aboutMe: { type: String, maxlength: 500 },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    referralCode: { type: String, unique: true, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    fcmToken: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isMobileVerified: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    lifetimeEarnings: { type: Number, default: 0 },
    totalContestsPlayed: { type: Number, default: 0 },
    totalContestsWon: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as any).password;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ deletedAt: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Soft delete scope
userSchema.pre('find', function () {
  this.where({ deletedAt: null });
});
userSchema.pre('findOne', function () {
  this.where({ deletedAt: null });
});

export const User = mongoose.model<IUser>('User', userSchema);
