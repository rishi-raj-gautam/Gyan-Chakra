import { Request } from 'express';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const getPagination = (req: Request): PaginationOptions => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const paginateResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) => ({
  data,
  meta: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});
