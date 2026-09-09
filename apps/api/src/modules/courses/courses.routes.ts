import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireOrg } from '../../middleware/rbac';
import { validate, uuidParam } from '../../middleware/validate';
import { createCourseSchema, updateCourseSchema, addMaterialSchema } from './courses.validation';
import * as ctrl from './courses.controller';

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Structured learning courses
 */
const router = Router();

router.get('/', ctrl.listCourses);
router.post('/', authenticate, requireOrg, validate({ body: createCourseSchema }), ctrl.createCourse);
router.get('/:id', validate({ params: uuidParam }), ctrl.getCourse);
router.put('/:id', authenticate, requireOrg, validate({ params: uuidParam, body: updateCourseSchema }), ctrl.updateCourse);
router.post('/:id/enroll', authenticate, validate({ params: uuidParam }), ctrl.enroll);
router.delete('/:id/enroll', authenticate, validate({ params: uuidParam }), ctrl.cancelEnrollment);
router.get('/:id/enrollments', authenticate, requireOrg, validate({ params: uuidParam }), ctrl.getEnrollments);
router.post('/:id/materials', authenticate, requireOrg, validate({ params: uuidParam, body: addMaterialSchema }), ctrl.addMaterial);
router.delete('/:id/materials/:materialId', authenticate, requireOrg, ctrl.removeMaterial);

export default router;
