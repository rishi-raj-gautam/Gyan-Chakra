import { Router, Response, NextFunction } from 'express';
import { adminController } from '../controllers/AdminController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { userController } from '../controllers/UserController';

const router = Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, requireAdmin);

// Daily Quiz management
router.post('/daily-quiz', (req, res, next) => adminController.createDailyQuiz(req as any, res, next));
router.put('/daily-quiz/:id', (req, res, next) => adminController.updateDailyQuiz(req as any, res, next));
router.delete('/daily-quiz/:id', (req, res, next) => adminController.deleteDailyQuiz(req as any, res, next));

// Mega Challenge management
router.post('/mega-challenge', (req, res, next) => adminController.createMegaChallenge(req as any, res, next));
router.put('/mega-challenge/:id', (req, res, next) => adminController.updateMegaChallenge(req as any, res, next));
router.delete('/mega-challenge/:id', (req, res, next) => adminController.deleteMegaChallenge(req as any, res, next));

// Winner draw
router.post('/winners/daily-quiz/:quizId/draw', (req, res, next) => adminController.drawDailyQuizWinner(req as any, res, next));
router.post('/winners/mega-challenge/:challengeId/draw', (req, res, next) => adminController.drawMegaChallengeWinner(req as any, res, next));

// Analytics
router.get('/analytics', (req, res, next) => adminController.getDashboardStats(req as any, res, next));

// User management
router.get('/users', (req, res, next) => userController.getAllUsers(req as any, res, next));
router.put('/users/:id/status', (req, res, next) => userController.updateUserStatus(req as any, res, next));

// Settings
router.get('/settings', (req, res, next) => adminController.getSettings(req as any, res, next));
router.put('/settings', (req, res, next) => adminController.updateSettings(req as any, res, next));

// Audit logs
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req as any, res, next));

export default router;
