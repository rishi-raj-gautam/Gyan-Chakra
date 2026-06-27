import { Winner, IWinner, ContestType, WinnerStatus } from '../models/Winner';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { Transaction, TransactionType, TransactionCategory, TransactionStatus } from '../models/Transaction';
import { userRepository } from '../repositories/UserRepository';
import { dailyQuizRepository } from '../repositories/DailyQuizRepository';
import { megaChallengeRepository } from '../repositories/MegaChallengeRepository';
import { notificationService } from './NotificationService';
import { ApiError } from '../utils/apiError';
import { logger, auditLogger } from '../utils/logger';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class WinnerService {
  /**
   * Cryptographically fair random winner selection from eligible pool
   */
  private selectRandom<T>(pool: T[]): T {
    if (pool.length === 0) throw ApiError.badRequest('No eligible participants');
    const randomIndex = crypto.randomInt(0, pool.length);
    return pool[randomIndex];
  }

  async selectDailyQuizWinner(
    quizId: string,
    adminId: string,
    ipAddress?: string
  ): Promise<IWinner> {
    // Check no winner already exists
    const existingWinner = await Winner.findOne({
      contestType: ContestType.DAILY_QUIZ,
      contestId: quizId,
    });
    if (existingWinner) throw ApiError.conflict('Winner already selected for this quiz');

    // Get correct participants
    const participants = await dailyQuizRepository.getCorrectParticipants(quizId);
    if (participants.length === 0) throw ApiError.badRequest('No correct answers submitted');

    // Fair random selection
    const selected = this.selectRandom(participants);
    const selectedUser = selected.userId as any;

    // Get quiz reward amount
    const quiz = await dailyQuizRepository.findById(quizId);
    if (!quiz) throw ApiError.notFound('Quiz not found');

    const drawId = uuidv4();

    // Create winner record
    const winner = await Winner.create({
      contestType: ContestType.DAILY_QUIZ,
      contestId: quizId,
      userId: selectedUser._id || selectedUser,
      rewardAmount: quiz.rewardAmount,
      winnerStatus: WinnerStatus.ANNOUNCED,
      announcementDate: new Date(),
      drawId,
      selectedBy: 'admin',
      selectedByAdminId: adminId,
    });

    // Credit wallet
    const userId = (selectedUser._id || selectedUser).toString();
    await this.creditReward(userId, quiz.rewardAmount, `Daily Quiz Win - ${quiz.title}`, drawId);

    // Update quiz with winner
    await dailyQuizRepository.update(quizId, { winnerId: userId, status: 'completed' as any });

    // Update user stats
    await userRepository.incrementStats(userId, true);

    // Audit log
    await AuditLog.create({
      action: AuditAction.WINNER_SELECTED,
      performedBy: adminId,
      targetId: quizId,
      targetType: 'DailyQuiz',
      details: {
        drawId,
        winnerId: userId,
        rewardAmount: quiz.rewardAmount,
        poolSize: participants.length,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
    });

    auditLogger.info('Daily Quiz winner selected', {
      drawId,
      quizId,
      winnerId: userId,
      poolSize: participants.length,
      adminId,
    });

    // Send push notifications
    await notificationService.sendWinnerAnnounced(
      selectedUser.name,
      quiz.title,
      'daily_quiz',
      quiz.rewardAmount,
      userId
    ).catch((err) => logger.error('[WinnerService] FCM notification failed:', err));

    return winner;
  }

  async selectMegaChallengeWinner(
    challengeId: string,
    adminId: string,
    ipAddress?: string
  ): Promise<IWinner> {
    const existingWinner = await Winner.findOne({
      contestType: ContestType.MEGA_CHALLENGE,
      contestId: challengeId,
    });
    if (existingWinner) throw ApiError.conflict('Winner already selected for this challenge');

    const shortlisted = await megaChallengeRepository.getShortlistedParticipants(challengeId);
    if (shortlisted.length === 0) throw ApiError.badRequest('No shortlisted participants');

    const selected = this.selectRandom(shortlisted);
    const selectedUser = selected.userId as any;

    const challenge = await megaChallengeRepository.findById(challengeId);
    if (!challenge) throw ApiError.notFound('Challenge not found');

    const drawId = uuidv4();

    const winner = await Winner.create({
      contestType: ContestType.MEGA_CHALLENGE,
      contestId: challengeId,
      userId: selectedUser._id || selectedUser,
      rewardAmount: challenge.rewardAmount,
      winnerStatus: WinnerStatus.ANNOUNCED,
      announcementDate: new Date(),
      drawId,
      selectedBy: 'admin',
      selectedByAdminId: adminId,
    });

    const userId = (selectedUser._id || selectedUser).toString();
    await this.creditReward(userId, challenge.rewardAmount, `Mega Challenge Win - ${challenge.title}`, drawId);
    await userRepository.incrementStats(userId, true);

    await AuditLog.create({
      action: AuditAction.WINNER_SELECTED,
      performedBy: adminId,
      targetId: challengeId,
      targetType: 'MegaChallenge',
      details: { drawId, winnerId: userId, poolSize: shortlisted.length },
      ipAddress,
    });

    // Send push notifications
    await notificationService.sendWinnerAnnounced(
      selectedUser.name,
      challenge.title,
      'mega_challenge',
      challenge.rewardAmount,
      userId
    ).catch((err) => logger.error('[WinnerService] FCM notification failed:', err));

    return winner;
  }

  private async creditReward(
    userId: string,
    amount: number,
    description: string,
    referenceId: string
  ): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) return;

    const balanceBefore = user.walletBalance;
    await userRepository.creditWallet(userId, amount);

    await Transaction.create({
      userId,
      amount,
      type: TransactionType.CREDIT,
      category: TransactionCategory.CONTEST_WIN,
      description,
      status: TransactionStatus.COMPLETED,
      referenceId,
      balanceBefore,
      balanceAfter: balanceBefore + amount,
    });
  }

  async getRecentWinners(limit = 10): Promise<IWinner[]> {
    return Winner.find({ winnerStatus: WinnerStatus.ANNOUNCED })
      .populate('userId', 'name profilePhoto city')
      .sort({ announcementDate: -1 })
      .limit(limit);
  }

  async getUserWinHistory(userId: string, skip = 0, limit = 20) {
    const [winners, total] = await Promise.all([
      Winner.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Winner.countDocuments({ userId }),
    ]);
    return { winners, total };
  }
}

export const winnerService = new WinnerService();
