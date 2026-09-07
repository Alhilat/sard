import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema, loginSchema, refreshSchema,
  forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema,
} from './auth.validation';
import * as ctrl from './auth.controller';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), ctrl.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), ctrl.login);
router.post('/logout', authenticate, validate({ body: refreshSchema }), ctrl.logout);
router.post('/refresh', validate({ body: refreshSchema }), ctrl.refresh);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), ctrl.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), ctrl.resetPassword);
router.post('/verify-email', validate({ body: verifyEmailSchema }), ctrl.verifyEmail);
router.get('/me', authenticate, ctrl.getMe);

export default router;
