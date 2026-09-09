import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, uuidParam } from '../../middleware/validate';
import { createGroupSchema, updateGroupSchema, updateMemberSchema } from './groups.validation';
import * as ctrl from './groups.controller';

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Community groups
 */
const router = Router();

router.get('/', ctrl.listGroups);
router.post('/', authenticate, validate({ body: createGroupSchema }), ctrl.createGroup);
router.get('/:id', validate({ params: uuidParam }), ctrl.getGroup);
router.put('/:id', authenticate, validate({ params: uuidParam, body: updateGroupSchema }), ctrl.updateGroup);
router.delete('/:id', authenticate, validate({ params: uuidParam }), ctrl.dissolveGroup);
router.get('/:id/members', validate({ params: uuidParam }), ctrl.getMembers);
router.post('/:id/join', authenticate, validate({ params: uuidParam }), ctrl.joinGroup);
router.delete('/:id/leave', authenticate, validate({ params: uuidParam }), ctrl.leaveGroup);
router.patch('/:id/members/:userId', authenticate, validate({ body: updateMemberSchema }), ctrl.updateMember);
router.delete('/:id/members/:userId', authenticate, ctrl.removeMember);

export default router;
