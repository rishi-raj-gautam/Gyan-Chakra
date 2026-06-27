import jwt from 'jsonwebtoken';
import { env } from '../config/env';

import { ApiError } from './apiError';

export interface JwtPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
}

export const signAccessToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role, type: 'access' }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

export const signRefreshToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role, type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.jwt.secret) as JwtPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError('Access token expired', 401);
    }
    throw new ApiError('Invalid access token', 401);
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError('Refresh token expired', 401);
    }
    throw new ApiError('Invalid refresh token', 401);
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
