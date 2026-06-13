import { Router, Request, Response, NextFunction } from 'express';
import { megaChallengeService } from '../services/MegaChallengeService';
import { winnerService } from '../services/WinnerService';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { ContestType } from '../models/Winner';
import { Winner } from '../models/Winner';

const router = Router();

router.get('/active', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const challenge = await megaChallengeService.getActiveChallenge(req.user?.userId);
    return sendSuccess(res, challenge ? 'Active challenge fetched' : 'No active challenge', challenge);
  } catch (e) { next(e); }
});

router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { challengeId, answers } = req.body;
    const result = await megaChallengeService.submitAnswers(req.user!.userId, challengeId, answers);
    return sendSuccess(res, result.message, result);
  } catch (e) { next(e); }
});

router.get('/winners', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const winners = await Winner.find({ contestType: ContestType.MEGA_CHALLENGE })
      .populate('userId', 'name profilePhoto city')
      .sort({ announcementDate: -1 })
      .limit(10);
    return sendSuccess(res, 'Winners fetched', winners);
  } catch (e) { next(e); }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const result = await megaChallengeService.getAllChallenges(skip, limit);
    return sendSuccess(res, 'Challenges fetched', result);
  } catch (e) { next(e); }
});

export default router;
