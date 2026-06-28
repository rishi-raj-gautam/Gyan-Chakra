import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get logged-in user profile
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       401: { description: Unauthorized }
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               city: { type: string }
 *               aboutMe: { type: string }
 *               dateOfBirth: { type: string }
 *               fcmToken: { type: string }
 *     responses:
 *       200: { description: Profile updated successfully }
 *       401: { description: Unauthorized }
 */
router.get('/profile', authMiddleware, (req, res, next) => userController.getProfile(req as any, res, next));
router.put('/profile', authMiddleware, (req, res, next) => userController.updateProfile(req as any, res, next));
router.post('/profile/test-push', authMiddleware, (req, res, next) => userController.sendTestPushToSelf(req as any, res, next));

/**
 * @swagger
 * /users/account:
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete user account
 *     responses:
 *       200: { description: Account deleted successfully }
 *       401: { description: Unauthorized }
 */
router.delete('/account', authMiddleware, (req, res, next) => userController.deleteAccount(req as any, res, next));

/**
 * @swagger
 * /users/stats:
 *   get:
 *     tags: [Users]
 *     summary: Get user contest and earnings stats
 *     responses:
 *       200: { description: Stats fetched successfully }
 *       401: { description: Unauthorized }
 */
router.get('/stats', authMiddleware, (req, res, next) => userController.getStats(req as any, res, next));

/**
 * @swagger
 * /users/history:
 *   get:
 *     tags: [Users]
 *     summary: Get user contest history (quizzes & mega challenges)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: History fetched successfully }
 *       401: { description: Unauthorized }
 */
router.get('/history', authMiddleware, (req, res, next) => userController.getContestHistory(req as any, res, next));

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users Admin]
 *     summary: Get all users (Admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Users list fetched successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get('/', authMiddleware, requireAdmin, (req, res, next) => userController.getAllUsers(req as any, res, next));

/**
 * @swagger
 * /users/{id}/status:
 *   put:
 *     tags: [Users Admin]
 *     summary: Update user account status (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, suspended, blocked] }
 *     responses:
 *       200: { description: User status updated successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: User not found }
 */
router.put('/:id/status', authMiddleware, requireAdmin, (req, res, next) => userController.updateUserStatus(req as any, res, next));

export default router;
