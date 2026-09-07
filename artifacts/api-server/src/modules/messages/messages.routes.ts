import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, uuidParam } from '../../middleware/validate';
import { createConversationSchema, sendMessageSchema } from './messages.validation';
import * as ctrl from './messages.controller';

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Direct messaging
 */
const router = Router();
router.use(authenticate);

router.get('/conversations', ctrl.listConversations);
router.post('/conversations', validate({ body: createConversationSchema }), ctrl.createConversation);
router.get('/conversations/:id', validate({ params: uuidParam }), ctrl.getConversation);
router.post('/conversations/:id/messages', validate({ params: uuidParam, body: sendMessageSchema }), ctrl.sendMessage);

export default router;
