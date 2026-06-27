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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile, password]
 *             properties:
 *               mobile: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { type: object }
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *       401: { description: Invalid credentials }
 */
router.post('/login', (req, res, next) => authController.login(req as any, res, next));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user and invalidate refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Logout successful }
 *       401: { description: Unauthorized }
 */
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req as any, res, next));

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Refresh JWT access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *       401: { description: Invalid or expired refresh token }
 */
router.post('/refresh-token', (req, res, next) => authController.refreshToken(req as any, res, next));

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Request password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile]
 *             properties:
 *               mobile: { type: string }
 *     responses:
 *       200: { description: OTP sent successfully }
 *       404: { description: User not found }
 */
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req as any, res, next));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Reset password with OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile, otp, newPassword]
 *             properties:
 *               mobile: { type: string }
 *               otp: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid or expired OTP }
 */
router.post('/reset-password', (req, res, next) => authController.resetPassword(req as any, res, next));

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password for logged in user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password changed successfully }
 *       400: { description: Incorrect current password }
 *       401: { description: Unauthorized }
 */
router.post('/change-password', authMiddleware, (req, res, next) => authController.changePassword(req as any, res, next));

export default router;
