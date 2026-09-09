import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse';
import * as svc from './ai-chat.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const listConversations = asyncHandler(async (req, res) => { const r = await svc.listConversations(req.user!.userId, req.query as any); sendPaginated(res, r.conversations, r.pagination); });
export const createConversation = asyncHandler(async (req, res) => { sendCreated(res, await svc.createConversation(req.user!.userId, req.body.title), 'Conversation created'); });
export const getConversation = asyncHandler(async (req, res) => { sendSuccess(res, await svc.getConversation(p(req, 'id'), req.user!.userId, req.query as any)); });
export const sendMessage = asyncHandler(async (req, res) => { sendSuccess(res, await svc.sendMessage(p(req, 'id'), req.user!.userId, req.body.content)); });
export const deleteConversation = asyncHandler(async (req, res) => { sendSuccess(res, await svc.deleteConversation(p(req, 'id'), req.user!.userId)); });
