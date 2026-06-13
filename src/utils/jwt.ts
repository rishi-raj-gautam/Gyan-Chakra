import jwt from 'jsonwebtoken';
import { env } from '../config/env';

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
  } catch {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
  } catch {
    throw new Error('Invalid or expired refresh token');
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
