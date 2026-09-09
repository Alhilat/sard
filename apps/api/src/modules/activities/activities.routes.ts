import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireOrg } from '../../middleware/rbac';
import { validate, uuidParam } from '../../middleware/validate';
import { createActivitySchema, updateActivitySchema } from './activities.validation';
import * as ctrl from './activities.controller';

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: Organization-hosted events
 */
const router = Router();

router.get('/', ctrl.listActivities);
router.post('/', authenticate, requireOrg, validate({ body: createActivitySchema }), ctrl.createActivity);
router.get('/:id', validate({ params: uuidParam }), ctrl.getActivity);
router.put('/:id', authenticate, requireOrg, validate({ params: uuidParam, body: updateActivitySchema }), ctrl.updateActivity);
router.delete('/:id', authenticate, requireOrg, validate({ params: uuidParam }), ctrl.cancelActivity);
router.post('/:id/register', authenticate, validate({ params: uuidParam }), ctrl.register);
router.delete('/:id/register', authenticate, validate({ params: uuidParam }), ctrl.cancelRegistration);
router.get('/:id/registrations', authenticate, requireOrg, validate({ params: uuidParam }), ctrl.getRegistrations);

export default router;
