import { Router, Response, NextFunction } from 'express';
import { walletService } from '../services/WalletService';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { getPagination } from '../utils/paginate';

const router = Router();

router.get('/balance', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await walletService.getBalance(req.user!.userId);
    return sendSuccess(res, 'Balance fetched', data);
  } catch (e) { next(e); }
});

router.get('/transactions', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, limit } = getPagination(req);
    const data = await walletService.getTransactionHistory(req.user!.userId, skip, limit);
    return sendSuccess(res, 'Transactions fetched', data);
  } catch (e) { next(e); }
});

export default router;
