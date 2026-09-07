import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, uuidParam } from '../../middleware/validate';
import { createConversationSchema, sendMessageSchema } from './ai-chat.validation';
import * as ctrl from './ai-chat.controller';

/**
 * @swagger
 * tags:
 *   name: AI Chat
 *   description: AI-powered chat assistant
 */
const router = Router();
router.use(authenticate);

router.get('/', ctrl.listConversations);
router.post('/', validate({ body: createConversationSchema }), ctrl.createConversation);
router.get('/:id', validate({ params: uuidParam }), ctrl.getConversation);
router.post('/:id/messages', validate({ params: uuidParam, body: sendMessageSchema }), ctrl.sendMessage);
router.delete('/:id', validate({ params: uuidParam }), ctrl.deleteConversation);

export default router;
