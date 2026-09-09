import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse';
import * as svc from './reports.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const createReport = asyncHandler(async (req, res) => { sendCreated(res, await svc.createReport(req.user!.userId, req.body), 'Report submitted'); });
export const listReports = asyncHandler(async (req, res) => { const r = await svc.listReports(req.query as any); sendPaginated(res, r.reports, r.pagination); });
export const resolveReport = asyncHandler(async (req, res) => { sendSuccess(res, await svc.resolveReport(p(req, 'id'), req.user!.userId, req.body.resolution)); });
export const dismissReport = asyncHandler(async (req, res) => { sendSuccess(res, await svc.dismissReport(p(req, 'id'))); });
