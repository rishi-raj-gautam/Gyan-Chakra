import cron from 'node-cron';
import { DailyQuiz, QuizStatus } from '../models/DailyQuiz';
import { MegaChallenge, ChallengeStatus } from '../models/MegaChallenge';
import { Settings } from '../models/Settings';
import { notificationService } from '../services/NotificationService';
import { logger } from '../utils/logger';

export const initCronJobs = () => {
  // Every minute: activate scheduled quizzes
  cron.schedule('* * * * *', async () => {
    try {
      const toActivate = await DailyQuiz.find({
        status: QuizStatus.SCHEDULED,
        startTime: { $lte: new Date() },
      });
      for (const quiz of toActivate) {
        await DailyQuiz.findByIdAndUpdate(quiz.id, { status: QuizStatus.ACTIVE });
        logger.info(`[CRON] Activated daily quiz: ${quiz.title}`);
        await notificationService.sendQuizStarted({
          id: quiz.id || quiz._id.toString(),
          title: quiz.title,
          rewardAmount: quiz.rewardAmount,
        });
      }
    } catch (e) {
      logger.error('[CRON] Quiz activation error:', e);
    }
  });

  // Every minute: expire active quizzes past endTime
  cron.schedule('* * * * *', async () => {
    try {
      const toExpire = await DailyQuiz.find({
        status: QuizStatus.ACTIVE,
        endTime: { $lte: new Date() },
      });
      for (const quiz of toExpire) {
        await DailyQuiz.findByIdAndUpdate(quiz.id, { status: QuizStatus.EXPIRED });
        logger.info(`[CRON] Expired daily quiz: ${quiz.title}`);
      }
    } catch (e) {
      logger.error('[CRON] Quiz expiration error:', e);
    }
  });

  // Every minute: open scheduled mega challenges
  cron.schedule('* * * * *', async () => {
    try {
      const toOpen = await MegaChallenge.find({
        status: ChallengeStatus.DRAFT,
        startDate: { $lte: new Date() },
      });
      for (const c of toOpen) {
        await MegaChallenge.findByIdAndUpdate(c.id, { status: ChallengeStatus.OPEN });
        logger.info(`[CRON] Opened mega challenge: ${c.title}`);
        await notificationService.sendChallengeOpened({
          id: c.id || c._id.toString(),
          title: c.title,
          rewardAmount: c.rewardAmount,
        });
      }
    } catch (e) {
      logger.error('[CRON] Mega challenge open error:', e);
    }
  });

  // Every minute: close mega challenges past endDate
  cron.schedule('* * * * *', async () => {
    try {
      const toClose = await MegaChallenge.find({
        status: ChallengeStatus.OPEN,
        endDate: { $lte: new Date() },
      });
      for (const c of toClose) {
        await MegaChallenge.findByIdAndUpdate(c.id, { status: ChallengeStatus.CLOSED });
        logger.info(`[CRON] Closed mega challenge: ${c.title}`);
      }
    } catch (e) {
      logger.error('[CRON] Mega challenge close error:', e);
    }
  });

  // Daily at midnight: analytics aggregation placeholder
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] Daily analytics aggregation running...');
    // Future: compute daily stats and store in analytics collection
  });

  // Every minute: process scheduled notifications
  cron.schedule('* * * * *', async () => {
    try {
      const doc = await Settings.findOne({ key: 'notifications_schedule' });
      if (!doc) return;

      const list = doc.value as any[];
      if (!Array.isArray(list) || list.length === 0) return;

      let updated = false;
      const now = new Date();

      for (const notification of list) {
        if (notification.status === 'scheduled' && notification.scheduleTime) {
          const schedTime = new Date(notification.scheduleTime);
          if (schedTime <= now) {
            logger.info(`[CRON] Dispatching scheduled notification: ${notification.title}`);
            const report = await notificationService.sendToAudience(
              notification.audience,
              notification.title,
              notification.message,
              notification.targetUserIds
            );

            notification.status = 'sent';
            notification.recipientCount = report.recipientCount;
            notification.successCount = report.successCount;
            notification.failureCount = report.failureCount;
            notification.sentAt = now.toISOString();
            updated = true;
          }
        }
      }

      if (updated) {
        doc.markModified('value');
        await doc.save();
        logger.info('[CRON] Scheduled notifications list updated in settings');
      }
    } catch (e) {
      logger.error('[CRON] Scheduled notification processing error:', e);
    }
  });

  logger.info('✅ Cron jobs initialized');
};
