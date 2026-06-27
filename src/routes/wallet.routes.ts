import { Router, Response, NextFunction } from 'express';
import { walletService } from '../services/WalletService';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { getPagination } from '../utils/paginate';

const router = Router();

/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     tags: [Wallet]
 *     summary: Get user wallet balance and lifetime earnings
 *     responses:
 *       200: { description: Balance fetched successfully }
 *       401: { description: Unauthorized }
 */
router.get('/balance', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await walletService.getBalance(req.user!.userId);
    return sendSuccess(res, 'Balance fetched', data);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     tags: [Wallet]
 *     summary: Get user transaction history
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Transactions fetched successfully }
 *       401: { description: Unauthorized }
 */
router.get('/transactions', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, limit } = getPagination(req);
    const data = await walletService.getTransactionHistory(req.user!.userId, skip, limit);
    return sendSuccess(res, 'Transactions fetched', data);
  } catch (e) { next(e); }
});

export default router;
