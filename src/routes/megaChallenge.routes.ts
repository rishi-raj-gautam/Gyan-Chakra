import { Router, Request, Response, NextFunction } from 'express';
import { megaChallengeService } from '../services/MegaChallengeService';
import { winnerService } from '../services/WinnerService';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { ContestType } from '../models/Winner';
import { Winner } from '../models/Winner';

const router = Router();

/**
 * @swagger
 * /mega-challenge/active:
 *   get:
 *     tags: [Mega Challenge]
 *     summary: Get active mega challenge for the user
 *     responses:
 *       200: { description: Active challenge fetched successfully }
 */
router.get('/active', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const challenge = await megaChallengeService.getActiveChallenge(req.user?.userId);
    return sendSuccess(res, challenge ? 'Active challenge fetched' : 'No active challenge', challenge);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /mega-challenge/submit:
 *   post:
 *     tags: [Mega Challenge]
 *     summary: Submit all answers for the active mega challenge
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [challengeId, answers]
 *             properties:
 *               challengeId: { type: string }
 *               answers: { type: array, items: { type: integer } }
 *     responses:
 *       200: { description: Answers submitted successfully }
 *       400: { description: Invalid submission or already submitted }
 *       401: { description: Unauthorized }
 */
router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { challengeId, answers } = req.body;
    const result = await megaChallengeService.submitAnswers(req.user!.userId, challengeId, answers);
    return sendSuccess(res, result.message, result);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /mega-challenge/winners:
 *   get:
 *     tags: [Mega Challenge]
 *     security: []
 *     summary: Get list of recent mega challenge winners
 *     responses:
 *       200: { description: Winners list fetched successfully }
 */
router.get('/winners', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const winners = await Winner.find({ contestType: ContestType.MEGA_CHALLENGE })
      .populate('userId', 'name profilePhoto city')
      .sort({ announcementDate: -1 })
      .limit(10);
    return sendSuccess(res, 'Winners fetched', winners);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /mega-challenge:
 *   get:
 *     tags: [Mega Challenge Admin]
 *     summary: List all challenges (Admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Challenges list fetched successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
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
