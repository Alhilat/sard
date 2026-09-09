import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireOrg } from '../../middleware/rbac';
import { validate, uuidParam } from '../../middleware/validate';
import { uploadSingle } from '../../middleware/upload';
import { uploadLimiter } from '../../middleware/rateLimiter';
import { updateOrgSchema, verificationRequestSchema } from './organizations.validation';
import * as ctrl from './organizations.controller';

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Organization management
 */
const router = Router();

router.get('/', ctrl.listOrgs);
router.get('/:id', validate({ params: uuidParam }), ctrl.getOrg);
router.put('/:id', authenticate, requireOrg, validate({ params: uuidParam, body: updateOrgSchema }), ctrl.updateOrg);
router.post('/:id/logo', authenticate, requireOrg, uploadLimiter, validate({ params: uuidParam }), uploadSingle, ctrl.uploadLogo);
router.post('/:id/cover', authenticate, requireOrg, uploadLimiter, validate({ params: uuidParam }), uploadSingle, ctrl.uploadCover);
router.post('/:id/verify', authenticate, requireOrg, validate({ params: uuidParam, body: verificationRequestSchema }), ctrl.requestVerification);
router.get('/:id/activities', validate({ params: uuidParam }), ctrl.getOrgActivities);
router.get('/:id/courses', validate({ params: uuidParam }), ctrl.getOrgCourses);

export default router;
