import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { userRepository } from '../repositories/UserRepository';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/response';
import { getPagination } from '../utils/paginate';
import { Winner } from '../models/Winner';
import { DailyQuizParticipation } from '../models/DailyQuizParticipation';
import { MegaChallengeParticipation } from '../models/MegaChallengeParticipation';
import { notificationService } from '../services/NotificationService';
import { NotificationType } from '../models/Notification';
import { logger } from '../utils/logger';

export class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userRepository.findById(req.user!.userId);
      if (!user) throw ApiError.notFound('User not found');
      return sendSuccess(res, 'Profile fetched', user);
    } catch (e) { next(e); }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      logger.info(`[UserController] updateProfile initiated. User ID: ${req.user?.userId || 'unknown'}`);
      logger.info(`[UserController] Incoming headers: ${JSON.stringify(req.headers)}`);
      logger.info(`[UserController] Request body: ${JSON.stringify(req.body)}`);

      const allowedFields = ['name', 'email', 'city', 'aboutMe', 'dateOfBirth', 'fcmToken'];
      const updates: Record<string, any> = {};
      allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

      logger.info(`[UserController] Allowed fields parsed for update: ${JSON.stringify(updates)}`);

      if (updates.fcmToken !== undefined) {
        logger.info(`[FCM Sync] User ${req.user!.userId} is attempting to update FCM token to: "${updates.fcmToken}"`);
      }

      const user = await userRepository.update(req.user!.userId, updates);
      
      if (!user) {
        logger.error(`[UserController] Profile update failed. User with ID ${req.user!.userId} not found in database.`);
        throw ApiError.notFound('User not found');
      }

      if (updates.fcmToken !== undefined) {
        logger.info(`[FCM Sync] Token successfully saved in MongoDB for user ${req.user!.userId}. Stored token: "${user.fcmToken}"`);
      }

      logger.info(`[UserController] Profile updated successfully for user: ${user._id}`);
      return sendSuccess(res, 'Profile updated', user);
    } catch (e: any) {
      logger.error('[UserController] Error in updateProfile:', {
        message: e.message,
        stack: e.stack,
        userId: req.user?.userId
      });
      next(e);
    }
  }

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await userRepository.softDelete(req.user!.userId);
      return sendSuccess(res, 'Account deleted successfully');
    } catch (e) { next(e); }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userRepository.findById(req.user!.userId);
      if (!user) throw ApiError.notFound('User not found');
      return sendSuccess(res, 'Stats fetched', {
        totalContestsPlayed: user.totalContestsPlayed,
        totalContestsWon: user.totalContestsWon,
        walletBalance: user.walletBalance,
        lifetimeEarnings: user.lifetimeEarnings,
      });
    } catch (e) { next(e); }
  }

  async getContestHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { skip, limit, page } = getPagination(req);
      const userId = req.user!.userId;

      const [quizHistory, challengeHistory] = await Promise.all([
        DailyQuizParticipation.find({ userId })
          .populate('quizId', 'title rewardAmount startTime winnerId')
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(limit),
        MegaChallengeParticipation.find({ userId })
          .populate('challengeId', 'title rewardAmount startDate')
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(limit),
      ]);

      return sendSuccess(res, 'History fetched', { quizHistory, challengeHistory });
    } catch (e) { next(e); }
  }

  // Admin routes
  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { skip, limit, page } = getPagination(req);
      const { status, search } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const { users, total } = await userRepository.findAll(filter, skip, limit);
      return sendSuccess(res, 'Users fetched', { users, page, limit, total, totalPages: Math.ceil(total / limit) });
    } catch (e) { next(e); }
  }

  async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = await userRepository.update(id, { status });
      if (!user) throw ApiError.notFound('User not found');

      // Send status change notification to user
      let notifTitle = '';
      let notifBody = '';
      const notifType = NotificationType.SYSTEM;

      if (status === 'active') {
        notifTitle = 'Account Approved! ✅';
        notifBody = 'Congratulations, your account has been approved and you can now participate in contests!';
      } else if (status === 'suspended') {
        notifTitle = 'Account Suspended ⚠️';
        notifBody = 'Your account has been suspended. Please contact support for assistance.';
      } else if (status === 'blocked') {
        notifTitle = 'Account Blocked ❌';
        notifBody = 'Your account has been blocked due to policy violations.';
      }

      if (notifTitle && notifBody) {
        await notificationService.sendToUser(id, notifType, notifTitle, notifBody).catch((err) =>
          logger.error(`[UserController] Failed to send status notification to user ${id}:`, err)
        );
      }

      return sendSuccess(res, `User ${status} successfully`, user);
    } catch (e) { next(e); }
  }

  async sendTestPushToSelf(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      logger.info(`[UserController] sendTestPushToSelf initiated by user ${userId}`);
      const user = await userRepository.findById(userId);
      if (!user) throw ApiError.notFound('User not found');
      if (!user.fcmToken) {
        logger.warn(`[UserController] User ${userId} has no registered FCM token.`);
        throw ApiError.badRequest('User does not have an FCM token registered');
      }

      logger.info(`[UserController] Sending test push to user ${userId} with token ${user.fcmToken}`);
      const success = await notificationService.sendToUser(
        userId,
        NotificationType.SYSTEM,
        'Test Push Notification 🔔',
        'Hello from Gyaan Chakra! This is a test notification to verify your device token.',
        { type: 'test_push', timestamp: new Date().toISOString() }
      );

      return sendSuccess(res, 'Test push dispatched', { success, token: user.fcmToken });
    } catch (e) { next(e); }
  }
}

export const userController = new UserController();
