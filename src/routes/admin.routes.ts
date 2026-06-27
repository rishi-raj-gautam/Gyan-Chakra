import { Router, Response, NextFunction } from 'express';
import { adminController } from '../controllers/AdminController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { userController } from '../controllers/UserController';

const router = Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, requireAdmin);

/**
 * @swagger
 * /admin/daily-quiz:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new daily quiz (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, options, correctAnswerIndex, rewardPoints, startTime, endTime]
 *             properties:
 *               question: { type: string }
 *               options: { type: array, items: { type: string } }
 *               correctAnswerIndex: { type: integer }
 *               rewardPoints: { type: integer }
 *               startTime: { type: string }
 *               endTime: { type: string }
 *     responses:
 *       201: { description: Daily quiz created successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post('/daily-quiz', (req, res, next) => adminController.createDailyQuiz(req as any, res, next));

/**
 * @swagger
 * /admin/daily-quiz/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update an existing daily quiz (Admin only)
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
 *             properties:
 *               question: { type: string }
 *               options: { type: array, items: { type: string } }
 *               correctAnswerIndex: { type: integer }
 *               rewardPoints: { type: integer }
 *               startTime: { type: string }
 *               endTime: { type: string }
 *     responses:
 *       200: { description: Daily quiz updated successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Quiz not found }
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a daily quiz (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Daily quiz deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Quiz not found }
 */
router.put('/daily-quiz/:id', (req, res, next) => adminController.updateDailyQuiz(req as any, res, next));
router.delete('/daily-quiz/:id', (req, res, next) => adminController.deleteDailyQuiz(req as any, res, next));

/**
 * @swagger
 * /admin/mega-challenge:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new mega challenge (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, questions, rewardPoints, entryFee, startTime, endTime]
 *             properties:
 *               title: { type: string }
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [question, options, correctAnswerIndex]
 *                   properties:
 *                     question: { type: string }
 *                     options: { type: array, items: { type: string } }
 *                     correctAnswerIndex: { type: integer }
 *               rewardPoints: { type: integer }
 *               entryFee: { type: integer }
 *               startTime: { type: string }
 *               endTime: { type: string }
 *     responses:
 *       201: { description: Mega challenge created successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post('/mega-challenge', (req, res, next) => adminController.createMegaChallenge(req as any, res, next));

/**
 * @swagger
 * /admin/mega-challenge/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update an existing mega challenge (Admin only)
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
 *     responses:
 *       200: { description: Mega challenge updated successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Challenge not found }
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a mega challenge (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Mega challenge deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Challenge not found }
 */
router.put('/mega-challenge/:id', (req, res, next) => adminController.updateMegaChallenge(req as any, res, next));
router.delete('/mega-challenge/:id', (req, res, next) => adminController.deleteMegaChallenge(req as any, res, next));

/**
 * @swagger
 * /admin/winners/daily-quiz/{quizId}/draw:
 *   post:
 *     tags: [Admin]
 *     summary: Draw winners for a specific daily quiz (Admin only)
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Draw completed successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post('/winners/daily-quiz/:quizId/draw', (req, res, next) => adminController.drawDailyQuizWinner(req as any, res, next));

/**
 * @swagger
 * /admin/winners/mega-challenge/{challengeId}/draw:
 *   post:
 *     tags: [Admin]
 *     summary: Draw winners for a specific mega challenge (Admin only)
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Draw completed successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post('/winners/mega-challenge/:challengeId/draw', (req, res, next) => adminController.drawMegaChallengeWinner(req as any, res, next));

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard analytics (Admin only)
 *     responses:
 *       200: { description: Dashboard stats fetched successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get('/analytics', (req, res, next) => adminController.getDashboardStats(req as any, res, next));

// User management
router.get('/users', (req, res, next) => userController.getAllUsers(req as any, res, next));
router.put('/users/:id/status', (req, res, next) => userController.updateUserStatus(req as any, res, next));

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     tags: [Admin]
 *     summary: Get application settings (Admin only)
 *     responses:
 *       200: { description: Settings fetched successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *   put:
 *     tags: [Admin]
 *     summary: Update application settings (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Settings updated successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get('/settings', (req, res, next) => adminController.getSettings(req as any, res, next));
router.put('/settings', (req, res, next) => adminController.updateSettings(req as any, res, next));

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get system audit logs (Admin only)
 *     responses:
 *       200: { description: Audit logs fetched successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req as any, res, next));

/**
 * @swagger
 * /admin/notifications/broadcast:
 *   post:
 *     tags: [Admin]
 *     summary: Broadcast push notifications to an audience segment (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message, audience]
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               audience: { type: string, enum: [all, quiz_participants, challenge_participants] }
 *     responses:
 *       200: { description: Broadcast dispatched successfully }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post('/notifications/broadcast', (req, res, next) => adminController.broadcastNotification(req as any, res, next));

export default router;
