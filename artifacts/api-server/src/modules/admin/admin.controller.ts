import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendNoContent, sendPaginated } from '../../utils/apiResponse';
import * as svc from './admin.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const listUsers = asyncHandler(async (req, res) => { const r = await svc.listUsers(req.query as any); sendPaginated(res, r.users, r.pagination); });
export const getUser = asyncHandler(async (req, res) => { sendSuccess(res, await svc.getUser(p(req, 'id'))); });
export const updateUserStatus = asyncHandler(async (req, res) => { sendSuccess(res, await svc.updateUserStatus(p(req, 'id'), req.body.status, req.body.reason)); });
export const deleteUser = asyncHandler(async (req, res) => { sendSuccess(res, await svc.deleteUser(p(req, 'id'))); });
export const listOrganizations = asyncHandler(async (req, res) => { const r = await svc.listOrganizations(req.query as any); sendPaginated(res, r.organizations, r.pagination); });
export const updateOrgStatus = asyncHandler(async (req, res) => { sendSuccess(res, await svc.updateOrgStatus(p(req, 'id'), req.body.status)); });
export const listPosts = asyncHandler(async (req, res) => { const r = await svc.listPosts(req.query as any); sendPaginated(res, r.posts, r.pagination); });
export const removePost = asyncHandler(async (req, res) => { sendSuccess(res, await svc.removePost(p(req, 'id'), req.user!.userId)); });
export const listRoles = asyncHandler(async (_req, res) => { sendSuccess(res, await svc.listRoles()); });
export const assignRole = asyncHandler(async (req, res) => { sendSuccess(res, await svc.assignRole(p(req, 'id'), req.body.role_id)); });
