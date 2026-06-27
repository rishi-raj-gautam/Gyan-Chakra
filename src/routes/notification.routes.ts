import { Router, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';
import { getPagination } from '../utils/paginate';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications for logged-in user
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Notifications list fetched successfully }
 *       401: { description: Unauthorized }
 */
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

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark a specific notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification marked as read successfully }
 *       401: { description: Unauthorized }
 */
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      { isRead: true }
    );
    return sendSuccess(res, 'Notification marked as read');
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all unread notifications for user as read
 *     responses:
 *       200: { description: All notifications marked as read successfully }
 *       401: { description: Unauthorized }
 */
router.put('/read-all', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
    return sendSuccess(res, 'All notifications marked as read');
  } catch (e) { next(e); }
});

export default router;
