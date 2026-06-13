import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiError } from '../utils/apiError';
import { UserRole } from '../models/User';

export const requireRole = (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role as UserRole)) {
      throw ApiError.forbidden(`Requires one of: ${roles.join(', ')}`);
    }
    next();
  };

export const requireAdmin = requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);
