import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ForbiddenError, UnauthorizedError } from './errorHandler';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(new UnauthorizedError());
  next();
}

export function requireRole(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.roleName)) {
      return next(new ForbiddenError(`Role '${req.user.roleName}' not permitted`));
    }
    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireOrg = requireRole('organization', 'admin');
export const requireIndividual = requireRole('individual', 'admin');
