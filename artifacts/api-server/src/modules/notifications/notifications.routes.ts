import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as ctrl from './notifications.controller';
import { listNotificationsQuerySchema, notificationPreferencesSchema, notificationIdParamSchema } from './notifications.validation';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notifications
 */
const router = Router();

router.use(authenticate);
router.get('/', validate({ query: listNotificationsQuerySchema }), ctrl.listNotifications);
router.patch('/:id/read', validate({ params: notificationIdParamSchema }), ctrl.markAsRead);
router.post('/read-all', ctrl.markAllAsRead);
router.get('/preferences', ctrl.getPreferences);
router.put('/preferences', validate({ body: notificationPreferencesSchema }), ctrl.updatePreferences);

export default router;
