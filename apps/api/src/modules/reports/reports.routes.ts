import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { validate, uuidParam } from '../../middleware/validate';
import { z } from 'zod';
import { createReportSchema } from './reports.validation';
import * as ctrl from './reports.controller';

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Content moderation reports
 */
const router = Router();
router.use(authenticate);

router.post('/', validate({ body: createReportSchema }), ctrl.createReport);
router.get('/', requireAdmin, ctrl.listReports);
router.post('/:id/resolve', requireAdmin, validate({ params: uuidParam, body: z.object({ resolution: z.string().min(1) }) }), ctrl.resolveReport);
router.post('/:id/dismiss', requireAdmin, validate({ params: uuidParam }), ctrl.dismissReport);

export default router;
