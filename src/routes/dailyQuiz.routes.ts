import { Router, Request, Response, NextFunction } from 'express';
import { dailyQuizService } from '../services/DailyQuizService';
import { winnerService } from '../services/WinnerService';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { sendSuccess } from '../utils/response';
import { getPagination } from '../utils/paginate';
import { z } from 'zod';

const router = Router();

const quizSubmitSchema = z.object({
  body: z.object({
    quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quiz ID format'),
    selectedAnswerIndex: z.number().int().min(-1).max(3),
  }),
});

/**
 * @swagger
 * /daily-quiz/active:
 *   get:
 *     tags: [Daily Quiz]
 *     summary: Get active daily quiz for the user
 *     responses:
 *       200: { description: Active quiz fetched successfully }
 */
router.get('/active', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const quiz = await dailyQuizService.getActiveQuiz(req.user?.userId);
    return sendSuccess(res, quiz ? 'Active quiz fetched' : 'No active quiz', quiz);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /daily-quiz/submit:
 *   post:
 *     tags: [Daily Quiz]
 *     summary: Submit answer for the active daily quiz
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quizId, selectedAnswerIndex]
 *             properties:
 *               quizId: { type: string }
 *               selectedAnswerIndex: { type: integer }
 *     responses:
 *       200: { description: Answer submitted successfully }
 *       400: { description: Invalid submission or already submitted }
 *       401: { description: Unauthorized }
 */
router.post('/submit', authMiddleware, validate(quizSubmitSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { quizId, selectedAnswerIndex } = req.body;
    const result = await dailyQuizService.submitAnswer(req.user!.userId, quizId, selectedAnswerIndex);
    return sendSuccess(res, result.message, result);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /daily-quiz/{id}/result:
 *   get:
 *     tags: [Daily Quiz]
 *     summary: Get quiz submission result details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Result details fetched successfully }
 *       401: { description: Unauthorized }
 *       404: { description: Result not found }
 */
router.get('/:id/result', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await dailyQuizService.getQuizResult(req.params.id, req.user!.userId);
    return sendSuccess(res, 'Result fetched', result);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /daily-quiz/winners:
 *   get:
 *     tags: [Daily Quiz]
 *     security: []
 *     summary: Get list of recent daily quiz winners
 *     responses:
 *       200: { description: Winners list fetched successfully }
 */
router.get('/winners', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const winners = await winnerService.getRecentWinners(10);
    return sendSuccess(res, 'Winners fetched', winners);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /daily-quiz:
 *   get:
 *     tags: [Daily Quiz Admin]
 *     summary: List all quizzes (Admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Quizzes list fetched successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, limit } = getPagination(req);
    const result = await dailyQuizService.getAllQuizzes(skip, limit);
    return sendSuccess(res, 'Quizzes fetched', result);
  } catch (e) { next(e); }
});

export default router;
