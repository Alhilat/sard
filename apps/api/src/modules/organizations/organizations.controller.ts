import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse';
import { getFileUrl } from '../../middleware/upload';
import * as svc from './organizations.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const listOrgs = asyncHandler(async (req, res) => {
  const r = await svc.listOrgs(req.query as any);
  sendPaginated(res, r.orgs, r.pagination);
});

export const getOrg = asyncHandler(async (req, res) => {
  sendSuccess(res, await svc.getOrg(p(req, 'id')));
});

export const updateOrg = asyncHandler(async (req, res) => {
  sendSuccess(res, await svc.updateOrg(p(req, 'id'), req.user!.userId, req.body), 'Organization updated');
});

export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('No file uploaded');
  sendSuccess(res, await svc.setMedia(p(req, 'id'), req.user!.userId, getFileUrl(req.file), req.file.mimetype, req.file.size, 'logo'));
});

export const uploadCover = asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('No file uploaded');
  sendSuccess(res, await svc.setMedia(p(req, 'id'), req.user!.userId, getFileUrl(req.file), req.file.mimetype, req.file.size, 'cover'));
});

export const requestVerification = asyncHandler(async (req, res) => {
  sendCreated(res, await svc.requestVerification(p(req, 'id'), req.user!.userId, req.body.document_media_id), 'Verification requested');
});

export const getOrgActivities = asyncHandler(async (req, res) => {
  const r = await svc.getOrgActivities(p(req, 'id'), req.query as any);
  sendPaginated(res, r.activities, r.pagination);
});

export const getOrgCourses = asyncHandler(async (req, res) => {
  const r = await svc.getOrgCourses(p(req, 'id'), req.query as any);
  sendPaginated(res, r.courses, r.pagination);
});
