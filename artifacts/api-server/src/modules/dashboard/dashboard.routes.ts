import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin, requireOrg, requireIndividual } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { dashboardQuerySchema } from './dashboard.validation';
import * as ctrl from './dashboard.controller';

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Role-specific dashboards
 */
const router = Router();
router.use(authenticate);

router.get('/admin', requireAdmin, validate({ query: dashboardQuerySchema }), ctrl.getAdminDashboard);
router.get('/org', requireOrg, validate({ query: dashboardQuerySchema }), ctrl.getOrgDashboard);
router.get('/individual', requireIndividual, validate({ query: dashboardQuerySchema }), ctrl.getIndividualDashboard);

export default router;
