import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as svc from './dashboard.service';

export const getAdminDashboard = asyncHandler(async (_req, res) => {
  sendSuccess(res, await svc.getAdminDashboard());
});

export const getOrgDashboard = asyncHandler(async (req, res) => {
  sendSuccess(res, await svc.getOrgDashboard(req.user!.userId));
});

export const getIndividualDashboard = asyncHandler(async (req, res) => {
  sendSuccess(res, await svc.getIndividualDashboard(req.user!.userId));
});
