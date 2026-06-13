import { userRepository } from '../repositories/UserRepository';
import { authRepository } from '../repositories/AuthRepository';
import { ApiError } from '../utils/apiError';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOTP, generateReferralCode } from '../utils/otp';
import { OtpType } from '../models/OTP';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';

export class AuthService {
  private getEmailTransporter() {
    if (!env.email.host || !env.email.user) return null;
    return nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: { user: env.email.user, pass: env.email.pass },
    });
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const transporter = this.getEmailTransporter();
    if (!transporter) {
      logger.warn('Email not configured, skipping email send');
      return;
    }
    await transporter.sendMail({ from: env.email.from, to, subject, html });
  }

  async register(data: {
    name: string;
    mobile: string;
    password: string;
    email?: string;
    referralCode?: string;
  }) {
    const existingUser = await userRepository.findByMobile(data.mobile);
    if (existingUser) throw ApiError.conflict('Mobile number already registered');

    if (data.email) {
      const emailUser = await userRepository.findByEmail(data.email);
      if (emailUser) throw ApiError.conflict('Email already registered');
    }

    let referredBy;
    if (data.referralCode) {
      const referrer = await userRepository.findByReferralCode(data.referralCode);
      if (referrer) referredBy = referrer._id;
    }

    const hashedPassword = await hashPassword(data.password);
    const referralCode = generateReferralCode();

    const user = await userRepository.create({
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      password: hashedPassword,
      referralCode,
      referredBy,
    });

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return { user, accessToken, refreshToken };
  }

  async login(mobile: string, password: string) {
    const user = await userRepository.findByMobile(mobile);
    if (!user) throw ApiError.unauthorized('Invalid credentials');

    if (user.status === 'blocked' || user.status === 'suspended') {
      throw ApiError.forbidden('Account is suspended or blocked');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) throw ApiError.unauthorized('Invalid credentials');

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    // Remove password from response
    const userObj = user.toJSON();
    return { user: userObj, accessToken, refreshToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await authRepository.revokeRefreshToken(refreshToken);
  }

  async refreshTokens(token: string) {
    const stored = await authRepository.findRefreshToken(token);
    if (!stored) throw ApiError.unauthorized('Invalid refresh token');

    const decoded = verifyRefreshToken(token);
    const user = await userRepository.findById(decoded.userId);
    if (!user) throw ApiError.unauthorized('User not found');

    // Rotate tokens
    await authRepository.revokeRefreshToken(token);

    const accessToken = signAccessToken(user.id, user.role);
    const newRefreshToken = signRefreshToken(user.id, user.role);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await authRepository.createRefreshToken(user.id, newRefreshToken, expiresAt);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async sendPasswordResetOTP(mobile: string): Promise<void> {
    const user = await userRepository.findByMobile(mobile);
    if (!user) throw ApiError.notFound('No account found with this mobile number');

    const otp = generateOTP();
    await authRepository.createOTP(mobile, otp, OtpType.PASSWORD_RESET);

    // In production, send via SMS
    logger.info(`[OTP] Password reset OTP for ${mobile}: ${otp}`);

    if (user.email) {
      await this.sendEmail(
        user.email,
        'Gyaan Chakra – Password Reset OTP',
        `<p>Your OTP is: <strong>${otp}</strong>. Valid for ${env.otpExpiryMinutes} minutes.</p>`
      );
    }
  }

  async resetPassword(mobile: string, otp: string, newPassword: string): Promise<void> {
    const otpRecord = await authRepository.findValidOTP(mobile, OtpType.PASSWORD_RESET);
    if (!otpRecord) throw ApiError.badRequest('OTP expired or invalid');

    if (otpRecord.otp !== otp) {
      const attempts = await authRepository.incrementOTPAttempts(otpRecord.id);
      if (attempts >= 5) throw ApiError.tooManyRequests('Too many attempts. Request a new OTP.');
      throw ApiError.badRequest('Incorrect OTP');
    }

    await authRepository.markOTPUsed(otpRecord.id);

    const user = await userRepository.findByMobile(mobile);
    if (!user) throw ApiError.notFound('User not found');

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(user.id, { password: hashedPassword });
    await authRepository.revokeAllUserTokens(user.id);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByMobile((await userRepository.findById(userId))!.mobile);
    if (!user) throw ApiError.notFound('User not found');

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) throw ApiError.badRequest('Current password is incorrect');

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.update(userId, { password: hashedPassword });
    await authRepository.revokeAllUserTokens(userId);
  }
}

export const authService = new AuthService();
