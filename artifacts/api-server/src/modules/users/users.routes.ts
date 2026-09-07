import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, uuidParam } from '../../middleware/validate';
import { uploadSingle } from '../../middleware/upload';
import { uploadLimiter } from '../../middleware/rateLimiter';
import { updateProfileSchema, changePasswordSchema } from './users.validation';
import * as ctrl from './users.controller';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

const router = Router();

router.get('/me', authenticate, ctrl.getMe);
router.put('/me', authenticate, validate({ body: updateProfileSchema }), ctrl.updateProfile);
router.put('/me/password', authenticate, validate({ body: changePasswordSchema }), ctrl.changePassword);
router.delete('/me', authenticate, ctrl.deleteAccount);
router.post('/me/avatar', authenticate, uploadLimiter, uploadSingle, ctrl.uploadAvatar);

router.get('/:id', authenticate, validate({ params: uuidParam }), ctrl.getUser);
router.get('/:id/posts', validate({ params: uuidParam }), ctrl.getUserPosts);
router.post('/:id/follow', authenticate, validate({ params: uuidParam }), ctrl.follow);
router.delete('/:id/follow', authenticate, validate({ params: uuidParam }), ctrl.unfollow);

export default router;
