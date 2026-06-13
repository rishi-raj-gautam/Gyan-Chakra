import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: JwtPayload & { _id: string };
}

export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('status role');
    if (!user) throw ApiError.unauthorized('User not found');
    if (user.status === 'suspended' || user.status === 'blocked') {
      throw ApiError.forbidden('Account is suspended or blocked');
    }

    req.user = { ...decoded, _id: decoded.userId };
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      req.user = { ...decoded, _id: decoded.userId };
    }
  } catch {
    // Optional — continue without auth
  }
  next();
};
