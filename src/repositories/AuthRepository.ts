import { OTP, IOTP, OtpType } from '../models/OTP';
import { RefreshToken, IRefreshToken } from '../models/RefreshToken';

export class AuthRepository {
  // OTP
  async createOTP(identifier: string, otp: string, type: OtpType): Promise<IOTP> {
    // Invalidate existing OTPs
    await OTP.deleteMany({ identifier, type, isUsed: false });
    return OTP.create({ identifier, otp, type });
  }

  async findValidOTP(identifier: string, type: OtpType): Promise<IOTP | null> {
    return OTP.findOne({
      identifier,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).select('+otp');
  }

  async markOTPUsed(id: string): Promise<void> {
    await OTP.findByIdAndUpdate(id, { isUsed: true });
  }

  async incrementOTPAttempts(id: string): Promise<number> {
    const otp = await OTP.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true });
    return otp?.attempts || 0;
  }

  // Refresh tokens
  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<IRefreshToken> {
    return RefreshToken.create({ userId, token, expiresAt, deviceInfo, ipAddress });
  }

  async findRefreshToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token, isRevoked: false, expiresAt: { $gt: new Date() } });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  }
}

export const authRepository = new AuthRepository();
