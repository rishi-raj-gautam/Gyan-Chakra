import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/apiError';

export const validate = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.slice(1).join('.'),
        message: issue.message,
      }));
      throw ApiError.badRequest('Validation failed', errors);
    }

    req.body = result.data.body || req.body;
    next();
  };
