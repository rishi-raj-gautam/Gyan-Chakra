import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, mobile, password]
 *             properties:
 *               name: { type: string }
 *               mobile: { type: string }
 *               password: { type: string, minLength: 6 }
 *               email: { type: string }
 *               referralCode: { type: string }
 *     responses:
 *       201: { description: Registration successful }
 *       409: { description: Mobile already registered }
 */
router.post('/register', (req, res, next) => authController.register(req as any, res, next));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Login with mobile and password
 */
router.post('/login', (req, res, next) => authController.login(req as any, res, next));

router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req as any, res, next));
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req as any, res, next));
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req as any, res, next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req as any, res, next));
router.post('/change-password', authMiddleware, (req, res, next) => authController.changePassword(req as any, res, next));

export default router;
