import { Router, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { getPagination } from '../utils/paginate';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { skip, limit } = getPagination(req);
    const [notifications, total, unread] = await Promise.all([
      Notification.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId: req.user!.userId }),
      Notification.countDocuments({ userId: req.user!.userId, isRead: false }),
    ]);
    return sendSuccess(res, 'Notifications fetched', { notifications, total, unread });
  } catch (e) { next(e); }
});

router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      { isRead: true }
    );
    return sendSuccess(res, 'Notification marked as read');
  } catch (e) { next(e); }
});

router.put('/read-all', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
    return sendSuccess(res, 'All notifications marked as read');
  } catch (e) { next(e); }
});

export default router;
