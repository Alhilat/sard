import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../utils/apiResponse';
import * as svc from './posts.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const { posts, pagination } = await svc.getFeed(req.query as Record<string, string>, req.user?.userId);
  sendPaginated(res, posts, pagination);
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await svc.createPost(req.user!.userId, req.body);
  sendCreated(res, post, 'Post created');
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.getPost(p(req, 'id')));
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.updatePost(p(req, 'id'), req.user!.userId, req.body), 'Post updated');
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletePost(p(req, 'id'), req.user!.userId, req.user!.roleName === 'admin');
  sendNoContent(res);
});

export const likePost = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.likeItem(req.user!.userId, 'post', p(req, 'id')), 'Liked');
});

export const unlikePost = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.unlikeItem(req.user!.userId, 'post', p(req, 'id')));
});

export const sharePost = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.sharePost(req.user!.userId, p(req, 'id'), req.body.commentary), 'Shared');
});

export const unsharePost = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await svc.unsharePost(req.user!.userId, p(req, 'id')));
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { comments, pagination } = await svc.getComments('post', p(req, 'id'), req.query as Record<string, string>);
  sendPaginated(res, comments, pagination);
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await svc.addComment(req.user!.userId, 'post', p(req, 'id'), req.body.content, req.body.parent_comment_id);
  sendCreated(res, comment, 'Comment added');
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteComment(p(req, 'commentId'), req.user!.userId, req.user!.roleName === 'admin');
  sendNoContent(res);
});
