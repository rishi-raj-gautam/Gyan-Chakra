import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

// User routes
router.get('/profile', authMiddleware, (req, res, next) => userController.getProfile(req as any, res, next));
router.put('/profile', authMiddleware, (req, res, next) => userController.updateProfile(req as any, res, next));
router.delete('/account', authMiddleware, (req, res, next) => userController.deleteAccount(req as any, res, next));
router.get('/stats', authMiddleware, (req, res, next) => userController.getStats(req as any, res, next));
router.get('/history', authMiddleware, (req, res, next) => userController.getContestHistory(req as any, res, next));

// Admin routes
router.get('/', authMiddleware, requireAdmin, (req, res, next) => userController.getAllUsers(req as any, res, next));
router.put('/:id/status', authMiddleware, requireAdmin, (req, res, next) => userController.updateUserStatus(req as any, res, next));

export default router;
