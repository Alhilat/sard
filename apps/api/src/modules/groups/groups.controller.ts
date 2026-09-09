import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse';
import * as svc from './groups.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const listGroups = asyncHandler(async (req, res) => { const r = await svc.listGroups(req.query as any); sendPaginated(res, r.groups, r.pagination); });
export const createGroup = asyncHandler(async (req, res) => { sendCreated(res, await svc.createGroup(req.user!.userId, req.body), 'Group created'); });
export const getGroup = asyncHandler(async (req, res) => { sendSuccess(res, await svc.getGroup(p(req, 'id'))); });
export const updateGroup = asyncHandler(async (req, res) => { sendSuccess(res, await svc.updateGroup(p(req, 'id'), req.user!.userId, req.body), 'Group updated'); });
export const dissolveGroup = asyncHandler(async (req, res) => { sendSuccess(res, await svc.dissolveGroup(p(req, 'id'), req.user!.userId)); });
export const getMembers = asyncHandler(async (req, res) => { const r = await svc.getMembers(p(req, 'id'), req.query as any); sendPaginated(res, r.members, r.pagination); });
export const joinGroup = asyncHandler(async (req, res) => { sendSuccess(res, await svc.joinGroup(p(req, 'id'), req.user!.userId)); });
export const leaveGroup = asyncHandler(async (req, res) => { sendSuccess(res, await svc.leaveGroup(p(req, 'id'), req.user!.userId)); });
export const updateMember = asyncHandler(async (req, res) => { sendSuccess(res, await svc.updateMember(p(req, 'id'), req.user!.userId, p(req, 'userId'), req.body)); });
export const removeMember = asyncHandler(async (req, res) => { sendSuccess(res, await svc.removeMember(p(req, 'id'), req.user!.userId, p(req, 'userId'))); });
