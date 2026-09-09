import type { Pagination } from './apiResponse';

export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function parsePagination(query: PaginationQuery, maxLimit = 100): PaginationResult {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}

export function buildPagination(page: number, limit: number, total: number): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
