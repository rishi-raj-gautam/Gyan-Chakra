import { Router, Request, Response, NextFunction } from 'express';
import { dailyQuizService } from '../services/DailyQuizService';
import { winnerService } from '../services/WinnerService';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { getPagination } from '../utils/paginate';

const router = Router();

// Get active quiz (public, but tracks if user has participated)
router.get('/active', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const quiz = await dailyQuizService.getActiveQuiz(req.user?.userId);
    return sendSuccess(res, quiz ? 'Active quiz fetched' : 'No active quiz', quiz);
  } catch (e) { next(e); }
});

// Submit answer (authenticated)
router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { quizId, selectedAnswerIndex } = req.body;
    const result = await dailyQuizService.submitAnswer(req.user!.userId, quizId, selectedAnswerIndex);
    return sendSuccess(res, result.message, result);
  } catch (e) { next(e); }
});

// Get quiz result
router.get('/:id/result', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await dailyQuizService.getQuizResult(req.params.id, req.user!.userId);
    return sendSuccess(res, 'Result fetched', result);
  } catch (e) { next(e); }
});

// Get recent winners (public)
router.get('/winners', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const winners = await winnerService.getRecentWinners(10);
    return sendSuccess(res, 'Winners fetched', winners);
  } catch (e) { next(e); }
});

// Get all quizzes (admin)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, limit } = getPagination(req);
    const result = await dailyQuizService.getAllQuizzes(skip, limit);
    return sendSuccess(res, 'Quizzes fetched', result);
  } catch (e) { next(e); }
});

export default router;
