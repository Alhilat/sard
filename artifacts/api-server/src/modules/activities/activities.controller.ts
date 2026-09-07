import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse';
import * as svc from './activities.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const listActivities = asyncHandler(async (req, res) => { const r = await svc.listActivities(req.query as any); sendPaginated(res, r.activities, r.pagination); });
export const createActivity = asyncHandler(async (req, res) => { sendCreated(res, await svc.createActivity(req.user!.userId, req.body), 'Activity created'); });
export const getActivity = asyncHandler(async (req, res) => { sendSuccess(res, await svc.getActivity(p(req, 'id'))); });
export const updateActivity = asyncHandler(async (req, res) => { sendSuccess(res, await svc.updateActivity(p(req, 'id'), req.user!.userId, req.body), 'Activity updated'); });
export const cancelActivity = asyncHandler(async (req, res) => { sendSuccess(res, await svc.cancelActivity(p(req, 'id'), req.user!.userId)); });
export const register = asyncHandler(async (req, res) => { sendCreated(res, await svc.register(p(req, 'id'), req.user!.userId), 'Registered'); });
export const cancelRegistration = asyncHandler(async (req, res) => { sendSuccess(res, await svc.cancelRegistration(p(req, 'id'), req.user!.userId)); });
export const getRegistrations = asyncHandler(async (req, res) => { const r = await svc.getRegistrations(p(req, 'id'), req.user!.userId, req.query as any); sendPaginated(res, r.registrations, r.pagination); });
