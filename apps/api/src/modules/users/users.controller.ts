import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendNoContent, sendPaginated } from '../../utils/apiResponse';
import { getFileUrl } from '../../middleware/upload';
import * as svc from './users.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await svc.getUser(req.user!.userId);
  sendSuccess(res, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.updateProfile(req.user!.userId, req.body);
  sendSuccess(res, result, 'Profile updated');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.changePassword(req.user!.userId, req.body.current_password, req.body.new_password);
  sendSuccess(res, result);
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  await svc.softDeleteAccount(req.user!.userId);
  sendNoContent(res);
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new Error('No file uploaded');
  const result = await svc.setAvatar(
    req.user!.userId, getFileUrl(req.file), req.file.mimetype, req.file.size
  );
  sendSuccess(res, result, 'Avatar updated');
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await svc.getUser(p(req, 'id'));
  sendSuccess(res, user);
});

export const getUserPosts = asyncHandler(async (req: Request, res: Response) => {
  const { posts, pagination } = await svc.getUserPosts(p(req, 'id'), req.query as Record<string, string>);
  sendPaginated(res, posts, pagination);
});

export const follow = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.followEntity(req.user!.userId, 'user', p(req, 'id'));
  sendSuccess(res, result, 'Followed');
});

export const unfollow = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.unfollowEntity(req.user!.userId, 'user', p(req, 'id'));
  sendSuccess(res, result);
});
