import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  deviceInfo?: string;
  ipAddress?: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true },
    deviceInfo: { type: String },
    ipAddress: { type: String },
    isRevoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
