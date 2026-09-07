import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { validate, uuidParam } from '../../middleware/validate';
import { z } from 'zod';
import { updateUserStatusSchema, updateOrgStatusSchema, listUsersQuerySchema } from './admin.validation';
import * as ctrl from './admin.controller';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only management endpoints
 */
const router = Router();
router.use(authenticate, requireAdmin);

// Users
router.get('/users', validate({ query: listUsersQuerySchema }), ctrl.listUsers);
router.get('/users/:id', validate({ params: uuidParam }), ctrl.getUser);
router.patch('/users/:id/status', validate({ params: uuidParam, body: updateUserStatusSchema }), ctrl.updateUserStatus);
router.delete('/users/:id', validate({ params: uuidParam }), ctrl.deleteUser);
router.patch('/users/:id/role', validate({ params: uuidParam, body: z.object({ role_id: z.string().uuid() }) }), ctrl.assignRole);

// Organizations
router.get('/organizations', ctrl.listOrganizations);
router.patch('/organizations/:id/status', validate({ params: uuidParam, body: updateOrgStatusSchema }), ctrl.updateOrgStatus);

// Posts
router.get('/posts', ctrl.listPosts);
router.delete('/posts/:id', validate({ params: uuidParam }), ctrl.removePost);

// Roles
router.get('/roles', ctrl.listRoles);

export default router;
