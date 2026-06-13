import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  // MongoDB duplicate key
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0];
    res.status(409).json({ success: false, message: `${field} already exists` });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  // Unknown errors — log and hide details in prod
  logger.error('Unhandled error:', { error: err.message, stack: err.stack, url: req.url });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.isDev ? { error: err.message, stack: err.stack } : {}),
  });
};
