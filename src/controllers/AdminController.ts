import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { dailyQuizService } from '../services/DailyQuizService';
import { megaChallengeService } from '../services/MegaChallengeService';
import { winnerService } from '../services/WinnerService';
import { walletService } from '../services/WalletService';
import { sendSuccess } from '../utils/response';
import { getPagination } from '../utils/paginate';
import { User } from '../models/User';
import { Winner } from '../models/Winner';
import { DailyQuizParticipation } from '../models/DailyQuizParticipation';
import { MegaChallengeParticipation } from '../models/MegaChallengeParticipation';
import { Transaction } from '../models/Transaction';
import { AuditLog } from '../models/AuditLog';
import { Settings } from '../models/Settings';

export class AdminController {
  // Daily Quiz
  async createDailyQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quiz = await dailyQuizService.createQuiz(req.body, req.user!.userId);
      return sendSuccess(res, 'Daily quiz created', quiz, 201);
    } catch (e) { next(e); }
  }

  async updateDailyQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quiz = await dailyQuizService.updateQuiz(req.params.id, req.body);
      return sendSuccess(res, 'Daily quiz updated', quiz);
    } catch (e) { next(e); }
  }

  async deleteDailyQuiz(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await dailyQuizService.deleteQuiz(req.params.id);
      return sendSuccess(res, 'Daily quiz deleted');
    } catch (e) { next(e); }
  }

  // Mega Challenge
  async createMegaChallenge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const challenge = await megaChallengeService.createChallenge(req.body, req.user!.userId);
      return sendSuccess(res, 'Mega challenge created', challenge, 201);
    } catch (e) { next(e); }
  }

  async updateMegaChallenge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const challenge = await megaChallengeService.updateChallenge(req.params.id, req.body);
      return sendSuccess(res, 'Mega challenge updated', challenge);
    } catch (e) { next(e); }
  }

  async deleteMegaChallenge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await megaChallengeService.deleteChallenge(req.params.id);
      return sendSuccess(res, 'Mega challenge deleted');
    } catch (e) { next(e); }
  }

  // Winner draw
  async drawDailyQuizWinner(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const winner = await winnerService.selectDailyQuizWinner(
        req.params.quizId,
        req.user!.userId,
        req.ip
      );
      return sendSuccess(res, 'Winner selected successfully', winner);
    } catch (e) { next(e); }
  }

  async drawMegaChallengeWinner(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const winner = await winnerService.selectMegaChallengeWinner(
        req.params.challengeId,
        req.user!.userId,
        req.ip
      );
      return sendSuccess(res, 'Winner selected successfully', winner);
    } catch (e) { next(e); }
  }

  // Analytics
  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalWinners,
        totalTransactions,
        recentWinners,
      ] = await Promise.all([
        User.countDocuments({ deletedAt: null }),
        User.countDocuments({ status: 'active', deletedAt: null }),
        Winner.countDocuments(),
        Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
        winnerService.getRecentWinners(5),
      ]);

      return sendSuccess(res, 'Dashboard stats', {
        totalUsers,
        activeUsers,
        totalWinners,
        totalRewardsDistributed: totalTransactions[0]?.total || 0,
        recentWinners,
      });
    } catch (e) { next(e); }
  }

  // Settings
  async getSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await Settings.find();
      const result = settings.reduce((acc: any, s) => { acc[s.key] = s.value; return acc; }, {});
      return sendSuccess(res, 'Settings fetched', result);
    } catch (e) { next(e); }
  }

  async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key, value, description } = req.body;
      const settings = await Settings.findOneAndUpdate(
        { key },
        { value, description, updatedBy: req.user!.userId },
        { upsert: true, new: true }
      );
      return sendSuccess(res, 'Settings updated', settings);
    } catch (e) { next(e); }
  }

  // Audit logs
  async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { skip, limit } = getPagination(req);
      const [logs, total] = await Promise.all([
        AuditLog.find()
          .populate('performedBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        AuditLog.countDocuments(),
      ]);
      return sendSuccess(res, 'Audit logs fetched', { logs, total });
    } catch (e) { next(e); }
  }
}

export const adminController = new AdminController();
