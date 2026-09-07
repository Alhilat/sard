import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/apiResponse';
import * as svc from './blog.service';
import { addComment, likeItem, unlikeItem } from '../posts/posts.service';

const p = (req: Request, key: string) => String(req.params[key]);

export const listArticles = asyncHandler(async (req, res) => { const r = await svc.listArticles(req.query as any); sendPaginated(res, r.articles, r.pagination); });
export const createArticle = asyncHandler(async (req, res) => { sendCreated(res, await svc.createArticle(req.user!.userId, req.body), 'Article created'); });
export const getArticle = asyncHandler(async (req, res) => { sendSuccess(res, await svc.getArticleBySlug(String(req.params['slug']))); });
export const updateArticle = asyncHandler(async (req, res) => { sendSuccess(res, await svc.updateArticle(p(req, 'id'), req.user!.userId, req.user!.roleName, req.body), 'Article updated'); });
export const publishArticle = asyncHandler(async (req, res) => { sendSuccess(res, await svc.publishArticle(p(req, 'id'), req.user!.userId, req.user!.roleName)); });
export const deleteArticle = asyncHandler(async (req, res) => { sendSuccess(res, await svc.deleteArticle(p(req, 'id'), req.user!.userId, req.user!.roleName)); });
export const listCategories = asyncHandler(async (_req, res) => { sendSuccess(res, await svc.listCategories()); });
export const createCategory = asyncHandler(async (req, res) => { sendCreated(res, await svc.createCategory(req.body.name, req.body.slug), 'Category created'); });
export const likeArticle = asyncHandler(async (req, res) => { sendSuccess(res, await likeItem(req.user!.userId, 'blog_article', p(req, 'id'))); });
export const unlikeArticle = asyncHandler(async (req, res) => { sendSuccess(res, await unlikeItem(req.user!.userId, 'blog_article', p(req, 'id'))); });
export const getComments = asyncHandler(async (req, res) => { const r = await svc.getArticleComments(p(req, 'id'), req.query as any); sendPaginated(res, r.comments, r.pagination); });
export const addArticleComment = asyncHandler(async (req, res) => { sendCreated(res, await addComment(req.user!.userId, 'blog_article', p(req, 'id'), req.body.content, req.body.parent_comment_id)); });
