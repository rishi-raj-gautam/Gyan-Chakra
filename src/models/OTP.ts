import mongoose, { Document, Schema } from 'mongoose';
import { env } from '../config/env';

export enum OtpType {
  MOBILE_VERIFY = 'mobile_verify',
  EMAIL_VERIFY = 'email_verify',
  PASSWORD_RESET = 'password_reset',
}

export interface IOTP extends Document {
  identifier: string; // mobile or email
  otp: string;
  type: OtpType;
  attempts: number;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    identifier: { type: String, required: true, index: true },
    otp: { type: String, required: true, select: false },
    type: { type: String, enum: Object.values(OtpType), required: true },
    attempts: { type: Number, default: 0, max: 5 },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

otpSchema.index({ identifier: 1, type: 1 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);
