export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: unknown[];

  constructor(message: string, statusCode: number, errors?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: unknown[]) {
    return new ApiError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404);
  }

  static conflict(message: string) {
    return new ApiError(message, 409);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(message, 429);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(message, 500);
  }
}
