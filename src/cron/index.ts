import cron from 'node-cron';
import { DailyQuiz, QuizStatus } from '../models/DailyQuiz';
import { MegaChallenge, ChallengeStatus } from '../models/MegaChallenge';
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

  logger.info('✅ Cron jobs initialized');
};
