import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import * as svc from './notifications.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const listNotifications = asyncHandler(async (req, res) => { const r = await svc.listNotifications(req.user!.userId, req.query as any); sendPaginated(res, r.notifications, r.pagination); });
export const markAsRead = asyncHandler(async (req, res) => { sendSuccess(res, await svc.markAsRead(p(req, 'id'), req.user!.userId)); });
export const markAllAsRead = asyncHandler(async (req, res) => { sendSuccess(res, await svc.markAllAsRead(req.user!.userId)); });
export const getPreferences = asyncHandler(async (req, res) => { sendSuccess(res, await svc.getPreferences(req.user!.userId)); });
export const updatePreferences = asyncHandler(async (req, res) => { sendSuccess(res, await svc.updatePreferences(req.user!.userId, req.body), 'Preferences updated'); });
