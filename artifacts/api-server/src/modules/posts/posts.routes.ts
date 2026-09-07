import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { validate, uuidParam } from '../../middleware/validate';
import { z } from 'zod';
import { createPostSchema, updatePostSchema, addCommentSchema } from './posts.validation';
import * as ctrl from './posts.controller';

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Social posts, comments, likes, shares
 */
const router = Router();

router.get('/', optionalAuthenticate, ctrl.getFeed);
router.post('/', authenticate, validate({ body: createPostSchema }), ctrl.createPost);
router.get('/:id', validate({ params: uuidParam }), ctrl.getPost);
router.put('/:id', authenticate, validate({ params: uuidParam, body: updatePostSchema }), ctrl.updatePost);
router.delete('/:id', authenticate, validate({ params: uuidParam }), ctrl.deletePost);

router.post('/:id/like', authenticate, validate({ params: uuidParam }), ctrl.likePost);
router.delete('/:id/like', authenticate, validate({ params: uuidParam }), ctrl.unlikePost);
router.post('/:id/share', authenticate, validate({ params: uuidParam }), ctrl.sharePost);
router.delete('/:id/share', authenticate, validate({ params: uuidParam }), ctrl.unsharePost);

router.get('/:id/comments', validate({ params: uuidParam }), ctrl.getComments);
router.post('/:id/comments', authenticate, validate({ params: uuidParam, body: addCommentSchema }), ctrl.addComment);
router.delete('/:id/comments/:commentId', authenticate, ctrl.deleteComment);

export default router;
