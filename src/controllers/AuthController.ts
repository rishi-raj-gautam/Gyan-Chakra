import { Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess, sendCreated } from '../utils/response';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return sendCreated(res, 'Registration successful', result);
    } catch (e) { next(e); }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { mobile, password } = req.body;
      const result = await authService.login(mobile, password);
      return sendSuccess(res, 'Login successful', result);
    } catch (e) { next(e); }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken || '';
      await authService.logout(req.user!.userId, refreshToken);
      return sendSuccess(res, 'Logged out successfully');
    } catch (e) { next(e); }
  }

  async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);
      return sendSuccess(res, 'Tokens refreshed', tokens);
    } catch (e) { next(e); }
  }

  async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.sendPasswordResetOTP(req.body.mobile);
      return sendSuccess(res, 'OTP sent to your registered email/mobile');
    } catch (e) { next(e); }
  }

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { mobile, otp, newPassword } = req.body;
      await authService.resetPassword(mobile, otp, newPassword);
      return sendSuccess(res, 'Password reset successfully');
    } catch (e) { next(e); }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      return sendSuccess(res, 'Password changed successfully');
    } catch (e) { next(e); }
  }
}

export const authController = new AuthController();
