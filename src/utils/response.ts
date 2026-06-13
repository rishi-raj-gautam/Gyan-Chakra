import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response => {
  const response: ApiResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, message: string, data?: T): Response =>
  sendSuccess(res, message, data, 201);

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: unknown
): Response => {
  const response: ApiResponse = { success: false, message, error };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  message: string,
  data: T,
  page: number,
  limit: number,
  total: number
): Response =>
  sendSuccess(res, message, data, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
