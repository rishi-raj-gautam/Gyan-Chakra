import mongoose from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { User, UserStatus } from '../models/User';
import { DailyQuizParticipation } from '../models/DailyQuizParticipation';
import { MegaChallengeParticipation } from '../models/MegaChallengeParticipation';
import { messaging, isFirebaseInitialized } from '../config/firebase';
import { logger } from '../utils/logger';

export class NotificationService {
  /**
   * Helper to write a notification to MongoDB.
   */
  private async saveNotificationToDb(
    userId: string | mongoose.Types.ObjectId,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    isSent = false
  ) {
    try {
      return await Notification.create({
        userId,
        type,
        title,
        body,
        data,
        isRead: false,
        isSent,
        sentAt: isSent ? new Date() : undefined,
      });
    } catch (e) {
      logger.error(`[NotificationService] Error saving notification to DB for user ${userId}:`, e);
      return null;
    }
  }

  /**
   * Sends a push notification to a single user.
   */
  async sendToUser(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<boolean> {
    logger.info(`[NotificationService] Preparing notification for user ${userId}: "${title}"`);
    
    // Save to DB first
    const dbNotif = await this.saveNotificationToDb(userId, type, title, body, data);

    const user = await User.findById(userId).select('fcmToken status');
    if (!user || user.status !== UserStatus.ACTIVE || !user.fcmToken) {
      logger.warn(`[NotificationService] User ${userId} is inactive or lacks an FCM token. Stored in DB only.`);
      return false;
    }

    if (!isFirebaseInitialized || !messaging) {
      logger.warn(`[NotificationService] Firebase not initialized. Stored in DB only.`);
      return false;
    }

    try {
      const message = {
        token: user.fcmToken,
        notification: { title, body },
        data: data ? Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {} as Record<string, string>) : {},
        android: {
          notification: {
            sound: 'default',
            channelId: 'gyaanchakra_alerts',
            priority: 'high' as const,
          },
        },
      };

      await messaging.send(message);
      
      if (dbNotif) {
        dbNotif.isSent = true;
        dbNotif.sentAt = new Date();
        await dbNotif.save();
      }

      logger.info(`[NotificationService] Notification sent successfully to user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`[NotificationService] Error sending FCM message to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Sends push notifications to multiple specified users.
   */
  async sendToMultiple(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (userIds.length === 0) return;

    logger.info(`[NotificationService] Sending batch notifications to ${userIds.length} users: "${title}"`);

    // Create DB records for all users
    await Promise.all(userIds.map((uid) => this.saveNotificationToDb(uid, type, title, body, data)));

    if (!isFirebaseInitialized || !messaging) {
      logger.warn('[NotificationService] Firebase not initialized. Stored in DB only.');
      return;
    }

    const users = await User.find({ _id: { $in: userIds }, status: UserStatus.ACTIVE })
      .select('fcmToken')
      .lean();

    const tokens = users.map((u) => u.fcmToken).filter((t): t is string => !!t);
    if (tokens.length === 0) {
      logger.warn('[NotificationService] No active user tokens found for specified users.');
      return;
    }

    await this.sendMulticastFCM(tokens, title, body, data);
  }

  /**
   * Broadcasts a notification to all active users.
   */
  async broadcastAll(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    logger.info(`[NotificationService] Starting global broadcast: "${title}"`);

    // Find all active users
    const users = await User.find({ status: UserStatus.ACTIVE, deletedAt: null })
      .select('_id fcmToken')
      .lean();

    if (users.length === 0) {
      logger.warn('[NotificationService] No active users to broadcast to.');
      return;
    }

    // Save notifications to DB for all users (runs in parallel chunks to handle large db sizes)
    const userIds = users.map((u) => u._id.toString());
    const chunkSize = 200;
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const slice = userIds.slice(i, i + chunkSize);
      await Promise.all(slice.map((uid) => this.saveNotificationToDb(uid, NotificationType.PROMOTIONAL, title, body, data)));
    }

    if (!isFirebaseInitialized || !messaging) {
      logger.warn('[NotificationService] Firebase not initialized. Global broadcast saved to DB only.');
      return;
    }

    const tokens = users.map((u) => u.fcmToken).filter((t): t is string => !!t);
    if (tokens.length === 0) {
      logger.warn('[NotificationService] No tokens available for broadcast.');
      return;
    }

    await this.sendMulticastFCM(tokens, title, body, data);
  }

  /**
   * Broadcasts a notification to a specific audience group.
   */
  async sendToAudience(
    audience: 'all' | 'quiz_participants' | 'challenge_participants',
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (audience === 'all') {
      await this.broadcastAll(title, body, data);
      return;
    }

    let userIds: string[] = [];
    if (audience === 'quiz_participants') {
      const participations = await DailyQuizParticipation.distinct('userId');
      userIds = participations.map((id) => id.toString());
    } else if (audience === 'challenge_participants') {
      const participations = await MegaChallengeParticipation.distinct('userId');
      userIds = participations.map((id) => id.toString());
    }

    if (userIds.length > 0) {
      await this.sendToMultiple(userIds, NotificationType.PROMOTIONAL, title, body, data);
    } else {
      logger.warn(`[NotificationService] No users found for audience group: ${audience}`);
    }
  }

  /**
   * Send FCM multicast in chunks of 500.
   */
  private async sendMulticastFCM(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (!messaging) return;

    const dataPayload = data ? Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key]);
      return acc;
    }, {} as Record<string, string>) : {};

    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      try {
        const payload = {
          tokens: chunk,
          notification: { title, body },
          data: dataPayload,
          android: {
            notification: {
              sound: 'default',
              channelId: 'gyaanchakra_alerts',
              priority: 'high' as const,
            },
          },
        };

        const response = await messaging.sendEachForMulticast(payload);
        logger.info(`[NotificationService] Multicast batch sent: ${response.successCount} successes, ${response.failureCount} failures.`);

        // Handle invalid/expired tokens (clean up) if needed
        if (response.failureCount > 0) {
          const tokensToRemove: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
              const code = resp.error.code;
              if (
                code === 'messaging/invalid-registration-token' ||
                code === 'messaging/registration-token-not-registered'
              ) {
                tokensToRemove.push(chunk[idx]);
              }
            }
          });

          if (tokensToRemove.length > 0) {
            await User.updateMany({ fcmToken: { $in: tokensToRemove } }, { $unset: { fcmToken: 1 } });
            logger.info(`[NotificationService] Unregistered ${tokensToRemove.length} stale FCM tokens.`);
          }
        }
      } catch (err) {
        logger.error(`[NotificationService] Error sending multicast batch starting at index ${i}:`, err);
      }
    }
  }

  /**
   * Triggers alert when a daily quiz is activated.
   */
  async sendQuizStarted(quiz: { id: string; title: string; rewardAmount: number }) {
    await this.broadcastAll(
      `Daily Quiz is Live! 🧠`,
      `"${quiz.title}" is now active. Play now to claim your ₹${quiz.rewardAmount} reward!`,
      { type: NotificationType.QUIZ_STARTED, quizId: quiz.id }
    );
  }

  /**
   * Triggers alert when a mega challenge starts.
   */
  async sendChallengeOpened(challenge: { id: string; title: string; rewardAmount: number }) {
    await this.broadcastAll(
      `Mega Challenge is Open! 🏆`,
      `"${challenge.title}" is officially open. Play now to get shortlisted for the ₹${challenge.rewardAmount} prize!`,
      { type: NotificationType.MEGA_CHALLENGE_OPEN, challengeId: challenge.id }
    );
  }

  /**
   * Sends winner announcement push.
   */
  async sendWinnerAnnounced(winnerName: string, contestTitle: string, contestType: string, rewardAmount: number, userId: string) {
    // 1. Send push to the winner specifically
    await this.sendToUser(
      userId,
      NotificationType.REWARD_CREDITED,
      `You Won! 🎉`,
      `Congratulations! You were selected as the winner for "${contestTitle}". ₹${rewardAmount} credited to your wallet.`,
      { type: NotificationType.REWARD_CREDITED }
    );

    // 2. Broadcast to all users about the draw winner
    const displayName = winnerName || 'A lucky user';
    await this.broadcastAll(
      `Winner Announced! 🥳`,
      `${displayName} won the lucky draw for "${contestTitle}" and earned ₹${rewardAmount}!`,
      { type: NotificationType.WINNER_ANNOUNCED }
    );
  }

  /**
   * Direct notification for wallet credits.
   */
  async sendRewardCredited(userId: string, amount: number, description: string) {
    await this.sendToUser(
      userId,
      NotificationType.REWARD_CREDITED,
      `Wallet Credited! 💰`,
      `Your wallet has been credited with ₹${amount} for: ${description}.`,
      { type: NotificationType.REWARD_CREDITED }
    );
  }
}

export const notificationService = new NotificationService();
