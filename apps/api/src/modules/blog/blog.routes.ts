import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin, requireOrg } from '../../middleware/rbac';
import { validate, uuidParam } from '../../middleware/validate';
import { createArticleSchema, updateArticleSchema, createCategorySchema } from './blog.validation';
import { z } from 'zod';
import * as ctrl from './blog.controller';

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog articles and categories
 */
const router = Router();

router.get('/articles', ctrl.listArticles);
router.post('/articles', authenticate, requireOrg, validate({ body: createArticleSchema }), ctrl.createArticle);
router.get('/articles/:slug', ctrl.getArticle);
router.put('/articles/:id', authenticate, validate({ params: uuidParam, body: updateArticleSchema }), ctrl.updateArticle);
router.post('/articles/:id/publish', authenticate, validate({ params: uuidParam }), ctrl.publishArticle);
router.delete('/articles/:id', authenticate, validate({ params: uuidParam }), ctrl.deleteArticle);
router.post('/articles/:id/like', authenticate, validate({ params: uuidParam }), ctrl.likeArticle);
router.delete('/articles/:id/like', authenticate, validate({ params: uuidParam }), ctrl.unlikeArticle);
router.get('/articles/:id/comments', validate({ params: uuidParam }), ctrl.getComments);
router.post('/articles/:id/comments', authenticate, validate({ params: uuidParam }), ctrl.addArticleComment);

router.get('/categories', ctrl.listCategories);
router.post('/categories', authenticate, requireAdmin, validate({ body: createCategorySchema }), ctrl.createCategory);

export default router;
